import { json } from '@sveltejs/kit';
import { aiEnv } from '#lib/server/ai/env.ts';
import type { RequestHandler } from './$types';

/** Which chapters of a book already have a summary (so the client only fills gaps). */
export const GET: RequestHandler = async ({ params }) => {
	const { db } = aiEnv();
	const { results } = await db
		.prepare('SELECT ordinal FROM chapter_summary WHERE book_id = ? ORDER BY ordinal')
		.bind(params.bookId)
		.all<{ ordinal: number }>();
	return json({ ordinals: results.map((r) => r.ordinal) });
};
