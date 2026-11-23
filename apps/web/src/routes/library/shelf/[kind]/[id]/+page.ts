import { error } from '@sveltejs/kit';
import { library, statusesFor } from '#lib/library/index.ts';
import { loadGenreShelf } from '#lib/ai/genres.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, url, fetch, parent }) => {
	const kind = params.kind === 'genre' ? 'genre' : 'collection';
	const sort =
		(['title', 'author', 'added'] as const).find((s) => s === url.searchParams.get('sort')) ??
		'title';
	const { ai } = await parent();
	const shelf =
		kind === 'genre'
			? ai
				? await loadGenreShelf(fetch, params.id, sort)
				: null
			: await library.shelf(kind, params.id, sort);
	if (!shelf) error(404, 'That shelf isn’t in your library.');
	return { shelf, sort, statuses: await statusesFor(shelf.books) };
};
