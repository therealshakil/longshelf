import { error, json } from '@sveltejs/kit';
import { GenreJobSchema } from '@ribbon/shared/ai';
import { aiEnv } from '#lib/server/ai/env.ts';
import { suggestGenres } from '#lib/server/ai/genres.ts';
import { library } from '#lib/library/index.ts';
import type { RequestHandler } from './$types';

/** Operator action: suggest genres for unchecked books. Run again while `remaining` is above 0. */
export const POST: RequestHandler = async ({ request }) => {
	// A JSON request can't be sent from another site without a preflight.
	if (!request.headers.get('content-type')?.startsWith('application/json'))
		error(415, 'Send JSON.');
	const parsed = GenreJobSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) error(400, 'Send {} or { "bookIds": [...] }.');
	const { ai, db, store } = aiEnv();
	const books = await library.allBooks();
	return json(await suggestGenres({ ai, db, store, books, bookIds: parsed.data.bookIds }));
};
