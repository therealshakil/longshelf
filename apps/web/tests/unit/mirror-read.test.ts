import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { keyOf, putSingle, type Store } from '../../src/lib/server/mirror/blobs.ts';
import {
	contentDisposition,
	safeFilename,
	serveCatalog,
	serveCover,
	serveFile
} from '../../src/lib/server/mirror/serve.ts';
import { mirrorEnv, sha256Hex } from './mirror-env.ts';

let env: Awaited<ReturnType<typeof mirrorEnv>>;
let store: Store;
beforeAll(async () => {
	env = await mirrorEnv();
	store = env.store;
}, 60_000);
afterAll(() => env?.dispose());
beforeEach(() => env.reset());

const bytes = (s: string) => new TextEncoder().encode(s).buffer as ArrayBuffer;
const req = (headers: Record<string, string> = {}) => new Request('http://localhost/', { headers });

async function stored(kind: 'file' | 'cover' | 'catalog', content: string) {
	const sha = await sha256Hex(content);
	await putSingle(store, sha, kind, bytes(content), content.length);
	return sha;
}

describe('catalogue', () => {
	it('is 404 before the first commit, then served with an ETag and 304', async () => {
		expect((await serveCatalog(store, req())).status).toBe(404);
		const sha = await stored('catalog', '{"version":1}');
		await store.db
			.prepare(
				"INSERT INTO catalog (id, sha256, book_count, committed_at) VALUES (1, ?, 0, '2026-11-24')"
			)
			.bind(sha)
			.run();
		const res = await serveCatalog(store, req());
		expect(res.status).toBe(200);
		expect(res.headers.get('etag')).toBe(`"${sha}"`);
		expect(await res.text()).toBe('{"version":1}');
		expect((await serveCatalog(store, req({ 'if-none-match': `"${sha}"` }))).status).toBe(304);
	});
});

describe('covers', () => {
	it('serves the thumbnail when there is one, the original otherwise or when asked', async () => {
		const sha = await stored('cover', 'jpeg bytes');
		const original = await serveCover(store, sha, false);
		expect(original.headers.get('content-type')).toBe('image/jpeg');
		await store.bucket.put(keyOf('thumb', sha), 'webp bytes');
		const thumb = await serveCover(store, sha, false);
		expect(thumb.headers.get('content-type')).toBe('image/webp');
		expect(await thumb.text()).toBe('webp bytes');
		expect(await (await serveCover(store, sha, true)).text()).toBe('jpeg bytes');
		expect(thumb.headers.get('cache-control')).toContain('immutable');
	});

	it('refuses bad and unknown hashes', async () => {
		expect((await serveCover(store, 'nope', false)).status).toBe(400);
		expect((await serveCover(store, 'a'.repeat(64), false)).status).toBe(404);
	});
});

describe('files', () => {
	it('serves a range for the reader', async () => {
		const sha = await stored('file', '0123456789');
		const res = await serveFile(store, sha, req({ range: 'bytes=2-5' }), null);
		expect(res.status).toBe(206);
		expect(res.headers.get('content-range')).toBe('bytes 2-5/10');
		expect(await res.text()).toBe('2345');
		const tail = await serveFile(store, sha, req({ range: 'bytes=-3' }), null);
		expect(await tail.text()).toBe('789');
	});

	it('names a download safely', async () => {
		const sha = await stored('file', 'pdf bytes');
		const res = await serveFile(store, sha, req(), 'Moby Dick: Or/The Whale - Herman Melville.pdf');
		expect(res.headers.get('content-type')).toBe('application/pdf');
		expect(res.headers.get('content-disposition')).toBe(
			`attachment; filename="Moby Dick OrThe Whale - Herman Melville.pdf"; filename*=UTF-8''${encodeURIComponent('Moby Dick OrThe Whale - Herman Melville.pdf')}`
		);
		expect(safeFilename(`${'x'.repeat(300)}.epub`)).toHaveLength(120);
		expect(contentDisposition('Les Misérables.epub')).toContain(
			"filename*=UTF-8''Les%20Mis%C3%A9rables.epub"
		);
	});

	it('serves a cover hash only as a cover, not as a file', async () => {
		const sha = await stored('cover', 'jpeg');
		expect((await serveFile(store, sha, req(), null)).status).toBe(404);
	});
});
