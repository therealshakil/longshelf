/**
 * Plain library search in the browser (DR-0006). It tolerates typos, costs no Worker CPU and works
 * offline. Titles, authors and tags only: descriptions make the index far heavier on a phone.
 */
import MiniSearch from 'minisearch';
import type { Book } from '@ribbon/shared/library';

export const SEARCH_MAX = 50;
const MAX_QUERY_CHARS = 200;

type Field = 'title' | 'author' | 'tags';
type Doc = { id: string; title: string; author: string; tags: string };

export type SearchHit = { book: Book; reason: string };
export type SearchResult = { total: number; items: SearchHit[] };

const LABELS: [Field, string][] = [
	['title', 'Title'],
	['author', 'author'],
	['tags', 'tag']
];

/** Lower case without accents, so "bronte" finds "Brontë". */
const plain = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

function reasonFor(fields: Set<string>): string {
	const names = LABELS.filter(([field]) => fields.has(field)).map(([, label]) => label);
	if (names.length === 1) return `${names[0][0].toUpperCase()}${names[0].slice(1)} matches`;
	const first = names[0][0].toUpperCase() + names[0].slice(1);
	const middle = names
		.slice(1, -1)
		.map((n) => `, ${n}`)
		.join('');
	return `${first}${middle} and ${names.at(-1)} match`;
}

export function createBookSearch(books: Book[]) {
	const byId = new Map(books.map((b) => [b.id, b]));
	const index = new MiniSearch<Doc>({
		fields: ['title', 'author', 'tags'],
		processTerm: (term) => plain(term) || null,
		searchOptions: {
			boost: { title: 4, author: 3, tags: 1.5 },
			combineWith: 'AND',
			prefix: (term) => term.length >= 2,
			// Short words stay exact, so "war" doesn't also find "car".
			fuzzy: (term) => (term.length >= 4 ? 0.2 : false)
		}
	});
	index.addAll(
		books.map((b) => ({
			id: b.id,
			title: b.subtitle ? `${b.title} ${b.subtitle}` : b.title,
			author: b.authors.map((a) => a.name).join(' '),
			tags: b.tags.join(' ')
		}))
	);

	return (query: string): SearchResult => {
		const q = query.trim().slice(0, MAX_QUERY_CHARS);
		if (!q) return { total: 0, items: [] };
		const wanted = plain(q);
		const hits = index
			.search(q)
			.map((r, rank) => ({ r, rank, exact: plain(byId.get(r.id)?.title ?? '') === wanted }))
			.sort((a, b) => Number(b.exact) - Number(a.exact) || a.rank - b.rank);
		const items = hits.slice(0, SEARCH_MAX).flatMap(({ r }) => {
			const book = byId.get(r.id);
			return book ? [{ book, reason: reasonFor(new Set(Object.values(r.match).flat())) }] : [];
		});
		return { total: hits.length, items };
	};
}

let cached: { key: string; search: ReturnType<typeof createBookSearch> } | null = null;

/** One index per catalogue, rebuilt only when searchable details change. */
export function bookSearch(books: Book[]) {
	const key = JSON.stringify(books.map((b) => [b.id, b.title, b.subtitle, b.authors, b.tags]));
	if (cached?.key !== key) cached = { key, search: createBookSearch(books) };
	return cached.search;
}
