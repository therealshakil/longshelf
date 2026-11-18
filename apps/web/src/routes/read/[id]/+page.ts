import { library } from '#lib/library/index.ts';
import type { PageLoad } from './$types';

export const ssr = false; // the reader runs in the browser only (foliate-js, local settings)

export const load: PageLoad = async ({ params }) => {
	const [book, fileUrl] = await Promise.all([
		library.book(params.id),
		library.bookFileUrl(params.id)
	]);
	return { book, fileUrl };
};
