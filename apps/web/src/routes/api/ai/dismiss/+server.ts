import { error, json } from '@sveltejs/kit';
import { DismissSchema, UndoDismissSchema } from '@longshelf/shared/ai';
import { aiEnv } from '#lib/server/ai/env.ts';
import { dismiss, undoDismiss } from '#lib/server/ai/suggestions.ts';
import { serverLibrary } from '#lib/server/mirror/server-library.ts';
import type { RequestHandler } from './$types';

/** A JSON request can't be sent from another site without a preflight. */
function requireJson(request: Request) {
	if (!request.headers.get('content-type')?.startsWith('application/json'))
		error(415, 'Send JSON.');
}

/** Works with AI off too: these are the owner's choices, and no model is called. */
export const POST: RequestHandler = async ({ request }) => {
	requireJson(request);
	const parsed = DismissSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) error(400, 'Send { "bookId", "kind": "not_now" or "never" }.');
	if (!(await serverLibrary().book(parsed.data.bookId))) error(404, 'No such book.');
	await dismiss(aiEnv().db, parsed.data.bookId, parsed.data.kind);
	return json({ ok: true });
};

export const DELETE: RequestHandler = async ({ request }) => {
	requireJson(request);
	const parsed = UndoDismissSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) error(400, 'Send { "bookId" }.');
	await undoDismiss(aiEnv().db, parsed.data.bookId);
	return json({ ok: true });
};
