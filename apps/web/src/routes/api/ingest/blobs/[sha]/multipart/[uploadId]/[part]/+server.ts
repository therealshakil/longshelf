import { json } from '@sveltejs/kit';
import { PART_SIZE } from '@longshelf/shared/ingest';
import { uploadPart } from '#lib/server/mirror/blobs.ts';
import {
	guarded,
	kindParam,
	mirrorStore,
	RequestError,
	shaParam
} from '#lib/server/mirror/http.ts';
import type { RequestHandler } from './$types';

/** One part of at most 50 MB, streamed to R2. */
export const PUT: RequestHandler = ({ request, params, url }) =>
	guarded(async () => {
		const part = Number(params.part);
		const size = Number(request.headers.get('content-length'));
		if (!Number.isInteger(part) || part < 1) throw new RequestError('Part numbers start at 1.');
		if (!(size > 0 && size <= PART_SIZE)) throw new RequestError('Each part is at most 50 MB.');
		if (!request.body) throw new RequestError('The part is empty.');
		const stream = request.body.pipeThrough(new FixedLengthStream(size));
		return json(
			await uploadPart(
				mirrorStore(),
				shaParam(params.sha),
				kindParam(url),
				params.uploadId,
				part,
				stream
			)
		);
	});
