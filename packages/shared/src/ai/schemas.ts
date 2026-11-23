import { z } from 'zod';

/** Request and response shapes for /api/ai/* (specs/002-redesign-and-ai/contracts/ai-api.md). */

export const AiUnavailableSchema = z.object({
	reason: z.enum(['ai_paused', 'on_demand_paused', 'ai_off', 'offline'])
});
export type AiUnavailable = z.infer<typeof AiUnavailableSchema>;

export const UsageSchema = z.object({
	today: z.object({
		neuronsEst: z.number().min(0),
		calls: z.number().int().min(0),
		ceiling: z.number().min(0)
	}),
	enabled: z.boolean()
});
export type Usage = z.infer<typeof UsageSchema>;

export const SetEnabledSchema = z.object({ enabled: z.boolean() });

export const ChapterSummaryRequestSchema = z.object({
	bookId: z.string().min(1),
	href: z.string().min(1),
	chapterLabel: z.string(),
	ordinal: z.number().int().min(0),
	/** The chapter's text: used once to write the summary, never stored. */
	text: z.string().min(1).max(200_000),
	/** Sent for a recap rather than on finishing a chapter: counts towards the daily cap. */
	onDemand: z.boolean().optional()
});

export const RecapSchema = z.discriminatedUnion('state', [
	z.object({
		state: z.literal('ready'),
		upto: z.object({ label: z.string(), percent: z.number().min(0).max(100) }),
		paragraphs: z.array(z.string()).min(1),
		note: z.string(),
		/** Estimated cost of adding the earlier chapters (DR-0004). */
		earlier: z.object({ percent: z.number().min(0), days: z.number().int().min(1) }).optional(),
		/** Set when the recap doesn't cover the whole book so far. */
		coverage: z
			.object({
				fromLabel: z.string(),
				toLabel: z.string(),
				limited: z.boolean()
			})
			.optional()
	}),
	z.object({
		state: z.enum(['writing', 'too_early', 'unavailable']),
		reason: z.string()
	})
]);
export type Recap = z.infer<typeof RecapSchema>;

export const SuggestionsSchema = z.object({
	items: z.array(z.object({ bookId: z.string().min(1), reason: z.string().min(1) }))
});
export type Suggestions = z.infer<typeof SuggestionsSchema>;

export const DismissSchema = z.object({
	bookId: z.string().min(1),
	kind: z.enum(['not_now', 'never'])
});
export const UndoDismissSchema = z.object({ bookId: z.string().min(1) });

export const GenreStateSchema = z.enum(['suggested', 'promoted', 'in_calibre', 'removed']);
export const BookGenresSchema = z.object({
	genres: z.array(z.object({ name: z.string().min(1), state: GenreStateSchema }))
});
export const GenreActionSchema = z.object({
	name: z.string().min(1),
	action: z.enum(['promote', 'remove'])
});

export const SearchSchema = z.object({
	mode: z.enum(['exact', 'meaning']),
	items: z.array(z.object({ bookId: z.string().min(1), reason: z.string().min(1) })),
	note: z.string().optional()
});
export type Search = z.infer<typeof SearchSchema>;

export const GenreJobSchema = z.object({
	bookIds: z.array(z.string().min(1)).optional()
});

export const GenreJobResultSchema = z.object({
	/** Books this run was asked to cover. */
	total: z.number().int().nonnegative(),
	checked: z.number().int().nonnegative(),
	/** New genre suggestions saved. */
	added: z.number().int().nonnegative(),
	/** Books still to check: run the job again to continue. */
	remaining: z.number().int().nonnegative(),
	stopped: z.enum(['ai_paused', 'ai_off', 'offline']).optional()
});
export type GenreJobResult = z.infer<typeof GenreJobResultSchema>;

/** What the genre model must return. Its text is untrusted until it passes this. */
export const GenreModelOutputSchema = z.object({
	books: z.array(z.object({ n: z.number().int().positive(), genres: z.array(z.string()) }))
});

export const EmbeddingJobResultSchema = z.object({
	total: z.number().int().nonnegative(),
	embedded: z.number().int().nonnegative(),
	unchanged: z.number().int().nonnegative(),
	removed: z.number().int().nonnegative(),
	/** Books still to embed: run the job again to continue. */
	remaining: z.number().int().nonnegative(),
	/** Why it stopped early, after keeping the batches it finished. */
	stopped: z.enum(['ai_paused', 'ai_off', 'offline']).optional()
});
export type EmbeddingJobResult = z.infer<typeof EmbeddingJobResultSchema>;
