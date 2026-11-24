import { json } from '@sveltejs/kit';
import { PlanRequestSchema } from '@longshelf/shared/ingest';
import { body, guarded, mirrorStore } from '#lib/server/mirror/http.ts';
import { plan } from '#lib/server/mirror/ingest.ts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request }) =>
	guarded(async () => json(await plan(mirrorStore(), await body(request, PlanRequestSchema))));
