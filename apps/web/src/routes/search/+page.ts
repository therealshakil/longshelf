import { bookSearch } from '#lib/search/book-search.ts';
import { library } from '#lib/library/index.ts';
import type { PageLoad } from './$types';

// Search runs in the browser, so it works offline and uses no Worker CPU (DR-0006).
export const ssr = false;

export const load: PageLoad = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	if (!q) return { q, total: 0, items: [] };
	return { q, ...bookSearch(await library.allBooks())(q) };
};
