/**
 * Story so far (spec 002 US4, research R5): one short summary per chapter the owner has passed,
 * and recaps built only from those, so a recap can't run past the owner's place.
 */
import { MODELS } from './models.ts';
import { runText } from './run.ts';
import type { GuardStore } from './guard.ts';

const MAX_CHAPTER_CHARS = 48_000; // about 12k tokens; longer sections are trimmed at the end
/** Below this a section is a heading, epigraph or blank page: nothing worth summarising. */
export const MIN_CHAPTER_CHARS = 400;

/**
 * Small models sometimes answer the instructions instead of the text ("Please provide the
 * text…"). Such replies must never be stored as a summary (seen 2026-11-20 on gemma-4-26b).
 */
export function looksLikeSummary(text: string): boolean {
	const t = text.trim();
	if (t.length < 40) return false;
	return (
		!/^(please|i('m| am) sorry|i can(no|')t|sure[,!]|could you|as an ai)/i.test(t) &&
		!/provide the (text|chapter)/i.test(t)
	);
}

export const SUMMARY_SYSTEM = `You summarise one chapter of a book for the person reading it, so they can remember it later.
Write at most 200 words in plain English, in the past tense; a short chapter gets a short summary.
Say what happens and who is involved, using only this chapter's text.
Do not guess what happens later, judge the writing, or add anything not in the text.
Reply with the summary only.`;

export const RECAP_SYSTEM = `You write a "story so far" for a reader returning to a book after a break.
You are given short summaries of the chapters they have already read, in order.
Write 3 to 5 short paragraphs in plain English that remind them who is who and what has happened.
Use only what the summaries say. Never predict, hint at or foreshadow anything after the last summary.
Reply with the paragraphs only, separated by blank lines.`;

export async function summariseChapter(
	ai: Ai | null,
	store: GuardStore,
	label: string,
	text: string
): Promise<{ summary: string; model: string } | null> {
	if (text.trim().length < MIN_CHAPTER_CHARS) return null;
	const body = text.length > MAX_CHAPTER_CHARS ? text.slice(0, MAX_CHAPTER_CHARS) : text;
	const summary = await runText(
		ai,
		store,
		MODELS.text,
		[
			{ role: 'system', content: SUMMARY_SYSTEM },
			{ role: 'user', content: `Chapter: ${label}\n\n${body}` }
		],
		400
	);
	return looksLikeSummary(summary) ? { summary, model: MODELS.text } : null;
}

export interface StoredSummary {
	ordinal: number;
	chapter_label: string;
	summary: string;
}

/** Only summaries strictly before the owner's current chapter are used (FR-011). */
export const beforeCutoff = (rows: StoredSummary[], currentOrdinal: number) =>
	rows.filter((r) => r.ordinal < currentOrdinal).sort((a, b) => a.ordinal - b.ordinal);

export async function writeRecap(
	ai: Ai | null,
	store: GuardStore,
	summaries: StoredSummary[]
): Promise<{ paragraphs: string[]; model: string }> {
	const input = summaries.map((s, i) => `${i + 1}. ${s.chapter_label}\n${s.summary}`).join('\n\n');
	const text = await runText(
		ai,
		store,
		MODELS.text,
		[
			{ role: 'system', content: RECAP_SYSTEM },
			{ role: 'user', content: input }
		],
		700
	);
	if (!looksLikeSummary(text)) return { paragraphs: [], model: MODELS.text };
	const paragraphs = text
		.split(/\n\s*\n/)
		.map((p) => p.trim())
		.filter(Boolean);
	return { paragraphs, model: MODELS.text };
}
