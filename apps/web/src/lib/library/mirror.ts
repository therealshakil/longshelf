/**
 * The mirror-backed library (spec 003, contracts/mirror-api.md): the whole catalogue fetched once
 * from /api/catalog, then served by the same snapshot code as local Calibre mode (DR-0009).
 */
import type {
	Book,
	BookFile,
	BookWithPositions,
	LibrarySource,
	SyncState
} from '@longshelf/shared/library';
import { ALSO_READING_MAX, READABLE_FORMATS, statusFrom } from '@longshelf/shared/library';
import type { MirrorCatalog } from '@longshelf/shared/library/catalog';
import { createSnapshotLibrary } from '@longshelf/shared/library/snapshot';
import type { Place } from '@longshelf/shared/progress';
import { thisDevice } from '#lib/offline/device.ts';
import { fetchPlaces, mergePositions } from '#lib/reader/places.ts';
import { allPlaces, loadPlace, type SavedPlace } from '#lib/reader/settings.ts';

export function fileUrlFor(catalog: MirrorCatalog, bookId: string): string | null {
	const files = catalog.files[bookId] ?? [];
	for (const format of READABLE_FORMATS) {
		const file = files.find((f) => f.format === format);
		if (file) return `/api/files/${file.sha256}`;
	}
	return null;
}

/** The saved file's name: "Title - Author.epub"; KEPUB keeps Kobo's ".kepub.epub". */
export function downloadName(book: Book, format: string): string {
	const ext = format === 'KEPUB' ? 'kepub.epub' : format.toLowerCase();
	const author = book.authors[0]?.name;
	return `${book.title}${author ? ` - ${author}` : ''}.${ext}`;
}

export function filesFor(catalog: MirrorCatalog, book: Book): BookFile[] {
	return (catalog.files[book.id] ?? []).map((f) => ({
		format: f.format,
		size: f.size,
		url: `/api/files/${f.sha256}?download=${encodeURIComponent(downloadName(book, f.format))}`
	}));
}

/** Where reading places come from: the mirror's rows and this device's saved places. */
export interface PlaceSource {
	rows(): Promise<Place[]>;
	local(bookId: string): SavedPlace | null;
	allLocal(): Map<string, SavedPlace>;
	deviceId: string;
}

const NO_PLACES: PlaceSource = {
	rows: async () => [],
	local: () => null,
	allLocal: () => new Map(),
	deviceId: ''
};

/** The mirror's places, read again at most once a minute; the last good copy otherwise. */
export function mirrorPlaces(f: typeof fetch = fetch, now = () => Date.now()): PlaceSource {
	let last: { at: number; rows: Place[] } | null = null;
	let pending: Promise<Place[]> | null = null;
	return {
		rows() {
			if (last && now() - last.at < 60_000) return Promise.resolve(last.rows);
			pending ??= fetchPlaces(f)
				.then((rows) => {
					if (rows) last = { at: now(), rows };
					return last?.rows ?? [];
				})
				.finally(() => (pending = null));
			return pending;
		},
		local: loadPlace,
		allLocal: allPlaces,
		get deviceId() {
			return thisDevice().id;
		}
	};
}

export function mirrorLibrary(
	catalog: MirrorCatalog,
	sync: SyncState,
	places: PlaceSource = NO_PLACES
): LibrarySource {
	const source = createSnapshotLibrary(catalog, { fileUrl: (b) => fileUrlFor(catalog, b.id) });
	const byId = new Map(catalog.books.map((b) => [b.id, b]));

	const withPositions = (book: Book, rows: Place[]): BookWithPositions => {
		const positions = mergePositions(book.id, rows, places.local(book.id), places.deviceId);
		return { book, positions, status: statusFrom(positions) };
	};
	/** Books read on any device and not finished, most recently read first (spec 002 Home). */
	const inProgress = async () => {
		const rows = await places.rows();
		const ids = new Set([...rows.map((r) => r.bookId), ...places.allLocal().keys()]);
		return [...ids]
			.map((id) => byId.get(id))
			.filter((b): b is Book => !!b)
			.map((b) => withPositions(b, rows))
			.filter((b) => b.status.kind === 'in-progress')
			.sort((a, b) => latest(b).localeCompare(latest(a)));
	};
	const latest = (b: BookWithPositions) =>
		b.positions.reduce((m, p) => (p.readAt > m ? p.readAt : m), '');

	return {
		...source,
		current: async () => (await inProgress())[0] ?? null,
		alsoReading: async (limit) =>
			(await inProgress()).slice(1, 1 + Math.min(limit, ALSO_READING_MAX)),
		book: async (id) => {
			const page = await source.book(id);
			return page ? { ...page, ...withPositions(page.book, await places.rows()) } : null;
		},
		positions: async (id) => {
			const book = byId.get(id);
			return book ? withPositions(book, await places.rows()).positions : [];
		},
		status: async (id) => {
			const book = byId.get(id);
			return book ? withPositions(book, await places.rows()).status : { kind: 'unread' };
		},
		syncStatus: async () => sync,
		files: async (bookId) => {
			const page = await source.book(bookId);
			return page ? filesFor(catalog, page.book) : [];
		}
	};
}

/** Thrown when Cloudflare Access sent us to sign in instead of answering. */
export class SignInNeeded extends Error {}

export async function fetchMirror(f: typeof fetch = fetch): Promise<LibrarySource> {
	const res = await f('/api/catalog', { redirect: 'manual' });
	if (
		res.type === 'opaqueredirect' ||
		(res.status >= 300 && res.status < 400) ||
		res.status === 403
	)
		throw new SignInNeeded('Sign in again to see your library.');
	if (res.status === 404)
		return mirrorLibrary(
			{ version: 1, readAt: new Date(0).toISOString(), books: [], news: [], files: {} },
			{ state: 'attention' }
		);
	if (!res.ok) throw new Error(`The library could not be loaded (${res.status}).`);
	const catalog = (await res.json()) as MirrorCatalog;
	// The service worker marks a cached copy (spec 003 US4): offline, or signed out.
	const source = res.headers.get('x-longshelf-source');
	const sync: SyncState =
		source === 'sign-in'
			? { state: 'attention', reason: 'sign-in', lastSync: catalog.readAt }
			: source === 'offline'
				? { state: 'offline', lastSync: catalog.readAt }
				: { state: 'up-to-date', lastSync: catalog.readAt };
	return mirrorLibrary(catalog, sync, mirrorPlaces(f));
}

/** A LibrarySource whose methods wait for the real one, so importers need no changes. */
export function lazyLibrary(load: () => Promise<LibrarySource>): LibrarySource {
	let ready: Promise<LibrarySource> | null = null;
	const get = () => {
		ready ??= load().catch((err) => {
			ready = null; // try again on the next call
			throw err;
		});
		return ready;
	};
	return new Proxy({} as LibrarySource, {
		get:
			(_, name: string) =>
			async (...args: unknown[]) => {
				const source = await get();
				return (source[name as keyof LibrarySource] as (...a: unknown[]) => unknown)(...args);
			}
	});
}
