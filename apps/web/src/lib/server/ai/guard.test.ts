import { describe, expect, it } from 'vitest';
import { check, record, DEFAULT_CEILING, type GuardStore } from './guard.ts';

function memoryStore(): GuardStore {
	const usage = new Map<string, { neuronsEst: number; calls: number }>();
	const settings = new Map<string, string>();
	return {
		async usage(day) {
			return usage.get(day) ?? { neuronsEst: 0, calls: 0 };
		},
		async add(day, n) {
			const u = usage.get(day) ?? { neuronsEst: 0, calls: 0 };
			usage.set(day, { neuronsEst: u.neuronsEst + n, calls: u.calls + 1 });
		},
		async setting(k) {
			return settings.get(k) ?? null;
		},
		async setSetting(k, v) {
			settings.set(k, v);
		}
	};
}

const day1 = new Date('2026-11-20T10:00:00Z');
const day2 = new Date('2026-11-21T00:00:01Z');

describe('spend guard (FR-016, FR-017)', () => {
	it('allows calls under the ceiling and pauses at it', async () => {
		const s = memoryStore();
		expect(await check(s, 100, day1)).toEqual({ ok: true });
		await record(s, DEFAULT_CEILING - 50, day1);
		expect(await check(s, 100, day1)).toEqual({ ok: false, reason: 'ai_paused' });
	});
	it('starts afresh the next UTC day', async () => {
		const s = memoryStore();
		await record(s, DEFAULT_CEILING, day1);
		expect(await check(s, 100, day2)).toEqual({ ok: true });
	});
	it('refuses everything while AI is switched off', async () => {
		const s = memoryStore();
		await s.setSetting('enabled', 'false');
		expect(await check(s, 1, day1)).toEqual({ ok: false, reason: 'ai_off' });
	});
	it('honours a lower configured ceiling', async () => {
		const s = memoryStore();
		await s.setSetting('ceiling', '500');
		await record(s, 450, day1);
		expect(await check(s, 100, day1)).toEqual({ ok: false, reason: 'ai_paused' });
	});
});
