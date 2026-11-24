import { json } from '@sveltejs/kit';
import { abortMultipart } from '#lib/server/mirror/blobs.ts';
import { guarded, kindParam, mirrorStore, shaParam } from '#lib/server/mirror/http.ts';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = ({ params, url }) =>
	guarded(async () => {
		await abortMultipart(mirrorStore(), shaParam(params.sha), kindParam(url), params.uploadId);
		return json({ ok: true });
	});
