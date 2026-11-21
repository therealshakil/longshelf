import { RecapSchema, type Recap } from '@ribbon/shared/ai';
import { chapterText, type Chapter, type FoliateBook } from '#lib/reader/chapters.ts';
import { fillMissing, RECENT_WORDS } from './backfill.ts';

/**
 * What the Story so far sheet shows: a recap state, or loading while one is written. `progress`
 * is set while earlier chapters are being read.
 */
export type RecapView = Recap | { state: 'loading'; progress?: { done: number; total: number } };

const UNAVAILABLE: Record<string, string> = {
	offline:
		'Couldn’t write a recap right now. You’re offline, and recaps need a connection. It will be ready next time you open this book online.',
	ai_paused:
		'Couldn’t write a recap right now. Ribbon has reached today’s AI limit, and it starts again tomorrow.',
	on_demand_paused:
		'Couldn’t write a recap right now. Ribbon has reached today’s limit for catching up on chapters, and it starts again tomorrow.',
	ai_off: 'AI features are switched off. You can switch them on in AI settings.'
};
const PAUSED_PARTWAY =
	'This recap isn’t finished yet. Ribbon reached today’s AI limit while reading the earlier chapters. It keeps its place, so open Story so far tomorrow to finish.';

/**
 * Summarise recent chapters missing before the owner's place (or all of them with `all`), then
 * fetch the recap, marked with what it covers. Returns null if the owner closed the sheet first.
 */
export async function recapWithBackfill(
	bookId: string,
	place: { percent: number; label: string; ordinal?: number },
	opened: { book: FoliateBook; chapters: Chapter[] } | undefined,
	o: { signal: AbortSignal; all?: boolean; onProgress(done: number, total: number): void }
): Promise<Recap | null> {
	const upto = place.ordinal;
	if (!opened || upto === undefined || upto < 1 || place.percent < 5) {
		return o.signal.aborted ? null : fetchRecap(bookId, place);
	}
	const { book, chapters } = opened;
	const docs = new Map<number, Promise<Document>>();
	const fill = await fillMissing({
		bookId,
		upto,
		wordLimit: o.all ? Infinity : RECENT_WORDS,
		chapter: async (i) => ({
			href: chapters[i].href,
			label: chapters[i].label,
			text: await chapterText(book, chapters, i, docs)
		}),
		onProgress: o.onProgress,
		signal: o.signal
	});
	if (fill.status === 'aborted' || o.signal.aborted) return null;
	if (fill.status === 'ai_off' || fill.status === 'offline')
		return { state: 'unavailable', reason: UNAVAILABLE[fill.status] };

	const limited = fill.status === 'ai_paused' || fill.status === 'on_demand_paused';
	const recap = await fetchRecap(bookId, { ...place, earlier: fill.earlier });
	if (o.signal.aborted) return null;
	if (recap.state !== 'ready')
		return limited ? { state: 'unavailable', reason: PAUSED_PARTWAY } : recap;
	if (!fill.earlier.chapters) return recap;
	const from = Math.min(fill.fromOrdinal, upto - 1);
	return {
		...recap,
		coverage: { fromLabel: chapters[from].label, toLabel: chapters[upto - 1].label, limited }
	};
}

/** Fetch the recap up to the owner's furthest place. Never throws. */
export async function fetchRecap(
	bookId: string,
	place: {
		percent: number;
		label: string;
		ordinal?: number;
		earlier?: { chapters: number; chars: number };
	},
	f: typeof fetch = fetch
): Promise<Recap> {
	const qs = new URLSearchParams({ percent: String(place.percent), label: place.label });
	if (place.ordinal !== undefined) qs.set('ordinal', String(place.ordinal));
	if (place.earlier?.chapters) {
		qs.set('earlierChapters', String(place.earlier.chapters));
		qs.set('earlierChars', String(place.earlier.chars));
	}
	try {
		const r = await f(`/api/ai/recap/${encodeURIComponent(bookId)}?${qs}`);
		const body = (await r.json().catch(() => null)) as { message?: string } | null;
		if (!r.ok) {
			const reason = /"reason":"(\w+)"/.exec(body?.message ?? '')?.[1] ?? 'offline';
			return { state: 'unavailable', reason: UNAVAILABLE[reason] ?? UNAVAILABLE.offline };
		}
		const parsed = RecapSchema.safeParse(body);
		return parsed.success ? parsed.data : { state: 'unavailable', reason: UNAVAILABLE.offline };
	} catch {
		return { state: 'unavailable', reason: UNAVAILABLE.offline };
	}
}

/** Bold the first sentence of a message, as the approved mock does. */
export function splitLead(text: string): [string, string] {
	const i = text.indexOf('. ');
	return i < 0 ? [text, ''] : [text.slice(0, i + 1), text.slice(i + 2)];
}
