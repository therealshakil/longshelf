import { error } from '@sveltejs/kit';
import { library } from '#lib/library/index.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const book = await library.book(params.id);
	if (!book) error(404, 'That book isn’t in your library.');
	return { book };
};
