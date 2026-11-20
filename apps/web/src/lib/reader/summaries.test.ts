import { describe, expect, it } from 'vitest';
import { sendSummary, type SummaryJob } from './summaries.ts';

function memory() {
	const m = new Map<string, string>();
	return {
		getItem: (k: string) => m.get(k) ?? null,
		setItem: (k: string, v: string) => void m.set(k, v),
		m
	};
}
const job = (n: number): SummaryJob => ({
	bookId: 'b',
	href: `section:${n}`,
	chapterLabel: `C${n}`,
	ordinal: n,
	text: 'x'.repeat(500)
});
const respond = (status: number, message = '') =>
	(async () => new Response(JSON.stringify({ message }), { status })) as typeof fetch;
const queued = (s: ReturnType<typeof memory>) =>
	JSON.parse(s.getItem('ribbon.summary-queue.v1') ?? '[]');

describe('summary queue (T049)', () => {
	it('keeps a job when offline and sends it with the next one', async () => {
		const s = memory();
		await sendSummary(job(1), s, (async () => {
			throw new TypeError('offline');
		}) as typeof fetch);
		expect(queued(s)).toHaveLength(1);
		const sent: string[] = [];
		await sendSummary(job(2), s, (async (_u: RequestInfo | URL, init?: RequestInit) => {
			sent.push((JSON.parse(String(init?.body)) as SummaryJob).href);
			return new Response('{}', { status: 200 });
		}) as typeof fetch);
		expect(sent).toEqual(['section:1', 'section:2']);
		expect(queued(s)).toHaveLength(0);
	});
	it('drops jobs while AI is switched off, keeps them while paused', async () => {
		const s = memory();
		await sendSummary(job(1), s, respond(503, '{"reason":"ai_off"}'));
		expect(queued(s)).toHaveLength(0);
		await sendSummary(job(2), s, respond(503, '{"reason":"ai_paused"}'));
		expect(queued(s)).toHaveLength(1);
	});
	it('does not queue the same section twice', async () => {
		const s = memory();
		const off = respond(503, '{"reason":"offline"}');
		await sendSummary(job(1), s, off);
		await sendSummary(job(1), s, off);
		expect(queued(s)).toHaveLength(1);
	});
});
