import { error, json } from '@sveltejs/kit';
import { GenreActionSchema, type GenreChange } from '@longshelf/shared/ai';
import { aiEnv } from '#lib/server/ai/env.ts';
import { bookGenres, changeGenre } from '#lib/server/ai/genres.ts';
import { requireEnabled } from '#lib/server/ai/suggestions.ts';
import { library } from '#lib/library/index.ts';
import type { RequestHandler } from './$types';

async function requireBook(id: string) {
	if (!(await library.book(id))) error(404, 'No such book.');
}

export const GET: RequestHandler = async ({ params }) => {
	const { db, store } = aiEnv();
	await requireEnabled(store);
	await requireBook(params.bookId);
	return json(await bookGenres(db, params.bookId));
};

/** Works with AI off too: these are the owner's choices, and no model is called. */
export const POST: RequestHandler = async ({ params, request }) => {
	// A JSON request can't be sent from another site without a preflight.
	if (!request.headers.get('content-type')?.startsWith('application/json'))
		error(415, 'Send JSON.');
	const parsed = GenreActionSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) error(400, 'Send { "name", "action": "promote" or "remove" }.');
	await requireBook(params.bookId);
	const { db } = aiEnv();
	const out = await changeGenre(db, params.bookId, parsed.data.name, parsed.data.action);
	if (!out.ok) {
		if (out.reason === 'not_found') error(404, 'This book doesn’t have that genre.');
		error(409, 'That genre can’t be changed that way.');
	}
	const body: GenreChange = { ok: true, state: out.state };
	return json(body);
};
