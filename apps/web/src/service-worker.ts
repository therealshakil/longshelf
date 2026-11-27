/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/**
 * Installable, offline-first shell (spec 003 US4, research R6). SvelteKit's own service worker,
 * no plugin.
 * - App shell (built JS/CSS, fonts, icons, the start page) is precached per version.
 * - Covers are cache-first: their URL is the image's hash, so they never change.
 * - The catalogue and reading places (spec 004) are network-first with the last copy as fallback.
 * - Pages are network-first, falling back to the cached start page offline.
 * - Book files the owner downloaded (spec 004, DR-0013) are answered from `books-v1`, which the
 *   page fills; files that weren't downloaded go to the network and are never cached here.
 * - AI and uploads are never cached.
 * A new version waits until every Longshelf tab is closed, so nothing open is interrupted
 * (FR-021); it takes over on the next open.
 */
import { assets, immutable } from '$app/manifest';
import { version } from '$app/env';
import { self } from '$app/service-worker';

const SHELL = `shell-${version}`;
const COVERS = 'covers-v1';
const CATALOG = 'catalog-v1';
/** Filled by the page (`lib/offline/downloads.ts`); must match its BOOKS_CACHE. */
const BOOKS = 'books-v1';
/** Tells the page a catalogue came from the cache, and why. */
export const SOURCE_HEADER = 'x-longshelf-source';

// SvelteKit 3 lists paths without a leading slash ("_app/immutable/…"), but requests arrive
// as "/_app/immutable/…": normalise, or nothing matches and the app can't start offline.
const abs = (p: string) => `/${p.replace(/^\/+/, '')}`;
// Sample books and covers are demo data: too large to precache and not part of the shell.
const SHELL_FILES = [
	...immutable.map((f) => abs(f.path)),
	...assets.map((f) => abs(f.path)).filter((p) => !p.startsWith('/sample/'))
];

self.addEventListener('install', (event) => {
	event.waitUntil(
		(async () => {
			const cache = await caches.open(SHELL);
			await cache.addAll(SHELL_FILES);
			// The start page, if it can be fetched now (it can't while signed out).
			const start = await fetch('/', { redirect: 'manual' }).catch(() => null);
			if (start?.ok) await cache.put('/', start);
		})()
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			for (const key of await caches.keys())
				if (key.startsWith('shell-') && key !== SHELL) await caches.delete(key);
		})()
	);
});

/** True when Cloudflare Access answered with its sign-in redirect instead of the data. */
const signInRedirect = (res: Response) =>
	res.type === 'opaqueredirect' || (res.status >= 300 && res.status < 400);

async function coverFirst(request: Request) {
	const cache = await caches.open(COVERS);
	const hit = await cache.match(request);
	if (hit) return hit;
	const res = await fetch(request);
	if (res.ok) await cache.put(request, res.clone());
	return res;
}

/** The catalogue or the reading places: the network, else the last copy marked with why. */
async function lastCopy(request: Request, path: string) {
	const cache = await caches.open(CATALOG);
	// null when offline
	const res = await fetch(request, { redirect: 'manual' }).catch(() => null);
	if (res?.ok) {
		await cache.put(path, res.clone());
		return res;
	}
	if (res && res.status === 304) return res;
	const reason = res && signInRedirect(res) ? 'sign-in' : res ? null : 'offline';
	const cached = reason ? await cache.match(path) : undefined;
	if (!cached) return res ?? Response.error();
	const headers = new Headers(cached.headers);
	headers.set(SOURCE_HEADER, reason!);
	return new Response(cached.body, { status: 200, headers });
}

/**
 * A downloaded book from `books-v1`, under its path. `?download=<name>` (Save a copy) adds the
 * attachment header, as the Worker does. foliate-js fetches files whole, so `Range` gets the full
 * response (T001 spike). Not downloaded: straight to the network.
 */
async function bookFile(request: Request) {
	const url = new URL(request.url);
	const hit = await (await caches.open(BOOKS)).match(url.pathname);
	if (!hit) return fetch(request);
	const name = url.searchParams.get('download');
	if (!name) return hit;
	const headers = new Headers(hit.headers);
	headers.set('content-disposition', `attachment; filename*=UTF-8''${encodeURIComponent(name)}`);
	return new Response(hit.body, { status: 200, headers });
}

async function page(request: Request) {
	try {
		const res = await fetch(request);
		if (res.ok && new URL(request.url).pathname === '/')
			await (await caches.open(SHELL)).put('/', res.clone());
		return res;
	} catch {
		const shell = await (await caches.open(SHELL)).match('/');
		return shell ?? Response.error();
	}
}

async function shellFirst(request: Request) {
	const hit = await (await caches.open(SHELL)).match(request);
	return hit ?? fetch(request);
}

self.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;
	const url = new URL(request.url);
	if (url.origin !== self.location.origin) return;
	const path = url.pathname;

	if (path.startsWith('/api/covers/')) event.respondWith(coverFirst(request));
	else if (path === '/api/catalog' || path === '/api/progress')
		event.respondWith(lastCopy(request, path));
	else if (path.startsWith('/api/files/') || path.startsWith('/sample/books/'))
		event.respondWith(bookFile(request));
	else if (request.mode === 'navigate') event.respondWith(page(request));
	else if (SHELL_FILES.includes(path)) event.respondWith(shellFirst(request));
	// Everything else (AI, uploads, other sample data) goes straight to the network.
});
