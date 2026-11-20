import { error } from '@sveltejs/kit';
import { library } from '#lib/library/index.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const page = await library.author(params.id);
	if (!page) error(404, 'That author isn’t in your library.');
	return { page };
};
