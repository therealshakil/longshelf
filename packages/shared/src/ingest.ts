/**
 * The ingest API contract between the longshelf CLI and the Worker
 * (specs/003-library-mirror/contracts/ingest-api.md).
 */
import { z } from 'zod';
import { Sha256Schema, StoredFileSchema } from './library/catalog.ts';
import { BookSchema } from './library/types.ts';

export { Sha256Schema, StoredFileSchema };

/** Files at or under this size go up in one request; larger ones use multipart (research R1). */
export const SINGLE_PUT_MAX = 95 * 1024 * 1024;
/** Multipart part size. R2 needs equal parts (except the last) of at least 5 MiB. */
export const PART_SIZE = 50 * 1024 * 1024;
/** A run removing more than this share of the mirror needs the owner's confirmation (FR-006). */
export const REMOVAL_CONFIRM_SHARE = 0.1;

export const BlobKindSchema = z.enum(['file', 'cover', 'catalog']);
export type BlobKind = z.infer<typeof BlobKindSchema>;

export const PlanBookSchema = z.object({
	id: z.string().min(1),
	metadataHash: Sha256Schema,
	cover: z.object({ sha256: Sha256Schema, size: z.number().int().nonnegative() }).optional(),
	files: z.array(StoredFileSchema)
});
export type PlanBook = z.infer<typeof PlanBookSchema>;

export const PlanRequestSchema = z.object({ books: z.array(PlanBookSchema) });
export type PlanRequest = z.infer<typeof PlanRequestSchema>;

export const PlanResponseSchema = z.object({
	runId: z.string().min(1),
	missingBlobs: z.array(Sha256Schema),
	changedBooks: z.array(z.string()),
	removedBooks: z.array(z.object({ id: z.string(), title: z.string() })),
	removalNeedsConfirm: z.boolean()
});
export type PlanResponse = z.infer<typeof PlanResponseSchema>;

export const CommitBookSchema = z.object({
	id: z.string().min(1),
	metadata: BookSchema,
	metadataHash: Sha256Schema,
	isNews: z.boolean(),
	coverSha256: Sha256Schema.optional(),
	files: z.array(StoredFileSchema)
});
export type CommitBook = z.infer<typeof CommitBookSchema>;

export const CommitRequestSchema = z.object({
	runId: z.string().min(1),
	books: z.array(CommitBookSchema),
	removed: z.array(z.string()),
	confirmRemovals: z.boolean().optional(),
	catalogSha256: Sha256Schema
});
export type CommitRequest = z.infer<typeof CommitRequestSchema>;

export const CommitResponseSchema = z.object({
	added: z.number().int(),
	updated: z.number().int(),
	removed: z.number().int(),
	catalogSha256: Sha256Schema,
	bytesFreed: z.number().int()
});
export type CommitResponse = z.infer<typeof CommitResponseSchema>;

export const MultipartCreateResponseSchema = z.object({
	uploadId: z.string().min(1)
});
export const MultipartPartResponseSchema = z.object({
	part: z.number().int().positive(),
	etag: z.string().min(1)
});
export const MultipartCompleteRequestSchema = z.object({
	parts: z.array(MultipartPartResponseSchema).min(1)
});
export type MultipartCompleteRequest = z.infer<typeof MultipartCompleteRequestSchema>;

export const AbortRequestSchema = z.object({ runId: z.string().min(1) });

export const IngestErrorSchema = z.object({
	error: z.string(),
	detail: z.string().optional()
});
export type IngestError = z.infer<typeof IngestErrorSchema>;
