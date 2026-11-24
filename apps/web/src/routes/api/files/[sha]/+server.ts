import { mirrorStore } from '#lib/server/mirror/http.ts';
import { serveFile } from '#lib/server/mirror/serve.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params, request, url }) =>
	serveFile(mirrorStore(), params.sha, request, url.searchParams.get('download'));
