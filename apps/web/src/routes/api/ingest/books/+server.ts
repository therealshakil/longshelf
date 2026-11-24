import { json } from '@sveltejs/kit';
import { BooksRequestSchema } from '@longshelf/shared/ingest';
import { body, guarded, mirrorStore } from '#lib/server/mirror/http.ts';
import { writeBooks } from '#lib/server/mirror/ingest.ts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request }) =>
	guarded(async () =>
		json(await writeBooks(mirrorStore(), await body(request, BooksRequestSchema)))
	);
