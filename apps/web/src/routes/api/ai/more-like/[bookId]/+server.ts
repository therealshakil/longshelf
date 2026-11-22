import { error, json } from '@sveltejs/kit';
import type { Suggestions } from '@ribbon/shared/ai';
import { aiEnv } from '#lib/server/ai/env.ts';
import { moreLike } from '#lib/server/ai/suggest.ts';
import { activeDismissals, requireEnabled, suggestItems } from '#lib/server/ai/suggestions.ts';
import { library } from '#lib/library/index.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const { db, store } = aiEnv();
	await requireEnabled(store);
	const [items, dismissed] = await Promise.all([suggestItems(db, library), activeDismissals(db)]);
	if (!items.some((i) => i.book.id === params.bookId)) error(404, 'No such book.');
	const body: Suggestions = { items: moreLike(params.bookId, items, dismissed) };
	return json(body);
};
