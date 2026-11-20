import { json } from '@sveltejs/kit';
import type { Recap } from '@ribbon/shared/ai';
import { aiEnv } from '#lib/server/ai/env.ts';
import { beforeCutoff, writeRecap, type StoredSummary } from '#lib/server/ai/story.ts';
import type { RequestHandler } from './$types';

// Approved copy (design-mocks/index.html#recap).
const NOTE =
	'Written by AI from the book’s text up to your place, so it won’t spoil what comes next. It can get details wrong.';

/**
 * Story so far up to the reader's furthest place. Summaries exist only for chapters the owner
 * finished, so without `ordinal` every stored summary is already behind them. With `ordinal`
 * (the chapter they're in, from the reader) the recap stops before it.
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
				'No recap yet. Recaps are written from the chapters you finish reading in Ribbon, so one will be ready after your next chapter.'
		} satisfies Recap);

	const uptoHref = `ordinal:${used.at(-1)!.ordinal}`;
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
	return json({
		state: 'ready',
		upto: { label, percent: Math.round(percent) },
		paragraphs,
		note: NOTE
	} satisfies Recap);
};
