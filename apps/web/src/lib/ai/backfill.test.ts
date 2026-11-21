import { describe, expect, it } from 'vitest';
import { placeOrdinal } from '#lib/reader/chapters.ts';
import { fillMissing } from './backfill.ts';

const words = (n: number) => Array(n).fill('word').join(' ');
const chapter = async (i: number) => ({
	href: `c${i}`,
	label: `Chapter ${i}`,
	text: words(1000)
});

/** A fake API: `have` are stored ordinals; `refuseAfter` POSTs succeed, then a 503. */
function api(have: number[], refuseAfter = Infinity, reason = 'ai_paused') {
	const sent: number[] = [];
	const f = (async (_url: string, init?: RequestInit) => {
		if (!init?.method) return new Response(JSON.stringify({ ordinals: have }));
		if (sent.length >= refuseAfter)
			return new Response(JSON.stringify({ message: JSON.stringify({ reason }) }), { status: 503 });
		sent.push((JSON.parse(init.body as string) as { ordinal: number }).ordinal);
		return new Response('{"ok":true}');
	}) as typeof fetch;
	return { f, sent };
}

describe('fillMissing', () => {
	it('sends only missing chapters, and none at or past the cut-off', async () => {
		const { f, sent } = api([1, 3]);
		const out = await fillMissing({ bookId: 'b', upto: 5, chapter, f });
		expect(out.status).toBe('done');
		expect(sent.sort()).toEqual([0, 2, 4]);
		expect(out).toMatchObject({ fromOrdinal: 0, earlier: { chapters: 0 } });
	});
	it('sends the newest whole chapters within the word limit and reports the rest', async () => {
		const { f, sent } = api([]);
		const out = await fillMissing({ bookId: 'b', upto: 10, wordLimit: 3500, chapter, f });
		expect(sent.sort()).toEqual([7, 8, 9]);
		expect(out.fromOrdinal).toBe(7);
		expect(out.earlier.chapters).toBe(7);
	});
	it('counts already summarised chapters towards the window', async () => {
		const { f, sent } = api([9, 8]);
		await fillMissing({ bookId: 'b', upto: 10, wordLimit: 3500, chapter, f });
		expect(sent).toEqual([7]);
	});
	it('always includes the newest chapter, even if it is over the limit', async () => {
		const { f, sent } = api([]);
		await fillMissing({ bookId: 'b', upto: 3, wordLimit: 10, chapter, f });
		expect(sent).toEqual([2]);
	});
	it('includes the whole book when asked', async () => {
		const { f, sent } = api([]);
		const out = await fillMissing({ bookId: 'b', upto: 6, wordLimit: Infinity, chapter, f });
		expect(sent.length).toBe(6);
		expect(out.earlier.chapters).toBe(0);
	});
	it('skips sections too short to summarise', async () => {
		const { f, sent } = api([]);
		const short = async (i: number) => ({
			...(await chapter(i)),
			text: i === 1 ? 'Epigraph' : words(1000)
		});
		const out = await fillMissing({ bookId: 'b', upto: 3, chapter: short, f });
		expect(sent.sort()).toEqual([0, 2]);
		expect(out.fromOrdinal).toBe(0);
	});
	it('stops at a limit and reports what is still uncovered', async () => {
		const { f, sent } = api([], 2, 'on_demand_paused');
		const out = await fillMissing({ bookId: 'b', upto: 20, chapter, f });
		expect(out.status).toBe('on_demand_paused');
		expect(sent.length).toBe(2);
		expect(out.earlier.chapters).toBe(18);
	});
	it('sends nothing once aborted', async () => {
		const { f, sent } = api([]);
		const c = new AbortController();
		c.abort();
		const out = await fillMissing({ bookId: 'b', upto: 5, chapter, f, signal: c.signal });
		expect(out.status).toBe('aborted');
		expect(sent).toEqual([]);
	});
});

describe('placeOrdinal', () => {
	const chapters = [
		{ href: 'a.xhtml', label: 'One' },
		{ href: 'b.xhtml#x', label: 'Two' },
		{ href: 'b.xhtml#y', label: 'Three' },
		{ href: 'c.xhtml', label: 'Four' }
	];
	const sections: Record<string, number> = { a: 0, b: 1, c: 2 };
	const sectionOf = (h: string) => sections[h[0]];

	it('matches an exact entry', () => {
		expect(placeOrdinal(chapters, { href: 'b.xhtml#y', label: '' }, sectionOf)).toBe(2);
	});
	it('takes the first entry of a section, so it never runs past the place', () => {
		expect(placeOrdinal(chapters, { href: 'b.xhtml', label: '' }, sectionOf)).toBe(1);
	});
	it('gives up rather than guess', () => {
		const none = () => undefined;
		expect(placeOrdinal(chapters, { href: 'zz', label: 'Nope' }, none)).toBeUndefined();
	});
});
