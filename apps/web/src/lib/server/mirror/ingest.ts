/**
 * The ingest API (specs/003-library-mirror/contracts/ingest-api.md): plan, books, commit, abort.
 * One run at a time, held by a lock that expires. The browser only ever sees a committed
 * catalogue, so an interrupted run changes nothing it can see (FR-007).
 */
import {
	REMOVAL_CONFIRM_SHARE,
	type BooksRequest,
	type CommitRequest,
	type CommitResponse,
	type PlanRequest,
	type PlanResponse
} from '@longshelf/shared/ingest';
import { keyOf, missingBlobs, type Store } from './blobs.ts';

export const LOCK_MS = 2 * 60 * 60 * 1000;

export class IngestError extends Error {
	constructor(
		readonly status: 400 | 409,
		message: string,
		readonly detail?: string
	) {
		super(message);
	}
}

const fileKey = (files: { format: string; sha256: string }[]) =>
	files
		.map((f) => `${f.format}:${f.sha256}`)
		.sort()
		.join('|');

/** Takes the lock (or an expired one) and says what the mirror lacks. */
export async function plan(
	store: Store,
	req: PlanRequest,
	now = new Date()
): Promise<PlanResponse> {
	const { db } = store;
	const held = await db
		.prepare('SELECT run_id, started_at, expires_at FROM ingest_run WHERE id = 1')
		.first<{ run_id: string; started_at: string; expires_at: string }>();
	if (held && held.expires_at > now.toISOString())
		throw new IngestError(
			409,
			'Another upload is running.',
			`started ${held.started_at}, expires ${held.expires_at}`
		);
	const runId = crypto.randomUUID();
	await db
		.prepare(
			`INSERT INTO ingest_run (id, run_id, started_at, expires_at) VALUES (1, ?, ?, ?)
			 ON CONFLICT (id) DO UPDATE SET run_id = excluded.run_id, started_at = excluded.started_at,
			 expires_at = excluded.expires_at`
		)
		.bind(runId, now.toISOString(), new Date(now.getTime() + LOCK_MS).toISOString())
		.run();

	const [books, files] = await Promise.all([
		db
			.prepare(
				`SELECT id, metadata_hash, cover_sha256, json_extract(metadata, '$.title') AS title FROM book`
			)
			.all<{ id: string; metadata_hash: string; cover_sha256: string | null; title: string }>(),
		db
			.prepare('SELECT book_id, format, sha256 FROM book_file')
			.all<{ book_id: string; format: string; sha256: string }>()
	]);
	const filesByBook = new Map<string, { format: string; sha256: string }[]>();
	for (const f of files.results)
		filesByBook.set(f.book_id, [...(filesByBook.get(f.book_id) ?? []), f]);
	const existing = new Map(books.results.map((b) => [b.id, b]));

	const wanted = new Set(req.books.map((b) => b.id));
	const changedBooks = req.books
		.filter((b) => {
			const have = existing.get(b.id);
			return (
				!have ||
				have.metadata_hash !== b.metadataHash ||
				(have.cover_sha256 ?? undefined) !== b.cover?.sha256 ||
				fileKey(filesByBook.get(b.id) ?? []) !== fileKey(b.files)
			);
		})
		.map((b) => b.id);
	const removedBooks = books.results
		.filter((b) => !wanted.has(b.id))
		.map((b) => ({ id: b.id, title: b.title }));
	const referenced = req.books.flatMap((b) => [
		...(b.cover ? [b.cover.sha256] : []),
		...b.files.map((f) => f.sha256)
	]);

	return {
		runId,
		missingBlobs: await missingBlobs(db, referenced),
		changedBooks,
		newBooks: changedBooks.filter((id) => !existing.has(id)),
		removedBooks,
		removalNeedsConfirm:
			books.results.length > 0 && removedBooks.length > books.results.length * REMOVAL_CONFIRM_SHARE
	};
}

/** The current run, or 409 when `runId` doesn't hold the lock. */
export async function requireRun(db: D1Database, runId: string, now = new Date()) {
	const held = await db
		.prepare('SELECT run_id FROM ingest_run WHERE id = 1 AND run_id = ? AND expires_at > ?')
		.bind(runId, now.toISOString())
		.first();
	if (!held) throw new IngestError(409, 'This upload run is no longer active. Run it again.');
}

/** Writes up to 100 books' rows, after checking every object they refer to is stored. */
export async function writeBooks(store: Store, req: BooksRequest, now = new Date()) {
	const { db } = store;
	await requireRun(db, req.runId, now);
	const referenced = req.books.flatMap((b) => [
		...(b.coverSha256 ? [b.coverSha256] : []),
		...b.files.map((f) => f.sha256)
	]);
	const missing = await missingBlobs(db, referenced);
	if (missing.length)
		throw new IngestError(409, 'Some files were not uploaded yet.', missing.join(', '));

	const at = now.toISOString();
	const statements = req.books.flatMap((b) => [
		db
			.prepare(
				`INSERT INTO book (id, metadata, metadata_hash, cover_sha256, is_news, updated_at)
				 VALUES (?, ?, ?, ?, ?, ?)
				 ON CONFLICT (id) DO UPDATE SET metadata = excluded.metadata,
				 metadata_hash = excluded.metadata_hash, cover_sha256 = excluded.cover_sha256,
				 is_news = excluded.is_news, updated_at = excluded.updated_at`
			)
			.bind(
				b.id,
				JSON.stringify(b.metadata),
				b.metadataHash,
				b.coverSha256 ?? null,
				b.isNews ? 1 : 0,
				at
			),
		db.prepare('DELETE FROM book_file WHERE book_id = ?').bind(b.id),
		...b.files.map((f) =>
			db
				.prepare('INSERT INTO book_file (book_id, format, sha256, size) VALUES (?, ?, ?, ?)')
				.bind(b.id, f.format, f.sha256, f.size)
		)
	]);
	if (statements.length) await db.batch(statements);
	return { written: req.books.length };
}

/** Removes books, publishes the new catalogue, releases the lock, then frees unused objects. */
export async function commit(
	store: Store,
	req: CommitRequest,
	now = new Date()
): Promise<CommitResponse> {
	const { db } = store;
	await requireRun(db, req.runId, now);
	const catalog = await db
		.prepare("SELECT sha256 FROM blob WHERE sha256 = ? AND kind = 'catalog'")
		.bind(req.catalogSha256)
		.first();
	if (!catalog) throw new IngestError(409, 'The catalogue was not uploaded yet.');

	const total = (await db.prepare('SELECT COUNT(*) AS n FROM book').first<{ n: number }>())?.n ?? 0;
	if (req.removed.length > total * REMOVAL_CONFIRM_SHARE && total > 0 && !req.confirmRemovals)
		throw new IngestError(
			409,
			`This would remove ${req.removed.length} of ${total} books. Confirm to go ahead.`
		);

	const removedJson = JSON.stringify(req.removed);
	await db.batch([
		db
			.prepare('DELETE FROM book_file WHERE book_id IN (SELECT value FROM json_each(?))')
			.bind(removedJson),
		db.prepare('DELETE FROM book WHERE id IN (SELECT value FROM json_each(?))').bind(removedJson),
		db
			.prepare(
				`INSERT INTO catalog (id, sha256, previous_sha256, book_count, committed_at)
				 VALUES (1, ?, NULL, (SELECT COUNT(*) FROM book), ?)
				 ON CONFLICT (id) DO UPDATE SET
				   previous_sha256 = CASE WHEN catalog.sha256 = excluded.sha256
				     THEN catalog.previous_sha256 ELSE catalog.sha256 END,
				   sha256 = excluded.sha256, book_count = excluded.book_count,
				   committed_at = excluded.committed_at`
			)
			.bind(req.catalogSha256, now.toISOString()),
		db.prepare('DELETE FROM ingest_run WHERE id = 1 AND run_id = ?').bind(req.runId)
	]);

	const bytesFreed = await collectGarbage(store);
	return {
		added: req.added,
		updated: req.updated,
		removed: req.removed.length,
		catalogSha256: req.catalogSha256,
		bytesFreed
	};
}

/** Deletes objects no book and neither of the last two catalogues refers to. */
export async function collectGarbage(store: Store): Promise<number> {
	const { db, bucket } = store;
	const { results } = await db
		.prepare(
			`SELECT sha256, kind, size FROM blob WHERE sha256 NOT IN (
			   SELECT cover_sha256 FROM book WHERE cover_sha256 IS NOT NULL
			   UNION SELECT sha256 FROM book_file
			   UNION SELECT sha256 FROM catalog
			   UNION SELECT previous_sha256 FROM catalog WHERE previous_sha256 IS NOT NULL)`
		)
		.all<{ sha256: string; kind: 'file' | 'cover' | 'catalog'; size: number }>();
	if (!results.length) return 0;
	const keys = results.flatMap((r) =>
		r.kind === 'cover'
			? [keyOf('cover', r.sha256), keyOf('thumb', r.sha256)]
			: [keyOf(r.kind, r.sha256)]
	);
	for (let i = 0; i < keys.length; i += 1000) await bucket.delete(keys.slice(i, i + 1000));
	await db
		.prepare('DELETE FROM blob WHERE sha256 IN (SELECT value FROM json_each(?))')
		.bind(JSON.stringify(results.map((r) => r.sha256)))
		.run();
	return results.reduce((sum, r) => sum + r.size, 0);
}

/** Releases the lock if this run holds it. */
export async function abort(store: Store, runId: string) {
	await store.db.prepare('DELETE FROM ingest_run WHERE id = 1 AND run_id = ?').bind(runId).run();
}
