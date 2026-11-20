import { describe, expect, it } from 'vitest';
import { fetchRecap, splitLead } from './recap.ts';

const reply = (status: number, body: unknown) =>
	(async () => new Response(JSON.stringify(body), { status })) as typeof fetch;
const place = { percent: 12, label: 'Chapter 3' };

describe('fetchRecap', () => {
	it('passes a ready recap through', async () => {
		const ready = {
			state: 'ready',
			upto: { label: 'Chapter 3', percent: 12 },
			paragraphs: ['One.'],
			note: 'AI.'
		};
		expect(await fetchRecap('b', place, reply(200, ready))).toEqual(ready);
	});
	it('says why when AI is paused, off or unreachable', async () => {
		const paused = await fetchRecap('b', place, reply(503, { message: '{"reason":"ai_paused"}' }));
		expect(paused.state === 'unavailable' && paused.reason).toMatch(/today’s AI limit/);
		const off = await fetchRecap('b', place, reply(503, { message: '{"reason":"ai_off"}' }));
		expect(off.state === 'unavailable' && off.reason).toMatch(/switched off/);
		const down = await fetchRecap('b', place, (async () => {
			throw new TypeError('offline');
		}) as typeof fetch);
		expect(down.state === 'unavailable' && down.reason).toMatch(/offline/);
	});
	it('treats a malformed reply as unavailable, never as a recap', async () => {
		const bad = await fetchRecap('b', place, reply(200, { state: 'ready', paragraphs: [] }));
		expect(bad.state).toBe('unavailable');
	});
});

describe('splitLead', () => {
	it('splits off the first sentence', () => {
		expect(splitLead('Not much yet. Try later.')).toEqual(['Not much yet.', 'Try later.']);
		expect(splitLead('One sentence')).toEqual(['One sentence', '']);
	});
});
