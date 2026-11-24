import { z } from 'zod';
import { BookSchema } from './types.ts';
import type { LibrarySnapshot } from './snapshot.ts';

/**
 * The document the browser downloads from the mirror (spec 003 data-model.md): the local
 * snapshot shape plus each book's stored files. The CLI builds it; the Worker only streams it.
 */
export const Sha256Schema = z.string().regex(/^[0-9a-f]{64}$/, 'a lowercase hex SHA-256');

export const StoredFileSchema = z.object({
	format: z.string().min(1),
	sha256: Sha256Schema,
	size: z.number().int().nonnegative()
});
export type StoredFile = z.infer<typeof StoredFileSchema>;

export const MirrorCatalogSchema = z.object({
	version: z.literal(1),
	readAt: z.string(),
	books: z.array(BookSchema),
	news: z.array(BookSchema),
	files: z.record(z.string(), z.array(StoredFileSchema))
});
export type MirrorCatalog = z.infer<typeof MirrorCatalogSchema> & LibrarySnapshot;

/** JSON with keys sorted at every level and undefined dropped, so equal data hashes equally. */
export function canonicalJson(value: unknown): string {
	return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(sortKeys);
	if (value && typeof value === 'object') {
		const out: Record<string, unknown> = {};
		for (const key of Object.keys(value).sort()) {
			const v = (value as Record<string, unknown>)[key];
			if (v !== undefined) out[key] = sortKeys(v);
		}
		return out;
	}
	return value;
}
