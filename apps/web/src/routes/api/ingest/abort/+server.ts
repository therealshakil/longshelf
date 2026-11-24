import { json } from '@sveltejs/kit';
import { AbortRequestSchema } from '@longshelf/shared/ingest';
import { body, guarded, mirrorStore } from '#lib/server/mirror/http.ts';
import { abort } from '#lib/server/mirror/ingest.ts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request }) =>
	guarded(async () => {
		const { runId } = await body(request, AbortRequestSchema);
		await abort(mirrorStore(), runId);
		return json({ ok: true });
	});
