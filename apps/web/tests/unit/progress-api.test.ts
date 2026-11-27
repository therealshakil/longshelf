import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Place } from '@longshelf/shared/progress';
import { getProgress, putProgress } from '../../src/lib/server/mirror/progress.ts';
import { guarded } from '../../src/lib/server/mirror/http.ts';
import { allowed } from '../../src/lib/server/mirror/gate.ts';
import { mirrorEnv } from './mirror-env.ts';

let env: Awaited<ReturnType<typeof mirrorEnv>>;
let db: D1Database;
beforeAll(async () => {
	env = await mirrorEnv();
	db = env.store.db;
}, 60_000);
afterAll(() => env?.dispose());
beforeEach(() => env.reset());

const NOW = Date.UTC(2026, 10, 25, 18, 30);
const at = (min: number) => new Date(Date.UTC(2026, 10, 25, 18, min)).toISOString();
const place = (min: number, extra: Partial<Place> = {}): Place => ({
	bookId: 'book-1',
	deviceId: 'phone',
	deviceName: 'Android phone',
	percent: 40,
	chapterLabel: 'Chapter 12',
	href: 'ch12.xhtml',
	fraction: 0,
	cfi: `epubcfi(/6/${min})`,
	furthestPercent: 40,
	furthestHref: 'ch12.xhtml',
	readAt: at(min),
	...extra
});

const put = (body: unknown) =>
	guarded(() =>
		putProgress(
			db,
			new Request('http://localhost/api/progress', { method: 'PUT', body: JSON.stringify(body) }),
			NOW
		)
	);
const get = (headers: Record<string, string> = {}) =>
	getProgress(db, new Request('http://localhost/api/progress', { headers }));
const stored = async () => ((await (await get()).json()) as { places: Place[] }).places;

describe('PUT and GET /api/progress', () => {
	it('round-trips a place', async () => {
		const res = await put({ places: [place(1)] });
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({
			accepted: [{ bookId: 'book-1', deviceId: 'phone', readAt: at(1) }],
			stale: []
		});
		expect(await stored()).toEqual([place(1)]);
	});

	it('keeps the newer place when an older one arrives (FR-011)', async () => {
		await put({ places: [place(10, { percent: 50, furthestPercent: 50 })] });
		const res = await put({ places: [place(5)] });
		expect(await res.json()).toEqual({
			accepted: [],
			stale: [{ bookId: 'book-1', deviceId: 'phone', readAt: at(5) }]
		});
		const [row] = await stored();
		expect(row.percent).toBe(50);
		expect(row.readAt).toBe(at(10));
	});

	it('clamps a readAt more than 5 minutes ahead to server time (R5)', async () => {
		const res = await put({ places: [place(45)] });
		const now = new Date(NOW).toISOString();
		expect(((await res.json()) as { accepted: { readAt: string }[] }).accepted[0].readAt).toBe(now);
		expect((await stored())[0].readAt).toBe(now);
		// Within 5 minutes is left alone.
		await env.reset();
		await put({ places: [place(34)] });
		expect((await stored())[0].readAt).toBe(at(34));
	});

	it('refuses 101 places or a bad field with 400, writing nothing', async () => {
		const many = Array.from({ length: 101 }, (_, i) => place(1, { bookId: `b${i}` }));
		expect((await put({ places: many })).status).toBe(400);
		const bad = await put({ places: [place(1, { bookId: 'ok' }), place(2, { percent: 140 })] });
		expect(bad.status).toBe(400);
		expect(((await bad.json()) as { error: string }).error).toMatch(/not valid/);
		expect(await stored()).toEqual([]);
	});

	it('is owner-only: no identity or the service token is refused (FR-012)', () => {
		expect(allowed('/api/progress', null, false)).toBe(false);
		expect(allowed('/api/progress', { kind: 'cli' }, false)).toBe(false);
		expect(allowed('/api/progress', { kind: 'owner', email: 'o@example.com' }, false)).toBe(true);
	});

	it('answers If-None-Match with 304, and a new place changes the ETag', async () => {
		await put({ places: [place(1)] });
		const first = await get();
		const etag = first.headers.get('etag')!;
		expect(etag).toMatch(/^W\//);
		expect((await get({ 'if-none-match': etag })).status).toBe(304);
		await put({ places: [place(2, { deviceId: 'laptop', deviceName: 'Linux PC' })] });
		expect((await get({ 'if-none-match': etag })).status).toBe(200);
	});

	it('marks every answer noindex', async () => {
		const ok = await put({ places: [place(1)] });
		const listed = await get();
		const notModified = await get({ 'if-none-match': listed.headers.get('etag')! });
		for (const r of [ok, listed, notModified])
			expect(r.headers.get('x-robots-tag')).toBe('noindex, nofollow');
	});
});
