/**
 * On-demand summaries (DR-0004): before a recap, summarise chapters Ribbon has no summary for,
 * such as those read on a Kobo. It works back from the owner's place through a window of recent
 * text, always sending whole chapters. Text goes from the browser because the server doesn't
 * hold book files; it is used once and not stored.
 */
const MIN_CHARS = 400; // the server's MIN_CHAPTER_CHARS: shorter sections are never summarised
const MAX_CHARS = 200_000;
const PARALLEL = 3;
export const RECENT_WORDS = 40_000;

export type StopReason = 'ai_off' | 'ai_paused' | 'on_demand_paused' | 'offline';
export type FillStatus = 'done' | 'aborted' | StopReason;

export interface FillResult {
	status: FillStatus;
	/** The first chapter of the unbroken covered run that ends just before the owner's place. */
	fromOrdinal: number;
	/** Earlier chapters still without a summary, and their length. */
	earlier: { chapters: number; chars: number };
}

export interface FillOptions {
	bookId: string;
	/** Chapters 0 to upto - 1 are behind the owner's place. */
	upto: number;
	/** How far back to summarise. Infinity includes the whole book so far. */
	wordLimit?: number;
	chapter(ordinal: number): Promise<{ href: string; label: string; text: string }>;
	onProgress?(done: number, total: number): void;
	signal?: AbortSignal;
	f?: typeof fetch;
}

async function stopReason(r: Response): Promise<StopReason> {
	const body = (await r.json().catch(() => null)) as { message?: string } | null;
	const reason = /"reason":"(\w+)"/.exec(body?.message ?? '')?.[1];
	return reason === 'ai_off' || reason === 'ai_paused' || reason === 'on_demand_paused'
		? reason
		: 'offline';
}

const wordCount = (text: string) => (text ? text.split(' ').length : 0);

/** Fill the gaps newest first, keeping every summary made. Stops at a refusal; never throws. */
export async function fillMissing(o: FillOptions): Promise<FillResult> {
	const f = o.f ?? fetch;
	const limit = o.wordLimit ?? RECENT_WORDS;
	const id = encodeURIComponent(o.bookId);
	const none = (status: FillStatus): FillResult => ({
		status,
		fromOrdinal: o.upto,
		earlier: { chapters: 0, chars: 0 }
	});

	let have: Set<number>;
	try {
		const r = await f(`/api/ai/chapter-summary/${id}`, { signal: o.signal });
		if (!r.ok) return none(await stopReason(r));
		have = new Set(((await r.json()) as { ordinals: number[] }).ordinals);
	} catch {
		return none(o.signal?.aborted ? 'aborted' : 'offline');
	}

	type Job = { ordinal: number; href: string; label: string; text: string };
	const todo: Job[] = [];
	const missing = new Map<number, number>(); // ordinal -> characters, for every uncovered chapter
	let words = 0;
	let inWindow = true;
	for (let i = o.upto - 1; i >= 0; i--) {
		if (o.signal?.aborted) return none('aborted');
		const c = await o.chapter(i).catch(() => null);
		const text = c?.text ?? '';
		const w = wordCount(text);
		if (inWindow && words > 0 && words + w > limit) inWindow = false;
		if (inWindow) words += w;
		if (!c || text.length < MIN_CHARS || have.has(i)) continue;
		missing.set(i, Math.min(text.length, MAX_CHARS));
		if (inWindow) todo.push({ ordinal: i, href: c.href, label: c.label, text });
	}

	const total = todo.length;
	let done = 0;
	let next = 0;
	let stopped: StopReason | null = null;
	if (total) o.onProgress?.(0, total);

	async function worker() {
		while (next < total && !stopped && !o.signal?.aborted) {
			const job = todo[next++];
			try {
				const r = await f('/api/ai/chapter-summary', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({
						bookId: o.bookId,
						href: job.href,
						chapterLabel: job.label,
						ordinal: job.ordinal,
						text: job.text.slice(0, MAX_CHARS),
						onDemand: true
					}),
					signal: o.signal
				});
				if (!r.ok && r.status !== 400) {
					stopped ??= await stopReason(r);
					return;
				}
				missing.delete(job.ordinal);
				o.onProgress?.(++done, total);
			} catch {
				if (!o.signal?.aborted) stopped ??= 'offline';
				return;
			}
		}
	}
	await Promise.all(Array.from({ length: Math.min(PARALLEL, total) }, worker));

	const newestGap = missing.size ? Math.max(...missing.keys()) : -1;
	let chars = 0;
	for (const n of missing.values()) chars += n;
	return {
		status: o.signal?.aborted ? 'aborted' : (stopped ?? 'done'),
		fromOrdinal: newestGap + 1,
		earlier: { chapters: missing.size, chars }
	};
}
