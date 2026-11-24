/**
 * One `longshelf library` run (contracts/cli.md): read Calibre, plan, upload, write books,
 * upload the catalogue, commit. Calibre is only read (FR-001, SC-008).
 */
import { existsSync } from 'node:fs';
import { BOOKS_BATCH_MAX, type IngestBook, type PlanBook } from '@longshelf/shared/ingest';
import {
	canonicalJson,
	type MirrorCatalog,
	type StoredFile
} from '@longshelf/shared/library/catalog';
import type { Book } from '@longshelf/shared/library';
import { readCalibreSnapshot } from './calibre.ts';
import { HashCache, sha256Of } from './hash-cache.ts';
import { EXIT, RunError, type Problem, type RunSummary } from './report.ts';
import { MirrorClient, uploadAll, type BlobSource } from './upload.ts';

export interface RunOptions {
	library: string;
	client: MirrorClient;
	cache: HashCache;
	dryRun?: boolean;
	yes?: boolean;
	/** Asks the owner a yes/no question; resolves true for yes. */
	confirm: (question: string) => Promise<boolean>;
	log?: (line: string) => void;
	/** Lets a caller abort the run on Ctrl-C. */
	onRun?: (runId: string | null) => void;
}

interface Prepared {
	catalog: MirrorCatalog;
	plan: PlanBook[];
	ingest: Map<string, IngestBook>;
	sources: Map<string, BlobSource>;
	problems: Problem[];
}

/** Reads and hashes the library, and builds everything the run sends. */
export async function prepare(library: string, cache: HashCache): Promise<Prepared> {
	const { snapshot, files } = readCalibreSnapshot(library);
	const problems: Problem[] = [];
	const sources = new Map<string, BlobSource>();
	const plan: PlanBook[] = [];
	const ingest = new Map<string, IngestBook>();
	const stored: Record<string, StoredFile[]> = {};

	const all = [
		...snapshot.books.map((b) => ({ book: b, isNews: false })),
		...snapshot.news.map((b) => ({ book: b, isNews: true }))
	];
	const out: { books: Book[]; news: Book[] } = { books: [], news: [] };
	for (const { book, isNews } of all) {
		const bookFiles: StoredFile[] = [];
		for (const f of files.byFormat.get(book.id) ?? []) {
			if (!existsSync(f.path)) {
				problems.push({
					title: book.title,
					message: `file missing on disk (${f.format}). Fix it in Calibre, then run again.`
				});
				continue;
			}
			const { sha256, size } = await cache.hash(f.path);
			bookFiles.push({ format: f.format, sha256, size });
			sources.set(sha256, { sha256, size, kind: 'file', path: f.path });
		}
		let cover: { sha256: string; size: number } | undefined;
		const coverPath = files.cover.get(book.id);
		if (coverPath && existsSync(coverPath)) {
			cover = await cache.hash(coverPath);
			sources.set(cover.sha256, { ...cover, kind: 'cover', path: coverPath });
		}
		const mirrored: Book = {
			...book,
			formats: bookFiles.map((f) => f.format),
			cover: cover
				? { url: `/api/covers/${cover.sha256}`, alt: `Cover of ${book.title}` }
				: undefined
		};
		const metadataHash = sha256Of(canonicalJson(mirrored));
		plan.push({ id: book.id, metadataHash, cover, files: bookFiles });
		ingest.set(book.id, {
			id: book.id,
			metadata: mirrored,
			metadataHash,
			isNews,
			coverSha256: cover?.sha256,
			files: bookFiles
		});
		stored[book.id] = bookFiles;
		(isNews ? out.news : out.books).push(mirrored);
	}
	cache.save();
	const catalog: MirrorCatalog = {
		version: 1,
		readAt: snapshot.readAt,
		books: out.books,
		news: out.news,
		files: stored
	};
	return { catalog, plan, ingest, sources, problems };
}

export async function runLibrary(opts: RunOptions, mirror: string): Promise<RunSummary> {
	const started = Date.now();
	const log = opts.log ?? (() => {});
	const prepared = await prepare(opts.library, opts.cache);
	const total = prepared.plan.length;
	const plan = await opts.client.plan({ books: prepared.plan });
	opts.onRun?.(plan.runId);
	const finish = async () => {
		await opts.client.abort(plan.runId).catch(() => {});
		opts.onRun?.(null);
	};

	try {
		const missing = plan.missingBlobs.map((sha) => prepared.sources.get(sha)!).filter(Boolean);
		const bytes = missing.reduce((n, b) => n + b.size, 0);
		const summary = (extra: Partial<RunSummary> = {}): RunSummary => ({
			total,
			mirror,
			added: plan.newBooks.length,
			updated: plan.changedBooks.length - plan.newBooks.length,
			removed: plan.removedBooks.length,
			bytesUploaded: bytes,
			seconds: (Date.now() - started) / 1000,
			problems: prepared.problems,
			...extra
		});

		if (plan.removalNeedsConfirm) {
			const titles = plan.removedBooks.map((b) => `  ${b.title}`).join('\n');
			const ok =
				(opts.yes && plan.removedBooks.length <= 10) ||
				(!opts.dryRun &&
					(await opts.confirm(
						`${titles}\nRemove these ${plan.removedBooks.length} books from the mirror? [y/N] `
					)));
			if (!ok && !opts.dryRun) {
				await finish();
				throw new RunError(EXIT.declined, 'Nothing changed: the removals were not confirmed.');
			}
		}
		if (opts.dryRun) {
			await finish();
			return summary({ dryRun: true });
		}

		let done = 0;
		await uploadAll(opts.client, plan.runId, missing, () => {
			done++;
			log(`Uploaded ${done} of ${missing.length}`);
		});

		const changed = plan.changedBooks.map((id) => prepared.ingest.get(id)!);
		for (let i = 0; i < changed.length; i += BOOKS_BATCH_MAX)
			await opts.client.books({ runId: plan.runId, books: changed.slice(i, i + BOOKS_BATCH_MAX) });

		const catalogBytes = new TextEncoder().encode(JSON.stringify(prepared.catalog));
		const catalogSha = sha256Of(catalogBytes);
		await opts.client.putBlob(plan.runId, {
			sha256: catalogSha,
			size: catalogBytes.length,
			kind: 'catalog',
			bytes: catalogBytes
		});
		await opts.client.commit({
			runId: plan.runId,
			removed: plan.removedBooks.map((b) => b.id),
			confirmRemovals: plan.removalNeedsConfirm,
			catalogSha256: catalogSha,
			added: plan.newBooks.length,
			updated: plan.changedBooks.length - plan.newBooks.length
		});
		opts.onRun?.(null);
		return summary({ seconds: (Date.now() - started) / 1000 });
	} catch (err) {
		await finish();
		throw err;
	}
}
