/**
 * Reading places between the browser and the mirror (spec 004,
 * specs/004-reading/contracts/progress-api.md). One place per book and device; the latest
 * `readAt` wins (FR-011).
 */
import { z } from 'zod';

/** At most this many places in one PUT. */
export const MAX_PLACES_PER_PUT = 100;
/** A `readAt` further ahead of the server than this is clamped to the server's time (research R5). */
export const MAX_CLOCK_LEAD_MS = 5 * 60 * 1000;

export const PlaceSchema = z
	.object({
		bookId: z.string().min(1),
		deviceId: z.string().min(1),
		deviceName: z.string().min(1).max(60),
		/** 0–100 through the book. */
		percent: z.number().min(0).max(100),
		chapterLabel: z.string().max(200),
		href: z.string().max(500),
		/** 0–1 within the chapter. */
		fraction: z.number().min(0).max(1),
		cfi: z.string().max(1000).optional(),
		/** The file the CFI belongs to; another file falls back to href + fraction (R6). */
		fileSha256: z.string().regex(/^[0-9a-f]{64}$/).optional(),
		furthestPercent: z.number().min(0).max(100),
		furthestHref: z.string().max(500),
		readAt: z.iso.datetime()
	})
	.refine((p) => p.furthestPercent >= p.percent, {
		message: '`furthestPercent` must be at least `percent`'
	});
export type Place = z.infer<typeof PlaceSchema>;

export const ProgressGetSchema = z.object({ places: z.array(PlaceSchema) });
export type ProgressGet = z.infer<typeof ProgressGetSchema>;

export const ProgressPutSchema = z.object({
	places: z.array(PlaceSchema).min(1).max(MAX_PLACES_PER_PUT)
});
export type ProgressPut = z.infer<typeof ProgressPutSchema>;

const PlaceKeySchema = z.object({
	bookId: z.string(),
	deviceId: z.string(),
	readAt: z.iso.datetime()
});
export type PlaceKey = z.infer<typeof PlaceKeySchema>;

/** `stale`: older than what the mirror holds. The browser treats both lists as sent. */
export const ProgressPutResultSchema = z.object({
	accepted: z.array(PlaceKeySchema),
	stale: z.array(PlaceKeySchema)
});
export type ProgressPutResult = z.infer<typeof ProgressPutResultSchema>;

/** The server's clamp: a time too far ahead becomes `now` (research R5). */
export function clampReadAt(readAt: string, now: number): string {
	return Date.parse(readAt) > now + MAX_CLOCK_LEAD_MS ? new Date(now).toISOString() : readAt;
}
