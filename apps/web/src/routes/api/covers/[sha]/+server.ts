import { mirrorStore } from '#lib/server/mirror/http.ts';
import { serveCover } from '#lib/server/mirror/serve.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params, url }) =>
	serveCover(mirrorStore(), params.sha, url.searchParams.get('size') === 'full');
