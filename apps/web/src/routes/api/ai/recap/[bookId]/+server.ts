import { json } from '@sveltejs/kit';
import type { Recap } from '@ribbon/shared/ai';
import { aiEnv } from '#lib/server/ai/env.ts';
import { ceiling } from '#lib/server/ai/guard.ts';
import { estimateNeurons, MODELS } from '#lib/server/ai/models.ts';
import { ON_DEMAND_DAILY } from '#lib/server/ai/on-demand.ts';
import {
	beforeCutoff,
	summaryNeurons,
	writeRecap,
	type StoredSummary
} from '#lib/server/ai/story.ts';
import type { RequestHandler } from './$types';

// Approved copy (design-mocks/index.html#recap).
const NOTE =
	'Written by AI from the book’s text up to your place, so it won’t spoil what comes next. It can get details wrong.';

/**
 * Story so far up to the reader's place. The client first fills in summaries for earlier
 * chapters (DR-0004). With `ordinal` (the chapter they're in) the recap stops before it. Without
 * one the place couldn't be located, so no on-demand summaries were made and every stored
 * summary comes from a chapter the owner finished.
 */
export const GET: RequestHandler = async ({ params, url }) => {
	const raw = url.searchParams.get('ordinal');
	const ordinal = raw === null ? Infinity : Number(raw);
	const percent = Number(url.searchParams.get('percent'));
	const label = url.searchParams.get('label') ?? '';
	if (!Number.isFinite(percent) || percent < 5)
		return json({
			state: 'too_early',
			reason: 'Not much to recap yet. A recap starts making sense after about 5%.'
		} satisfies Recap);

	const { db, ai, store } = aiEnv();
	const { results } = await db
		.prepare('SELECT ordinal, chapter_label, summary FROM chapter_summary WHERE book_id = ?')
		.bind(params.bookId)
		.all<StoredSummary>();
	const used = beforeCutoff(results, ordinal);
	if (!used.length)
		return json({
			state: 'writing',
			reason:
				'No recap yet. Longshelf has no earlier chapters to work from, so one will be ready after your next chapter.'
		} satisfies Recap);

	// The count matters: filling an earlier gap must rebuild a recap with the same last chapter.
	const uptoHref = `ordinal:${used.at(-1)!.ordinal}:${used.length}`;
	const cached = await db
		.prepare('SELECT text FROM recap WHERE book_id = ? AND upto_href = ?')
		.bind(params.bookId, uptoHref)
		.first<{ text: string }>();
	let paragraphs: string[];
	if (cached) paragraphs = JSON.parse(cached.text) as string[];
	else {
		const out = await writeRecap(ai, store, used);
		if (!out.paragraphs.length)
			return json({
				state: 'unavailable',
				reason: 'The recap couldn’t be written just now. Try again later.'
			} satisfies Recap);
		paragraphs = out.paragraphs;
		await db
			.prepare(
				`INSERT OR REPLACE INTO recap (book_id, upto_href, upto_percent, text, model, created_at)
				 VALUES (?, ?, ?, ?, ?, ?)`
			)
			.bind(
				params.bookId,
				uptoHref,
				percent,
				JSON.stringify(paragraphs),
				out.model,
				new Date().toISOString()
			)
			.run();
	}
	// What adding the earlier chapters would cost, so the owner sees it before choosing (DR-0004).
	const earlierChapters = Number(url.searchParams.get('earlierChapters')) || 0;
	const earlierChars = Number(url.searchParams.get('earlierChars')) || 0;
	let earlier: { percent: number; days: number } | undefined;
	if (earlierChapters > 0 && earlierChars > 0) {
		const neurons =
			summaryNeurons(0) * earlierChapters +
			estimateNeurons(MODELS.text, Math.ceil(earlierChars / 4), 0);
		earlier = {
			percent: Math.max(1, Math.round((100 * neurons) / (await ceiling(store)))),
			days: Math.ceil(neurons / ON_DEMAND_DAILY)
		};
	}
	return json({
		state: 'ready',
		upto: { label, percent: Math.round(percent) },
		paragraphs,
		note: NOTE,
		earlier
	} satisfies Recap);
};
