import { z } from 'zod';

/** A published source, or an explicit ASSUMPTION (AI-Team constitution VIII). */
export const SourceSchema = z.union([
	z.object({
		title: z.string().min(1),
		publisher: z.string().optional(),
		url: z.url().optional(),
		/** ISO date the source was last checked. */
		checked: z.iso.date()
	}),
	z.object({ assumption: z.literal(true), note: z.string().min(1) })
]);
export type Source = z.infer<typeof SourceSchema>;

export const PRINCIPLES = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const;
export type Principle = (typeof PRINCIPLES)[number];

/** calm-ds principle names, v0.1.0. */
export const PRINCIPLE_NAMES: Record<Principle, string> = {
	I: 'Quiet senses',
	II: 'Predictable',
	III: 'One thing at a time',
	IV: 'Remember for me',
	V: 'No pressure',
	VI: 'Plain words',
	VII: 'The person holds the dial'
};

export const CheckResultSchema = z.object({
	principle: z.enum(PRINCIPLES),
	result: z.enum(['pass', 'n/a', 'deferred']),
	reason: z.string().min(1)
});
export type CheckResult = z.infer<typeof CheckResultSchema>;

export const CatalogueMetaSchema = z
	.object({
		id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
		title: z.string().min(1),
		kind: z.enum(['token', 'component', 'guide']),
		order: z.number().int(),
		rationale: z.string().min(1),
		sources: z.array(SourceSchema).min(1),
		checks: z.array(CheckResultSchema).length(7)
	})
	.refine((m) => PRINCIPLES.every((p) => m.checks.some((c) => c.principle === p)), {
		message: 'checks must cover each calm-ds principle I–VII exactly once'
	});
export type CatalogueMeta = z.infer<typeof CatalogueMetaSchema>;

export const isAssumption = (s: Source): s is Extract<Source, { assumption: true }> =>
	'assumption' in s;
