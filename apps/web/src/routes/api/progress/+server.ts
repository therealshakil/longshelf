import { guarded, mirrorStore } from '#lib/server/mirror/http.ts';
import { getProgress, putProgress } from '#lib/server/mirror/progress.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request }) =>
	guarded(() => getProgress(mirrorStore().db, request));

export const PUT: RequestHandler = ({ request }) =>
	guarded(() => putProgress(mirrorStore().db, request));
