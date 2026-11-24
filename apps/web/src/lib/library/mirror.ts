/**
 * The mirror-backed library (spec 003, contracts/mirror-api.md): the whole catalogue fetched once
 * from /api/catalog, then served by the same snapshot code as local Calibre mode (DR-0009).
 */
import type { LibrarySource, SyncState } from '@longshelf/shared/library';
import type { MirrorCatalog } from '@longshelf/shared/library/catalog';
import { createSnapshotLibrary } from '@longshelf/shared/library/snapshot';

/** EPUB first, then KEPUB: the formats the reader opens (FR-011). */
const READABLE = ['EPUB', 'KEPUB'];

export function fileUrlFor(catalog: MirrorCatalog, bookId: string): string | null {
	const files = catalog.files[bookId] ?? [];
	for (const format of READABLE) {
		const file = files.find((f) => f.format === format);
		if (file) return `/api/files/${file.sha256}`;
	}
	return null;
}

export function mirrorLibrary(catalog: MirrorCatalog, sync: SyncState): LibrarySource {
	const source = createSnapshotLibrary(catalog, { fileUrl: (b) => fileUrlFor(catalog, b.id) });
	return { ...source, syncStatus: async () => sync };
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
	return mirrorLibrary(catalog, { state: 'up-to-date', lastSync: catalog.readAt });
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
