import type { LibrarySource } from '@ribbon/shared/library';
import { createSampleLibrary } from '@ribbon/shared/sample';

/**
 * The one place that chooses where library data comes from (spec 002 FR-007).
 * Sample data now; spec 003 swaps in the mirror-backed source here and nowhere else.
 */
export const library: LibrarySource = createSampleLibrary();

export { statusLabel, statusFrom } from '@ribbon/shared/library';

import type { Book, ReadStatus } from '@ribbon/shared/library';

/** Read status for a list of books, keyed by id, so tiles show it (FR-005). */
export async function statusesFor(books: Book[]): Promise<Record<string, ReadStatus>> {
	const entries = await Promise.all(
		books.map(async (b) => [b.id, await library.status(b.id)] as const)
	);
	return Object.fromEntries(entries);
}
