import { mirrorStore } from '#lib/server/mirror/http.ts';
import { serveCatalog } from '#lib/server/mirror/serve.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request }) => serveCatalog(mirrorStore(), request);
