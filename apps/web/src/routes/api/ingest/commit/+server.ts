import { json } from '@sveltejs/kit';
import { CommitRequestSchema } from '@longshelf/shared/ingest';
import { body, guarded, mirrorStore } from '#lib/server/mirror/http.ts';
import { commit } from '#lib/server/mirror/ingest.ts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request }) =>
	guarded(async () => json(await commit(mirrorStore(), await body(request, CommitRequestSchema))));
