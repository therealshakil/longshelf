import { error, json } from '@sveltejs/kit';
import { embedLibrary } from '#lib/server/ai/embeddings.ts';
import { aiEnv } from '#lib/server/ai/env.ts';
import { serverLibrary } from '#lib/server/mirror/server-library.ts';
import type { RequestHandler } from './$types';

/** Operator action: embed new or changed books. Run again while `remaining` is above 0. */
export const POST: RequestHandler = async ({ request }) => {
	// A JSON request can't be sent from another site without a preflight.
	if (!request.headers.get('content-type')?.startsWith('application/json'))
		error(415, 'Send JSON.');
	const { ai, db, store } = aiEnv();
	return json(await embedLibrary({ ai, db, store, books: await serverLibrary().allBooks() }));
};
