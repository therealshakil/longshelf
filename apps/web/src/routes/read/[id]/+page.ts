import { library } from '#lib/library/index.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => ({ book: await library.book(params.id) });
