import { json } from '@sveltejs/kit';
import { MultipartCompleteRequestSchema } from '@longshelf/shared/ingest';
import { completeMultipart } from '#lib/server/mirror/blobs.ts';
import {
	body,
	guarded,
	kindParam,
	mirrorStore,
	RequestError,
	shaParam
} from '#lib/server/mirror/http.ts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request, params, url }) =>
	guarded(async () => {
		const size = Number(url.searchParams.get('size'));
		if (!Number.isInteger(size) || size <= 0) throw new RequestError('size is required.');
		const { parts } = await body(request, MultipartCompleteRequestSchema);
		const sha = shaParam(params.sha);
		await completeMultipart(mirrorStore(), sha, kindParam(url), params.uploadId, parts, size);
		return json({ sha256: sha, stored: true }, { status: 201 });
	});
