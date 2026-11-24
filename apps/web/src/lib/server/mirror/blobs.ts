/**
 * Content-addressed objects in R2 (spec 003 data-model "R2 keys", research R1 and R4).
 * Every object is immutable: its key is its SHA-256. A `blob` row exists only once the object
 * is fully stored, so "missing" never depends on listing the bucket.
 */
import { PART_SIZE, type BlobKind } from '@longshelf/shared/ingest';

export interface Store {
	db: D1Database;
	bucket: R2Bucket;
	/** Absent in tests and when the binding fails; thumbnails are then skipped. */
	images?: ImagesBinding;
}

const PREFIX: Record<BlobKind | 'thumb', string> = {
	file: 'f',
	cover: 'c',
	catalog: 'k',
	thumb: 't'
};
export const keyOf = (kind: BlobKind | 'thumb', sha256: string) => `${PREFIX[kind]}/${sha256}`;

export const THUMB_WIDTH = 400;

export async function blobRow(db: D1Database, sha256: string) {
	return db
		.prepare('SELECT sha256, kind, size FROM blob WHERE sha256 = ?')
		.bind(sha256)
		.first<{ sha256: string; kind: BlobKind; size: number }>();
}

/** The hashes among `shas` that have no stored object yet. */
export async function missingBlobs(db: D1Database, shas: string[]): Promise<string[]> {
	if (!shas.length) return [];
	const { results } = await db
		.prepare('SELECT sha256 FROM blob WHERE sha256 IN (SELECT value FROM json_each(?))')
		.bind(JSON.stringify(shas))
		.all<{ sha256: string }>();
	const have = new Set(results.map((r) => r.sha256));
	return [...new Set(shas)].filter((s) => !have.has(s));
}

async function recordBlob(db: D1Database, sha256: string, kind: BlobKind, size: number) {
	await db
		.prepare('INSERT OR IGNORE INTO blob (sha256, kind, size, stored_at) VALUES (?, ?, ?, ?)')
		.bind(sha256, kind, size, new Date().toISOString())
		.run();
}

export class BlobError extends Error {
	constructor(
		readonly status: 400 | 409 | 413,
		message: string
	) {
		super(message);
	}
}

/**
 * Stores one object of at most SINGLE_PUT_MAX bytes. R2 checks the SHA-256 itself, so a body
 * that doesn't match its name is rejected without the Worker hashing it.
 * Returns false when it was already stored.
 */
export async function putSingle(
	store: Store,
	sha256: string,
	kind: BlobKind,
	body: ReadableStream | ArrayBuffer,
	size: number
): Promise<boolean> {
	if (await blobRow(store.db, sha256)) return false;
	try {
		await store.bucket.put(keyOf(kind, sha256), body, { sha256 });
	} catch (err) {
		throw new BlobError(400, `The upload didn't match its hash (${String(err)}).`);
	}
	await recordBlob(store.db, sha256, kind, size);
	if (kind === 'cover') await makeThumb(store, sha256);
	return true;
}

/** A 400 px WebP of a cover, stored at t/<cover sha>. Failure only means screens use the original. */
export async function makeThumb(store: Store, sha256: string): Promise<boolean> {
	if (!store.images) return false;
	try {
		const original = await store.bucket.get(keyOf('cover', sha256));
		if (!original) return false;
		const out = await store.images
			.input(original.body)
			.transform({ width: THUMB_WIDTH })
			.output({ format: 'image/webp', quality: 75 });
		const bytes = await out.response().arrayBuffer();
		await store.bucket.put(keyOf('thumb', sha256), bytes, {
			httpMetadata: { contentType: 'image/webp' }
		});
		return true;
	} catch (err) {
		console.warn(`thumbnail for ${sha256} failed: ${String(err)}`);
		return false;
	}
}

// Multipart, for files over SINGLE_PUT_MAX (research R1).

export async function createMultipart(store: Store, sha256: string, kind: BlobKind) {
	const upload = await store.bucket.createMultipartUpload(keyOf(kind, sha256));
	return upload.uploadId;
}

export async function uploadPart(
	store: Store,
	sha256: string,
	kind: BlobKind,
	uploadId: string,
	part: number,
	body: ReadableStream | ArrayBuffer
) {
	const upload = store.bucket.resumeMultipartUpload(keyOf(kind, sha256), uploadId);
	const uploaded = await upload.uploadPart(part, body);
	return { part: uploaded.partNumber, etag: uploaded.etag };
}

/** Finishes a multipart upload and checks its total size before recording it. */
export async function completeMultipart(
	store: Store,
	sha256: string,
	kind: BlobKind,
	uploadId: string,
	parts: { part: number; etag: string }[],
	expectedSize: number
) {
	const key = keyOf(kind, sha256);
	const upload = store.bucket.resumeMultipartUpload(key, uploadId);
	const object = await upload.complete(
		[...parts].sort((a, b) => a.part - b.part).map((p) => ({ partNumber: p.part, etag: p.etag }))
	);
	if (object.size !== expectedSize) {
		await store.bucket.delete(key);
		throw new BlobError(400, `Upload size ${object.size} didn't match ${expectedSize}.`);
	}
	await recordBlob(store.db, sha256, kind, expectedSize);
}

export async function abortMultipart(
	store: Store,
	sha256: string,
	kind: BlobKind,
	uploadId: string
) {
	await store.bucket.resumeMultipartUpload(keyOf(kind, sha256), uploadId).abort();
}

/** How many parts a file of this size needs. */
export const partCount = (size: number) => Math.max(1, Math.ceil(size / PART_SIZE));
