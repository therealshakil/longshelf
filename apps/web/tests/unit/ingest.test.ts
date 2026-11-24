import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
	BlobError,
	completeMultipart,
	createMultipart,
	keyOf,
	putSingle,
	uploadPart,
	type Store
} from '../../src/lib/server/mirror/blobs.ts';
import { abort, commit, LOCK_MS, plan, writeBooks } from '../../src/lib/server/mirror/ingest.ts';
import { mirrorEnv, sha256Hex } from './mirror-env.ts';

let env: Awaited<ReturnType<typeof mirrorEnv>>;
let store: Store;
beforeAll(async () => {
	env = await mirrorEnv();
	store = env.store;
}, 60_000);
afterAll(() => env?.dispose());
beforeEach(() => env.reset());

const hash = (s: string) => sha256Hex(s);

/** A book with one EPUB and a cover, whose bytes are derived from its id. */
async function book(id: string, title = `Book ${id}`) {
	const epub = `epub:${id}`;
	const cover = `cover:${id}`;
	const files = [{ format: 'EPUB', sha256: await hash(epub), size: epub.length }];
	const coverSha = await hash(cover);
	const metadata = { id, title };
	return {
		bytes: { [files[0].sha256]: epub, [coverSha]: cover },
		plan: {
			id,
			metadataHash: await hash(JSON.stringify(metadata)),
			cover: { sha256: coverSha, size: cover.length },
			files
		},
		ingest: {
			id,
			metadata,
			metadataHash: await hash(JSON.stringify(metadata)),
			isNews: false,
			coverSha256: coverSha,
			files
		}
	};
}

/** One full run: plan, upload what's missing, write books, upload a catalogue, commit. */
async function run(books: Awaited<ReturnType<typeof book>>[], confirmRemovals = false) {
	const p = await plan(store, { books: books.map((b) => b.plan) });
	const bytes = Object.assign({}, ...books.map((b) => b.bytes)) as Record<string, string>;
	for (const sha of p.missingBlobs) {
		const kind = books.some((b) => b.plan.cover.sha256 === sha) ? 'cover' : 'file';
		await putSingle(
			store,
			sha,
			kind,
			new TextEncoder().encode(bytes[sha]).buffer,
			bytes[sha].length
		);
	}
	const changed = books.filter((b) => p.changedBooks.includes(b.plan.id)).map((b) => b.ingest);
	if (changed.length) await writeBooks(store, { runId: p.runId, books: changed });
	const catalog = JSON.stringify({ ids: books.map((b) => b.plan.id) });
	const catalogSha = await hash(catalog);
	await putSingle(
		store,
		catalogSha,
		'catalog',
		new TextEncoder().encode(catalog).buffer,
		catalog.length
	);
	try {
		const result = await commit(store, {
			runId: p.runId,
			removed: p.removedBooks.map((b) => b.id),
			confirmRemovals,
			catalogSha256: catalogSha,
			added: 0,
			updated: 0
		});
		return { plan: p, result };
	} catch (err) {
		await abort(store, p.runId); // as the CLI does when a run fails
		throw err;
	}
}

describe('ingest', () => {
	it('uploads everything into an empty mirror, then nothing on a second run', async () => {
		const books = [await book('a'), await book('b')];
		const first = await run(books);
		expect(first.plan.missingBlobs).toHaveLength(4);
		expect(first.plan.changedBooks).toEqual(['a', 'b']);
		const second = await run(books);
		expect(second.plan.missingBlobs).toEqual([]);
		expect(second.plan.changedBooks).toEqual([]);
		expect(second.plan.removedBooks).toEqual([]);
	});

	it('reports only a book whose metadata changed', async () => {
		await run([await book('a'), await book('b')]);
		const p = await plan(store, {
			books: [(await book('a')).plan, (await book('b', 'New title')).plan]
		});
		expect(p.changedBooks).toEqual(['b']);
		expect(p.missingBlobs).toEqual([]);
	});

	it('holds the lock against a second plan until it expires', async () => {
		const books = [(await book('a')).plan];
		const now = new Date('2026-11-24T10:00:00Z');
		await plan(store, { books }, now);
		await expect(plan(store, { books }, now)).rejects.toMatchObject({ status: 409 });
		const later = new Date(now.getTime() + LOCK_MS + 1000);
		await expect(plan(store, { books }, later)).resolves.toHaveProperty('runId');
	});

	it('rejects a body that does not match its hash, and accepts a repeat upload', async () => {
		const sha = await hash('right');
		await expect(
			putSingle(store, sha, 'file', new TextEncoder().encode('wrong').buffer, 5)
		).rejects.toBeInstanceOf(BlobError);
		expect(await putSingle(store, sha, 'file', new TextEncoder().encode('right').buffer, 5)).toBe(
			true
		);
		expect(await putSingle(store, sha, 'file', new TextEncoder().encode('right').buffer, 5)).toBe(
			false
		);
	});

	it('refuses books whose files were not uploaded, writing nothing', async () => {
		const a = await book('a');
		const p = await plan(store, { books: [a.plan] });
		await expect(writeBooks(store, { runId: p.runId, books: [a.ingest] })).rejects.toMatchObject({
			status: 409
		});
		expect(await store.db.prepare('SELECT COUNT(*) AS n FROM book').first('n')).toBe(0);
	});

	it('asks before removing more than 10% of the mirror (FR-006)', async () => {
		const books = await Promise.all(['a', 'b', 'c'].map((id) => book(id)));
		await run(books);
		await expect(run([books[0]])).rejects.toMatchObject({ status: 409 });
		const { result } = await run([books[0]], true);
		expect(result.removed).toBe(2);
	});

	it('frees objects of removed books but keeps the previous catalogue', async () => {
		const [a, b] = [await book('a'), await book('b')];
		const first = await run([a, b]);
		const { result } = await run([a], true);
		expect(result.bytesFreed).toBeGreaterThan(0);
		expect(await store.bucket.head(keyOf('file', b.plan.files[0].sha256))).toBeNull();
		expect(await store.bucket.head(keyOf('file', a.plan.files[0].sha256))).not.toBeNull();
		const cat = await store.db
			.prepare('SELECT sha256, previous_sha256 FROM catalog')
			.first<{ sha256: string; previous_sha256: string }>();
		expect(cat?.previous_sha256).toBeTruthy();
		expect(await store.bucket.head(keyOf('catalog', cat!.previous_sha256))).not.toBeNull();
		expect(first.result.catalogSha256).toBe(cat?.previous_sha256);
	});

	it('assembles a multipart upload and checks its size', async () => {
		const part1 = new Uint8Array(5 * 1024 * 1024).fill(1);
		const part2 = new TextEncoder().encode('tail');
		const whole = new Uint8Array(part1.length + part2.length);
		whole.set(part1);
		whole.set(part2, part1.length);
		const sha = await sha256Hex(whole);
		const id = await createMultipart(store, sha, 'file');
		const parts = [
			await uploadPart(store, sha, 'file', id, 1, part1.buffer),
			await uploadPart(store, sha, 'file', id, 2, part2.buffer)
		];
		await completeMultipart(store, sha, 'file', id, parts, whole.length);
		expect((await store.bucket.head(keyOf('file', sha)))?.size).toBe(whole.length);

		const sha2 = await hash('other');
		const id2 = await createMultipart(store, sha2, 'file');
		const p = [await uploadPart(store, sha2, 'file', id2, 1, part2.buffer)];
		await expect(completeMultipart(store, sha2, 'file', id2, p, 999)).rejects.toBeInstanceOf(
			BlobError
		);
	});
});
