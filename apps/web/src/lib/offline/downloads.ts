/**
 * Books kept on this device for offline reading (spec 004 US1, DR-0013, research R1–R3,
 * contracts/client-storage.md). Each file sits in the `books-v1` Cache Storage cache under its
 * own URL path, so the service worker answers the reader's normal request from it. The cached
 * response's headers are the index: no second store to keep in step.
 *
 * A download is all or nothing (FR-002): `cache.put` stores only a complete body (T001 spike,
 * Chromium and WebKit), and the byte count is checked against the expected size.
 */
export const BOOKS_CACHE = 'books-v1';
export const PERSISTED_KEY = 'longshelf.storage.persisted';

const H = {
	book: 'x-longshelf-book',
	format: 'x-longshelf-format',
	size: 'x-longshelf-size',
	title: 'x-longshelf-title',
	savedAt: 'x-longshelf-saved-at'
} as const;

export type DownloadFailure = 'no-space' | 'offline' | 'failed' | 'cancelled';

export class DownloadError extends Error {
	constructor(
		readonly kind: DownloadFailure,
		/** Bytes the book needs, for `no-space`. */
		readonly needed?: number
	) {
		super(kind);
	}
}

export interface DownloadEntry {
	bookId: string;
	title: string;
	format: string;
	size: number;
	savedAt: string;
	/** The URL path the reader opens. */
	fileUrl: string;
}

export interface DownloadRequest {
	bookId: string;
	title: string;
	format: string;
	fileUrl: string;
	/** Expected size from the catalogue, when known. */
	size?: number;
}

export type DownloadStatus = 'none' | 'downloaded' | 'update';

/** Fired on `downloads` whenever an entry is added or removed, so every view can refresh. */
export const downloads = new EventTarget();
const changed = () => downloads.dispatchEvent(new Event('change'));

/** The cache key: the URL's path, without `?download=` or other query. */
export const cacheKey = (url: string) => new URL(url, 'https://x.invalid').pathname;

const isOnline = () => globalThis.navigator?.onLine !== false;

/** Space this origin can still use, from `estimate()`, which is approximate (R3). */
async function spaceLeft(): Promise<number | null> {
	try {
		const e = await globalThis.navigator?.storage?.estimate?.();
		return e?.quota != null && e.usage != null ? Math.max(0, e.quota - e.usage) : null;
	} catch {
		return null;
	}
}

/** Ask once, on the first download, for downloads to be kept; remember the answer (FR-006). */
async function askToKeep(force = false): Promise<boolean | null> {
	try {
		if (!force && localStorage.getItem(PERSISTED_KEY) !== null) return null;
		const granted = (await globalThis.navigator?.storage?.persist?.()) ?? false;
		localStorage.setItem(PERSISTED_KEY, String(granted));
		return granted;
	} catch {
		return null;
	}
}

export async function download(
	req: DownloadRequest,
	opts: { onProgress?: (received: number, total?: number) => void; signal?: AbortSignal } = {}
): Promise<DownloadEntry> {
	if (!isOnline()) throw new DownloadError('offline');
	if (req.size != null) {
		const left = await spaceLeft();
		if (left != null && req.size > left) throw new DownloadError('no-space', req.size);
	}
	const key = cacheKey(req.fileUrl);
	const cache = await caches.open(BOOKS_CACHE);
	let received = 0;
	try {
		const res = await fetch(req.fileUrl, { signal: opts.signal });
		if (!res.ok || !res.body) throw new DownloadError('failed');
		const counted = res.body.pipeThrough(
			new TransformStream<Uint8Array, Uint8Array>({
				transform(chunk, out) {
					received += chunk.byteLength;
					opts.onProgress?.(received, req.size);
					out.enqueue(chunk);
				}
			})
		);
		const savedAt = new Date().toISOString();
		// The size header must be known before the body is read, so it carries the expected size
		// and is checked against the bytes received below.
		const headers = new Headers({
			'content-type': res.headers.get('content-type') ?? 'application/octet-stream',
			[H.book]: req.bookId,
			[H.format]: req.format,
			[H.size]: String(req.size ?? Number(res.headers.get('content-length') ?? 0)),
			[H.title]: encodeURIComponent(req.title),
			[H.savedAt]: savedAt
		});
		await cache.put(key, new Response(counted, { headers }));
		const expected = req.size ?? Number(res.headers.get('content-length') ?? received);
		if (received !== expected || received === 0) {
			await cache.delete(key);
			throw new DownloadError('failed');
		}
		if (!req.size) await rewriteSize(cache, key, received);
		await askToKeep();
		changed();
		return {
			bookId: req.bookId,
			title: req.title,
			format: req.format,
			size: received,
			savedAt,
			fileUrl: key
		};
	} catch (err) {
		await cache.delete(key).catch(() => {});
		if (err instanceof DownloadError) throw err;
		const name = (err as { name?: string } | null)?.name;
		if (name === 'AbortError') throw new DownloadError('cancelled');
		if (name === 'QuotaExceededError') throw new DownloadError('no-space', req.size ?? received);
		throw new DownloadError(isOnline() ? 'failed' : 'offline');
	}
}

/** When the size wasn't known up front, store the counted bytes as the entry's size. */
async function rewriteSize(cache: Cache, key: string, size: number) {
	const hit = await cache.match(key);
	if (!hit) return;
	const headers = new Headers(hit.headers);
	headers.set(H.size, String(size));
	await cache.put(key, new Response(await hit.blob(), { headers }));
}

function entryFrom(path: string, res: Response): DownloadEntry {
	const h = res.headers;
	return {
		bookId: h.get(H.book) ?? '',
		title: decodeURIComponent(h.get(H.title) ?? ''),
		format: h.get(H.format) ?? '',
		size: Number(h.get(H.size) ?? 0),
		savedAt: h.get(H.savedAt) ?? '',
		fileUrl: path
	};
}

/** Every downloaded book, newest first. */
export async function list(): Promise<DownloadEntry[]> {
	try {
		if (!(await caches.has(BOOKS_CACHE))) return [];
		const cache = await caches.open(BOOKS_CACHE);
		const out: DownloadEntry[] = [];
		for (const req of await cache.keys()) {
			const res = await cache.match(req);
			if (res) out.push(entryFrom(new URL(req.url).pathname, res));
		}
		return out.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
	} catch {
		return [];
	}
}

/** `update` when this device holds a different file for the book than the library now lists. */
export async function status(
	bookId: string,
	currentFileUrl: string | null
): Promise<DownloadStatus> {
	const mine = (await list()).filter((e) => e.bookId === bookId);
	if (!mine.length) return 'none';
	if (!currentFileUrl || mine.some((e) => e.fileUrl === cacheKey(currentFileUrl)))
		return 'downloaded';
	return 'update';
}

/** The downloaded entry for a book, if any (the newest, if more than one). */
export async function entryFor(bookId: string): Promise<DownloadEntry | undefined> {
	return (await list()).find((e) => e.bookId === bookId);
}

/** Remove one download. Reading places are never touched (FR-015). */
export async function remove(fileUrl: string): Promise<void> {
	try {
		const cache = await caches.open(BOOKS_CACHE);
		await cache.delete(cacheKey(fileUrl));
	} finally {
		changed();
	}
}

/** Remove every download on this device. */
export async function removeAll(): Promise<void> {
	try {
		await caches.delete(BOOKS_CACHE);
	} finally {
		changed();
	}
}

/** Replace a book's old copy with the library's current file; the old copy goes only once the new one is stored (FR-007). */
export async function update(req: DownloadRequest, opts: Parameters<typeof download>[1] = {}) {
	const old = (await list()).filter(
		(e) => e.bookId === req.bookId && e.fileUrl !== cacheKey(req.fileUrl)
	);
	const entry = await download(req, opts);
	for (const e of old) await remove(e.fileUrl);
	return entry;
}

export interface StorageInfo {
	/** Sum of the downloaded books' sizes: exact (SC-006). */
	used: number;
	count: number;
	/** From `estimate()`: approximate, shown as "about". */
	available: number | null;
	/** Whether the device has agreed to keep downloads. */
	persisted: boolean | null;
}

export async function storageInfo(): Promise<StorageInfo> {
	const entries = await list();
	const persisted = await Promise.resolve(globalThis.navigator?.storage?.persisted?.())
		.then((p) => p ?? null)
		.catch(() => null);
	return {
		used: entries.reduce((n, e) => n + e.size, 0),
		count: entries.length,
		available: await spaceLeft(),
		persisted
	};
}

/** Ask the device again to keep downloads (the storage page's button). */
export const keepDownloads = () => askToKeep(true);
