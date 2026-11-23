import { error } from '@sveltejs/kit';
import { library } from '#lib/library/index.ts';
import { loadBookGenres } from '#lib/ai/genres.ts';
import { loadSuggestions } from '#lib/ai/suggestions.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, fetch, parent }) => {
	const book = await library.book(params.id);
	if (!book) error(404, 'That book isn’t in your library.');
	const { ai } = await parent();
	const id = encodeURIComponent(params.id);
	const [moreLike, genres] = ai
		? await Promise.all([
				loadSuggestions(fetch, `/api/ai/more-like/${id}`),
				loadBookGenres(fetch, params.id)
			])
		: [[], []];
	return { book, moreLike, genres };
};
