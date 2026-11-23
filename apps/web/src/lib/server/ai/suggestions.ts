/**
 * What the suggestion endpoints need from storage (spec 002 US5): the library with read status
 * and vectors, and the owner's dismissals. No model is called here, so reads cost no neurons.
 */
import { error } from '@sveltejs/kit';
import type { LibrarySource } from '@longshelf/shared/library';
import { isEnabled, type GuardStore } from './guard.ts';
import { MODELS } from './models.ts';
import { decodeNeighbours } from './neighbours.ts';
import type { SuggestItem } from './suggest.ts';

/** ASSUMPTION: starting value (data-model.md). */
export const NOT_NOW_DAYS = 30;
const DAY_MS = 86_400_000;

export type DismissKind = 'not_now' | 'never';

/** With AI off, the suggestion areas hide themselves (FR-016). */
export async function requireEnabled(store: GuardStore) {
	if (!(await isEnabled(store))) error(503, JSON.stringify({ reason: 'ai_off' }));
}

export async function activeDismissals(db: D1Database, now = new Date()): Promise<Set<string>> {
	const { results } = await db
		.prepare('SELECT book_id FROM suggestion_dismissal WHERE until IS NULL OR until > ?')
		.bind(now.toISOString())
		.all<{ book_id: string }>();
	return new Set(results.map((r) => r.book_id));
}

export async function dismiss(db: D1Database, bookId: string, kind: DismissKind, now = new Date()) {
	const until =
		kind === 'not_now' ? new Date(now.getTime() + NOT_NOW_DAYS * DAY_MS).toISOString() : null;
	await db
		.prepare('INSERT OR REPLACE INTO suggestion_dismissal (book_id, kind, until) VALUES (?, ?, ?)')
		.bind(bookId, kind, until)
		.run();
}

export async function undoDismiss(db: D1Database, bookId: string) {
	await db.prepare('DELETE FROM suggestion_dismissal WHERE book_id = ?').bind(bookId).run();
}

/**
 * Every book with its status and last read time, plus stored matches for the books `seeds` picks
 * and any known copies. Loading only those rows keeps a request inside Worker CPU limits.
 */
export async function suggestItems(
	db: D1Database,
	library: LibrarySource,
	seeds: (items: SuggestItem[]) => string[]
): Promise<SuggestItem[]> {
	const books = await library.allBooks();
	const items: SuggestItem[] = await Promise.all(
		books.map(async (book) => {
			const [status, positions] = await Promise.all([
				library.status(book.id),
				library.positions(book.id)
			]);
			const lastReadAt = positions
				.map((p) => p.readAt)
				.sort()
				.at(-1);
			return { book, status, lastReadAt };
		})
	);
	const wanted = new Set(seeds(items));
	const { results } = await db
		.prepare(
			`SELECT book_id, neighbours, copies FROM book_neighbours
			 WHERE model = ? AND (copies IS NOT NULL OR book_id IN (SELECT value FROM json_each(?)))`
		)
		.bind(MODELS.embedding, JSON.stringify([...wanted]))
		.all<{ book_id: string; neighbours: string; copies: string | null }>();
	const rows = new Map(results.map((r) => [r.book_id, r]));
	for (const item of items) {
		const row = rows.get(item.book.id);
		if (!row) continue;
		if (row.copies) item.copies = JSON.parse(row.copies) as string[];
		if (wanted.has(item.book.id)) item.neighbours = decodeNeighbours(row.neighbours);
	}
	return items;
}
