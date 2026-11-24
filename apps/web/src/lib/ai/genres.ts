import {
	BookGenresSchema,
	GenreChangeSchema,
	GenreIndexSchema,
	type BookGenres,
	type GenreAction,
	type GenreIndex,
	type GenreState
} from '@longshelf/shared/ai';
import { bookSortKey, type Book, type Shelf, type ShelfSummary } from '@longshelf/shared/library';
import { library } from '#lib/library/index.ts';

export type BookGenre = BookGenres['genres'][number];
export type GenreSort = 'title' | 'author' | 'added';

export const genreSlug = (name: string) =>
	name
		.normalize('NFKD')
		.replace(/\p{M}/gu, '')
		.replace(/[’']/g, '')
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, '-')
		.replace(/^-|-$/g, '');

const ORDER: Record<GenreSort, (a: Book, b: Book) => number> = {
	title: (a, b) => bookSortKey(a).localeCompare(bookSortKey(b)),
	author: (a, b) => (a.authors[0]?.sort ?? '').localeCompare(b.authors[0]?.sort ?? ''),
	added: (a, b) => b.addedAt.localeCompare(a.addedAt)
};

/** One shelf per genre, largest first. Books no longer in the library are left out. */
export function shelvesFrom(
	items: GenreIndex['items'],
	books: Book[],
	sort: GenreSort = 'title'
): Shelf[] {
	const byId = new Map(books.map((b) => [b.id, b]));
	const groups = new Map<string, { book: Book; state: GenreState }[]>();
	for (const { bookId, name, state } of items) {
		const book = byId.get(bookId);
		if (book) groups.set(name, [...(groups.get(name) ?? []), { book, state }]);
	}
	return [...groups]
		.map(([name, list]) => {
			const sorted = list.map((x) => x.book).sort(ORDER[sort]);
			return {
				kind: 'genre' as const,
				id: genreSlug(name),
				name,
				count: list.length,
				sample: sorted.slice(0, 3),
				suggested: list.filter((x) => x.state !== 'in_calibre').length,
				books: sorted
			};
		})
		.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

async function loadIndex(f: typeof fetch): Promise<GenreIndex['items'] | null> {
	try {
		const r = await f('/api/ai/genres');
		return r.ok ? GenreIndexSchema.parse(await r.json()).items : null;
	} catch {
		return null;
	}
}

export async function loadGenreShelves(f: typeof fetch): Promise<ShelfSummary[]> {
	const items = await loadIndex(f);
	if (!items) return [];
	return shelvesFrom(items, await library.allBooks()).map((s) => ({
		kind: s.kind,
		id: s.id,
		name: s.name,
		count: s.count,
		sample: s.sample,
		suggested: s.suggested
	}));
}

export async function loadGenreShelf(
	f: typeof fetch,
	id: string,
	sort: GenreSort
): Promise<Shelf | null> {
	const items = await loadIndex(f);
	if (!items) return null;
	return shelvesFrom(items, await library.allBooks(), sort).find((s) => s.id === id) ?? null;
}

export async function loadBookGenres(f: typeof fetch, bookId: string): Promise<BookGenre[]> {
	try {
		const r = await f(`/api/ai/genres/${encodeURIComponent(bookId)}`);
		return r.ok ? BookGenresSchema.parse(await r.json()).genres : [];
	} catch {
		return [];
	}
}

/** The new state, or null if the change didn't go through. */
export async function changeBookGenre(
	bookId: string,
	name: string,
	action: GenreAction
): Promise<GenreState | null> {
	try {
		const r = await fetch(`/api/ai/genres/${encodeURIComponent(bookId)}`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ name, action })
		});
		return r.ok ? GenreChangeSchema.parse(await r.json()).state : null;
	} catch {
		return null;
	}
}
