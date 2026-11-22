import { json } from '@sveltejs/kit';
import type { Suggestions } from '@ribbon/shared/ai';
import { aiEnv } from '#lib/server/ai/env.ts';
import { readNext } from '#lib/server/ai/suggest.ts';
import { activeDismissals, requireEnabled, suggestItems } from '#lib/server/ai/suggestions.ts';
import { library } from '#lib/library/index.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const { db, store } = aiEnv();
	await requireEnabled(store);
	const [items, dismissed] = await Promise.all([suggestItems(db, library), activeDismissals(db)]);
	const body: Suggestions = { items: readNext(items, dismissed) };
	return json(body);
};
