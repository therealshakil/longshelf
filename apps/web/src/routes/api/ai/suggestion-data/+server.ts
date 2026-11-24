import { json } from '@sveltejs/kit';
import { aiEnv } from '#lib/server/ai/env.ts';
import { MODELS } from '#lib/server/ai/models.ts';
import { activeDismissals, requireEnabled } from '#lib/server/ai/suggestions.ts';
import type { RequestHandler } from './$types';

/**
 * What the browser needs to run Read next and More like this itself (spec 003 T027, owner ruling
 * after the T003 spike): stored matches for the seed books, every known copy, and active
 * dismissals. No library is loaded here, so the Worker stays within the Free plan's CPU.
 */
export const GET: RequestHandler = async ({ url }) => {
	const { db, store } = aiEnv();
	await requireEnabled(store);
	const seeds = (url.searchParams.get('seeds') ?? '').split(',').filter(Boolean).slice(0, 50);
	const [rows, dismissed] = await Promise.all([
		db
			.prepare(
				`SELECT book_id, neighbours, copies FROM book_neighbours
				 WHERE model = ? AND (copies IS NOT NULL OR book_id IN (SELECT value FROM json_each(?)))`
			)
			.bind(MODELS.embedding, JSON.stringify(seeds))
			.all<{ book_id: string; neighbours: string; copies: string | null }>(),
		activeDismissals(db)
	]);
	const wanted = new Set(seeds);
	return json({
		neighbours: Object.fromEntries(
			rows.results
				.filter((r) => wanted.has(r.book_id))
				.map((r) => [r.book_id, JSON.parse(r.neighbours) as [string, number][]])
		),
		copies: Object.fromEntries(
			rows.results
				.filter((r) => r.copies)
				.map((r) => [r.book_id, JSON.parse(r.copies!) as string[]])
		),
		dismissed: [...dismissed]
	});
};
