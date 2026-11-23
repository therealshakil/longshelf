import { json } from '@sveltejs/kit';
import { aiEnv } from '#lib/server/ai/env.ts';
import { genreIndex } from '#lib/server/ai/genres.ts';
import { requireEnabled } from '#lib/server/ai/suggestions.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const { db, store } = aiEnv();
	await requireEnabled(store);
	return json(await genreIndex(db));
};
