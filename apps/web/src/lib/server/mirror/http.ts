/**
 * Shared plumbing for the mirror routes: the store from the Worker bindings, and plain-words
 * JSON errors (contracts/ingest-api.md: `{ error, detail? }`).
 */
import { json } from '@sveltejs/kit';
import { env } from 'cloudflare:workers';
import {
	Sha256Schema,
	BlobKindSchema,
	SINGLE_PUT_MAX,
	type BlobKind
} from '@longshelf/shared/ingest';
import { BlobError, type Store } from './blobs.ts';
import { IngestError } from './ingest.ts';

export function mirrorStore(): Store {
	const e = env as Partial<Env>;
	if (!e.DB || !e.BUCKET) throw new IngestError(409, 'The mirror storage is not configured.');
	return { db: e.DB, bucket: e.BUCKET, images: e.IMAGES };
}

const problem = (status: number, error: string, detail?: string) =>
	json(detail ? { error, detail } : { error }, { status });

/** Runs a route body and turns known failures into plain JSON errors. */
export async function guarded(fn: () => Promise<Response>): Promise<Response> {
	try {
		return await fn();
	} catch (err) {
		if (err instanceof IngestError) return problem(err.status, err.message, err.detail);
		if (err instanceof BlobError) return problem(err.status, err.message);
		if (err instanceof RequestError) return problem(400, err.message);
		throw err;
	}
}

export class RequestError extends Error {}

/** Anything with Zod's safeParse, so this module needs no direct Zod import. */
interface Schema<T> {
	safeParse(
		value: unknown
	): { success: true; data: T } | { success: false; error: { issues: { message: string }[] } };
}

/** Parses a JSON body with a schema, or fails with a 400 naming the problem. */
export async function body<T>(request: Request, schema: Schema<T>): Promise<T> {
	let raw: unknown;
	try {
		raw = await request.json();
	} catch {
		throw new RequestError('The request body is not JSON.');
	}
	const parsed = schema.safeParse(raw);
	if (!parsed.success)
		throw new RequestError(`The request is not valid: ${parsed.error.issues[0]?.message}`);
	return parsed.data;
}

export function shaParam(value: string): string {
	if (!Sha256Schema.safeParse(value).success) throw new RequestError('Not a SHA-256.');
	return value;
}

export function kindParam(url: URL): BlobKind {
	const parsed = BlobKindSchema.safeParse(url.searchParams.get('kind') ?? 'file');
	if (!parsed.success) throw new RequestError('kind must be file, cover or catalog.');
	return parsed.data;
}

/** The declared body size, refusing a single upload over the limit (research R1). */
export function singleSize(request: Request): number {
	const size = Number(request.headers.get('content-length'));
	if (!Number.isFinite(size) || size <= 0) throw new RequestError('Content-Length is required.');
	if (size > SINGLE_PUT_MAX) throw new BlobError(413, 'Too large for one request: use multipart.');
	return size;
}
