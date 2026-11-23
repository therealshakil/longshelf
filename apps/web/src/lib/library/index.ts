import type { LibrarySource } from '@longshelf/shared/library';
import { createSnapshotLibrary } from '@longshelf/shared/library/snapshot';
import { createSampleLibrary } from '@longshelf/shared/sample';
import localCalibre from 'virtual:longshelf/calibre';

/**
 * The one place that chooses where library data comes from (spec 002 FR-007).
 * Sample data now, or a local Calibre library under `pnpm dev:calibre` (DR-0009); spec 003 swaps
 * in the mirror-backed source here and nowhere else.
 */
export const library: LibrarySource = localCalibre
	? createSnapshotLibrary(localCalibre, {
			fileUrl: (b) => (b.formats.includes('EPUB') ? `/__calibre/book/${b.id}.epub` : null)
		})
	: createSampleLibrary();

export { statusLabel, statusFrom } from '@longshelf/shared/library';

import type { Book, ReadStatus } from '@longshelf/shared/library';

/** Read status for a list of books, keyed by id, so tiles show it (FR-005). */
export async function statusesFor(books: Book[]): Promise<Record<string, ReadStatus>> {
	const entries = await Promise.all(
		books.map(async (b) => [b.id, await library.status(b.id)] as const)
	);
	return Object.fromEntries(entries);
}
