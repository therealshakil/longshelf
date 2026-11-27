import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProgressPut } from '@longshelf/shared/progress';
import { DEBOUNCE_MS, flush, pendingPlaces, queueSend, toWire } from '#lib/reader/outbox.ts';
import { loadPlace, savePlace, type SavedPlace } from '#lib/reader/settings.ts';
import { DEVICE_KEY, resetDeviceMemory } from '#lib/offline/device.ts';
import { memoryStorage } from './memory-storage.ts';

const at = (min: number) => new Date(Date.UTC(2026, 10, 25, 18, min)).toISOString();
const place = (min: number, syncedMin: number | null = null): SavedPlace => ({
	cfi: `epubcfi(/6/${min})`,
	fraction: 0.4,
	chapterLabel: 'Chapter 12',
	savedAt: at(min),
	href: 'ch12.xhtml',
	percent: 40,
	furthestPercent: 40,
	furthestHref: 'ch12.xhtml',
	readAt: at(min),
	syncedAt: syncedMin === null ? null : at(syncedMin)
});

/** A fake mirror: answers every PUT with each place accepted (or as `answer` says). */
function mirror(answer?: (body: ProgressPut) => Response | Promise<Response>) {
	const bodies: ProgressPut[] = [];
	const f = vi.fn(async (_url: string, init: RequestInit) => {
		const body = JSON.parse(String(init.body)) as ProgressPut;
		bodies.push(body);
		if (answer) return answer(body);
		const keys = body.places.map(({ bookId, deviceId, readAt }) => ({ bookId, deviceId, readAt }));
		return new Response(JSON.stringify({ accepted: keys, stale: [] }));
	});
	return { f: f as unknown as typeof fetch, bodies, calls: f };
}

beforeEach(() => {
	vi.stubGlobal('localStorage', memoryStorage());
	resetDeviceMemory();
	localStorage.setItem(DEVICE_KEY, JSON.stringify({ id: 'laptop', name: 'Linux PC' }));
});
afterEach(() => {
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

describe('pendingPlaces', () => {
	it('is every place never synced or read since it synced', () => {
		savePlace('never', place(1));
		savePlace('moved', place(5, 2));
		savePlace('synced', place(3, 3));
		expect(
			pendingPlaces()
				.map((p) => p.bookId)
				.sort()
		).toEqual(['moved', 'never']);
	});

	it('sends the device, fraction 0, and the place', () => {
		expect(toWire('b', place(1), { id: 'laptop', name: 'Linux PC' })).toMatchObject({
			bookId: 'b',
			deviceId: 'laptop',
			deviceName: 'Linux PC',
			fraction: 0,
			percent: 40,
			readAt: at(1)
		});
	});
});

describe('flush', () => {
	it('marks sent places synced after a 200', async () => {
		savePlace('b', place(1));
		const m = mirror();
		expect(await flush({ fetch: m.f })).toBe('sent');
		expect(loadPlace('b')!.syncedAt).toBe(at(1));
		expect(pendingPlaces()).toEqual([]);
		expect(await flush({ fetch: m.f })).toBe('nothing');
		expect(m.calls).toHaveBeenCalledTimes(1);
	});

	it('leaves a place pending if it moved while sending', async () => {
		savePlace('b', place(1));
		const m = mirror(async (body) => {
			savePlace('b', place(2)); // read on while the request was out
			const k = body.places[0];
			return new Response(
				JSON.stringify({
					accepted: [{ bookId: k.bookId, deviceId: k.deviceId, readAt: k.readAt }],
					stale: []
				})
			);
		});
		await flush({ fetch: m.f });
		expect(loadPlace('b')).toMatchObject({ readAt: at(2), syncedAt: null });
	});

	it('counts stale as sent: the mirror holds a newer place', async () => {
		savePlace('b', place(1));
		const m = mirror(async (body) => {
			const k = body.places[0];
			return new Response(
				JSON.stringify({
					accepted: [],
					stale: [{ bookId: k.bookId, deviceId: k.deviceId, readAt: k.readAt }]
				})
			);
		});
		await flush({ fetch: m.f });
		expect(loadPlace('b')!.syncedAt).toBe(at(1));
	});

	it('keeps everything pending on 403 (sign-in) or no network (offline)', async () => {
		savePlace('b', place(1));
		expect(await flush({ fetch: mirror(() => new Response('', { status: 403 })).f })).toBe(
			'sign-in'
		);
		const offline = vi.fn(async () => {
			throw new TypeError('Failed to fetch');
		}) as unknown as typeof fetch;
		expect(await flush({ fetch: offline })).toBe('offline');
		expect(pendingPlaces()).toHaveLength(1);
	});

	it('sends at most once at a time', async () => {
		savePlace('b', place(1));
		let release!: () => void;
		const m = mirror(async (body) => {
			await new Promise<void>((r) => (release = r));
			const keys = body.places.map(({ bookId, deviceId, readAt }) => ({
				bookId,
				deviceId,
				readAt
			}));
			return new Response(JSON.stringify({ accepted: keys, stale: [] }));
		});
		const a = flush({ fetch: m.f });
		const b = flush({ fetch: m.f });
		expect(a).toBe(b);
		await vi.waitFor(() => expect(m.calls).toHaveBeenCalledTimes(1));
		release();
		await a;
		expect(m.calls).toHaveBeenCalledTimes(1);
	});

	it('splits more than 100 places into several requests', async () => {
		for (let i = 0; i < 101; i++) savePlace(`b${i}`, place(1));
		const m = mirror();
		await flush({ fetch: m.f });
		expect(m.bodies.map((b) => b.places.length)).toEqual([100, 1]);
		expect(pendingPlaces()).toEqual([]);
	});
});

describe('queueSend', () => {
	it('sends once, 10 s after the last change', async () => {
		vi.useFakeTimers();
		savePlace('b', place(1));
		const m = mirror();
		queueSend({ fetch: m.f });
		await vi.advanceTimersByTimeAsync(DEBOUNCE_MS - 1000);
		queueSend({ fetch: m.f });
		await vi.advanceTimersByTimeAsync(DEBOUNCE_MS - 1);
		expect(m.calls).not.toHaveBeenCalled();
		await vi.advanceTimersByTimeAsync(1);
		expect(m.calls).toHaveBeenCalledTimes(1);
	});
});
