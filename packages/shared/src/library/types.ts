import { z } from "zod";

/** Library entities read by every screen (specs/002-redesign-and-ai/data-model.md). */

export const AuthorRefSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	/** Sort form, e.g. "Austen, Jane". Single-name authors sort as themselves. */
	sort: z.string().min(1),
});
export type AuthorRef = z.infer<typeof AuthorRefSchema>;

export const CoverSchema = z.object({
	url: z.string().min(1),
	alt: z.string(),
});

export const BookSchema = z.object({
	id: z.string().min(1),
	title: z.string().min(1),
	subtitle: z.string().optional(),
	authors: z.array(AuthorRefSchema),
	cover: CoverSchema.optional(),
	description: z.string().optional(),
	series: z.object({ name: z.string(), index: z.number() }).optional(),
	/** Calibre's single-value Collection column. Read only: Longshelf never writes it. */
	collection: z.string().optional(),
	tags: z.array(z.string()),
	formats: z.array(z.string()),
	addedAt: z.iso.date(),
	pubYear: z.string().optional(),
	publisher: z.string().optional(),
	/** Calibre's title sort, e.g. "Tale of Two Cities, A". */
	sort: z.string().optional(),
	/** 0 to 5 stars (Calibre stores 0 to 10). */
	rating: z.number().min(0).max(5).optional(),
});
export type Book = z.infer<typeof BookSchema>;

export const SourceKindSchema = z.string().min(1); // 'this-device' | 'kobo' | another device id

export const ReadingPositionSchema = z
	.object({
		bookId: z.string().min(1),
		source: SourceKindSchema,
		/** `percent` is 0–100. */
		percent: z.number().min(0).max(100),
		chapterLabel: z.string(),
		href: z.string(),
		fraction: z.number().min(0).max(1),
		cfi: z.string().optional(),
		/** The file the CFI belongs to; another file falls back to href, then percent (spec 004 R6). */
		fileSha256: z.string().optional(),
		/** The device's own name, from the mirror (spec 004 FR-013). */
		deviceName: z.string().optional(),
		readAt: z.iso.datetime(),
		furthestHref: z.string(),
		furthestPercent: z.number().min(0).max(100),
	})
	.refine((p) => p.furthestPercent >= p.percent, {
		message: "`furthestPercent` ≥ `percent` for the same source",
	});
export type ReadingPosition = z.infer<typeof ReadingPositionSchema>;

export type ReadStatus =
	| { kind: "unread" }
	| { kind: "in-progress"; percent: number }
	| { kind: "finished" };

export const AuthorSchema = AuthorRefSchema.extend({
	lifeDates: z.string().optional(),
	bio: z.object({ text: z.string(), source: z.url() }).optional(),
	portrait: z
		.object({
			url: z.string(),
			credit: z.string(),
			licence: z.string(),
			source: z.url().optional(),
			alt: z.string(),
		})
		.optional(),
	bibliography: z.array(
		z.object({
			title: z.string(),
			year: z.string().optional(),
			ownedBookId: z.string().optional(),
		}),
	),
});
export type Author = z.infer<typeof AuthorSchema>;

export type ShelfKind = "collection" | "genre";

export interface ShelfSummary {
	kind: ShelfKind;
	id: string;
	name: string;
	count: number;
	/** Up to three cover samples for the fanned stack. */
	sample: Book[];
	/** Genres only: how many of the count are still suggestions. */
	suggested?: number;
}

export interface Shelf extends ShelfSummary {
	books: Book[];
}

export const PeriodicalIssueSchema = z.object({
	id: z.string().min(1),
	publication: z.string().min(1),
	issueDate: z.iso.date(),
	/** Display label for the date, e.g. "Sat 14 Nov" or "November". */
	issueLabel: z.string(),
	frequency: z.enum(["daily", "weekly", "monthly"]),
	status: z.enum(["new", "unread", "in-progress", "finished"]),
	percent: z.number().min(0).max(100).optional(),
	/** The issue's own cover, when the download has one. */
	cover: CoverSchema.optional(),
});
export type PeriodicalIssue = z.infer<typeof PeriodicalIssueSchema>;

export interface BookWithPositions {
	book: Book;
	/** Newest first; this device first when equal. */
	positions: ReadingPosition[];
	status: ReadStatus;
}

export interface AuthorPage {
	author: Author;
	books: BookWithPositions[];
	finishedCount: number;
}

export interface BookPage extends BookWithPositions {
	/** Plain-words details shown in the Details block. */
	details: { label: string; value: string }[];
}

export interface SyncState {
	state: "up-to-date" | "syncing" | "offline" | "attention";
	lastSync?: string;
	/** Why it needs attention: the Cloudflare Access sign-in has run out (spec 003). */
	reason?: "sign-in";
}
