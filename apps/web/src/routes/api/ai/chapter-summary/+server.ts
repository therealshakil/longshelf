import { error, json } from '@sveltejs/kit';
import { ChapterSummaryRequestSchema } from '@longshelf/shared/ai';
import { aiEnv } from '#lib/server/ai/env.ts';
import { releaseOnDemand, reserveOnDemand } from '#lib/server/ai/on-demand.ts';
import { MIN_CHAPTER_CHARS, summariseChapter, summaryNeurons } from '#lib/server/ai/story.ts';
import type { RequestHandler } from './$types';

/** Summarise one finished chapter. The text is used once and not stored; only the summary is. */
export const POST: RequestHandler = async ({ request }) => {
	const parsed = ChapterSummaryRequestSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) error(400, 'Send bookId, href, chapterLabel, ordinal and text.');
	const { bookId, href, chapterLabel, ordinal, text, onDemand } = parsed.data;
	const { db, ai, store } = aiEnv();
	const existing = await db
		.prepare('SELECT 1 FROM chapter_summary WHERE book_id = ? AND href = ?')
		.bind(bookId, href)
		.first();
	if (existing) return json({ ok: true, cached: true });
	const reserved =
		onDemand && text.trim().length >= MIN_CHAPTER_CHARS ? summaryNeurons(text.length) : 0;
	if (reserved) await reserveOnDemand(db, reserved);
	let out;
	try {
		out = await summariseChapter(ai, store, chapterLabel, text);
	} catch (e) {
		if (reserved) await releaseOnDemand(db, reserved);
		throw e;
	}
	// Too short to summarise, or the model didn't produce a summary: store nothing.
	if (!out) return json({ ok: true, skipped: true });
	const { summary, model } = out;
	await db
		.prepare(
			`INSERT OR REPLACE INTO chapter_summary (book_id, href, chapter_label, ordinal, summary, model, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(bookId, href, chapterLabel, ordinal, summary, model, new Date().toISOString())
		.run();
	return json({ ok: true });
};
