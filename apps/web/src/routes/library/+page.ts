import { library, statusesFor } from '#lib/library/index.ts';
import { loadGenreShelves } from '#lib/ai/genres.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, parent }) => {
	const { ai } = await parent();
	const [recent, authors, collections, genres, periodicals, all] = await Promise.all([
		library.recentlyAdded(),
		library.authors(),
		library.shelves('collection'),
		ai ? loadGenreShelves(fetch) : library.shelves('genre'),
		library.periodicals(),
		library.allBooks()
	]);
	const statuses = await statusesFor(all);
	const inCollection = new Set(all.filter((b) => b.collection).map((b) => b.id));
	return {
		recent,
		authors,
		collections,
		noCollection: all.length - inCollection.size,
		genres,
		ai,
		periodicals,
		all,
		statuses,
		total: all.length
	};
};
