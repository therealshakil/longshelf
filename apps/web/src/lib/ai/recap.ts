import { RecapSchema, type Recap } from '@ribbon/shared/ai';

/** What the Story so far sheet shows: a recap state, or loading while one is written. */
export type RecapView = Recap | { state: 'loading' };

const UNAVAILABLE: Record<string, string> = {
	offline:
		'Couldn’t write a recap right now. You’re offline, and recaps need a connection. It will be ready next time you open this book online.',
	ai_paused:
		'Couldn’t write a recap right now. Ribbon has reached today’s AI limit, and it starts again tomorrow.',
	ai_off: 'AI features are switched off. You can switch them on in AI settings.'
};

/** Fetch the recap up to the owner's furthest place. Never throws. */
export async function fetchRecap(
	bookId: string,
	place: { percent: number; label: string; ordinal?: number },
	f: typeof fetch = fetch
): Promise<Recap> {
	const qs = new URLSearchParams({ percent: String(place.percent), label: place.label });
	if (place.ordinal !== undefined) qs.set('ordinal', String(place.ordinal));
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
