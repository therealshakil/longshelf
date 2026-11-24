import { json } from '@sveltejs/kit';
import { createMultipart } from '#lib/server/mirror/blobs.ts';
import { guarded, kindParam, mirrorStore, shaParam } from '#lib/server/mirror/http.ts';
import { requireRun } from '#lib/server/mirror/ingest.ts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ params, url }) =>
	guarded(async () => {
		const store = mirrorStore();
		await requireRun(store.db, url.searchParams.get('run') ?? '');
		const uploadId = await createMultipart(store, shaParam(params.sha), kindParam(url));
		return json({ uploadId });
	});
