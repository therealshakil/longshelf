import { json } from '@sveltejs/kit';
import { putSingle } from '#lib/server/mirror/blobs.ts';
import {
	guarded,
	kindParam,
	mirrorStore,
	RequestError,
	shaParam,
	singleSize
} from '#lib/server/mirror/http.ts';
import { requireRun } from '#lib/server/mirror/ingest.ts';
import type { RequestHandler } from './$types';

/** One object up to 95 MB, streamed to R2, which checks its SHA-256 (contracts/ingest-api.md). */
export const PUT: RequestHandler = ({ request, params, url }) =>
	guarded(async () => {
		const store = mirrorStore();
		const sha = shaParam(params.sha);
		const kind = kindParam(url);
		const size = singleSize(request);
		await requireRun(store.db, url.searchParams.get('run') ?? '');
		if (!request.body) throw new RequestError('The upload is empty.');
		const stream = request.body.pipeThrough(new FixedLengthStream(size));
		const stored = await putSingle(store, sha, kind, stream, size);
		return json({ sha256: sha, stored }, { status: stored ? 201 : 200 });
	});
