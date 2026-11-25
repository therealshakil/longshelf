import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	BOOKS_CACHE,
	DownloadError,
	PERSISTED_KEY,
	download,
	list,
	remove,
	removeAll,
	status,
	storageInfo,
	update
} from '#lib/offline/downloads.ts';
import { memoryStorage } from './memory-storage.ts';

/** Cache Storage in memory. `put` reads the whole body, so a failing stream stores nothing. */
function fakeCaches(opts: { quota?: number } = {}) {
	const stores = new Map<string, Map<string, { body: ArrayBuffer; headers: Headers }>>();
	const url = (k: RequestInfo | URL) =>
		new URL(typeof k === 'string' ? k : k instanceof URL ? k.href : k.url, 'https://x.test').href;
	const open = async (name: string) => {
		if (!stores.has(name)) stores.set(name, new Map());
		const m = stores.get(name)!;
		return {
			async put(k: RequestInfo | URL, res: Response) {
				const body = await res.arrayBuffer();
				const used = [...stores.values()]
					.flatMap((s) => [...s.values()])
					.reduce((n, e) => n + e.body.byteLength, 0);
				if (opts.quota != null && used + body.byteLength > opts.quota)
					throw new DOMException('full', 'QuotaExceededError');
				m.set(url(k), { body, headers: new Headers(res.headers) });
			},
			async match(k: RequestInfo | URL) {
				const e = m.get(url(k));
				return e ? new Response(e.body.slice(0), { headers: e.headers }) : undefined;
			},
			async delete(k: RequestInfo | URL) {
				return m.delete(url(k));
			},
			async keys() {
				return [...m.keys()].map((u) => new Request(u));
			}
		};
	};
	return {
		open,
		has: async (name: string) => stores.has(name),
		delete: async (name: string) => stores.delete(name),
		stores
	};
}

/** A response of `size` bytes; with `failAt`, the stream errors after that many bytes. */
function bookResponse(size: number, failAt?: number) {
	let sent = 0;
	const body = new ReadableStream<Uint8Array>({
		pull(c) {
			if (failAt != null && sent >= failAt) return c.error(new TypeError('network dropped'));
			if (sent >= size) return c.close();
			const n = Math.min(100_000, size - sent);
			c.enqueue(new Uint8Array(n));
			sent += n;
		}
	});
	return new Response(body, {
		headers: { 'content-type': 'application/epub+zip', 'content-length': String(size) }
	});
}

const SHA = 'a'.repeat(64);
const req = (over = {}) => ({
	bookId: 'b1',
	title: 'Middlemarch: A Study',
	format: 'EPUB',
	fileUrl: `/api/files/${SHA}`,
	size: 300_000,
	...over
});

let persist: ReturnType<typeof vi.fn>;
beforeEach(() => {
	persist = vi.fn(async () => true);
	vi.stubGlobal('caches', fakeCaches());
	vi.stubGlobal('localStorage', memoryStorage());
	vi.stubGlobal('navigator', {
		onLine: true,
		storage: {
			persist,
			persisted: async () => true,
			estimate: async () => ({ quota: 10_000_000, usage: 1_000_000 })
		}
	});
	vi.stubGlobal(
		'fetch',
		vi.fn(async () => bookResponse(300_000))
	);
});
afterEach(() => vi.unstubAllGlobals());

describe('download', () => {
	it('stores the file with its details in headers', async () => {
		const entry = await download(req());
		expect(entry).toMatchObject({
			bookId: 'b1',
			format: 'EPUB',
			size: 300_000,
			fileUrl: `/api/files/${SHA}`
		});
		const [listed] = await list();
		expect(listed).toMatchObject({ bookId: 'b1', title: 'Middlemarch: A Study', size: 300_000 });
		expect(listed.savedAt).toMatch(/^\d{4}-/);
	});

	it('keys by path, ignoring ?download=', async () => {
		await download(req({ fileUrl: `/api/files/${SHA}?download=x.epub` }));
		expect((await list())[0].fileUrl).toBe(`/api/files/${SHA}`);
	});

	it('reports progress', async () => {
		const seen: number[] = [];
		await download(req(), { onProgress: (n) => seen.push(n) });
		expect(seen.at(-1)).toBe(300_000);
		expect(seen.length).toBeGreaterThan(1);
	});

	it('leaves nothing when the connection drops', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => bookResponse(300_000, 150_000))
		);
		await expect(download(req())).rejects.toMatchObject({ kind: 'failed' });
		expect(await list()).toEqual([]);
	});

	it('deletes and fails on a size mismatch', async () => {
		await expect(download(req({ size: 400_000 }))).rejects.toMatchObject({ kind: 'failed' });
		expect(await list()).toEqual([]);
	});

	it('refuses up front when the book clearly will not fit', async () => {
		await expect(download(req({ size: 20_000_000 }))).rejects.toEqual(
			expect.objectContaining({ kind: 'no-space', needed: 20_000_000 })
		);
		expect(fetch).not.toHaveBeenCalled();
	});

	it('turns QuotaExceededError into no-space and stores nothing', async () => {
		vi.stubGlobal('caches', fakeCaches({ quota: 100_000 }));
		const err = await download(req()).catch((e) => e);
		expect(err).toBeInstanceOf(DownloadError);
		expect(err.kind).toBe('no-space');
		expect(await list()).toEqual([]);
	});

	it('says offline without trying', async () => {
		vi.stubGlobal('navigator', { onLine: false });
		await expect(download(req())).rejects.toMatchObject({ kind: 'offline' });
	});

	it('uses the bytes received when the size is unknown (sample books)', async () => {
		const entry = await download(req({ size: undefined, fileUrl: '/sample/books/b1.epub' }));
		expect(entry.size).toBe(300_000);
		expect((await list())[0].size).toBe(300_000);
	});

	it('asks to keep downloads once, and remembers the answer', async () => {
		await download(req());
		await download(req({ bookId: 'b2', fileUrl: `/api/files/${'b'.repeat(64)}` }));
		expect(persist).toHaveBeenCalledTimes(1);
		expect(localStorage.getItem(PERSISTED_KEY)).toBe('true');
	});
});

describe('status, update, remove', () => {
	it('is none, then downloaded, then update when the library lists a new file', async () => {
		expect(await status('b1', `/api/files/${SHA}`)).toBe('none');
		await download(req());
		expect(await status('b1', `/api/files/${SHA}`)).toBe('downloaded');
		expect(await status('b1', `/api/files/${'c'.repeat(64)}`)).toBe('update');
	});

	it('update keeps the old copy until the new one is stored', async () => {
		await download(req());
		const NEW = `/api/files/${'c'.repeat(64)}`;
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => bookResponse(300_000, 1000))
		);
		await expect(update(req({ fileUrl: NEW }))).rejects.toMatchObject({ kind: 'failed' });
		expect((await list()).map((e) => e.fileUrl)).toEqual([`/api/files/${SHA}`]);
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => bookResponse(300_000))
		);
		await update(req({ fileUrl: NEW }));
		expect((await list()).map((e) => e.fileUrl)).toEqual([NEW]);
	});

	it('remove and removeAll leave reading places alone', async () => {
		localStorage.setItem('longshelf.reader.place.b1', '{"cfi":"c","fraction":0.1}');
		await download(req());
		await remove(`/api/files/${SHA}`);
		expect(await list()).toEqual([]);
		await download(req());
		await removeAll();
		expect(await list()).toEqual([]);
		expect(localStorage.getItem('longshelf.reader.place.b1')).not.toBeNull();
	});

	it('a cleared cache reads as not downloaded (device cleared storage)', async () => {
		await download(req());
		await (caches as unknown as ReturnType<typeof fakeCaches>).delete(BOOKS_CACHE);
		expect(await status('b1', `/api/files/${SHA}`)).toBe('none');
	});
});

describe('storageInfo', () => {
	it('totals exact sizes and reports space and keeping', async () => {
		await download(req());
		await download(req({ bookId: 'b2', fileUrl: `/api/files/${'b'.repeat(64)}`, size: 300_000 }));
		expect(await storageInfo()).toEqual({
			used: 600_000,
			count: 2,
			available: 9_000_000,
			persisted: true
		});
	});
});
