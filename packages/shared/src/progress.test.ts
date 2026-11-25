import { describe, expect, it } from 'vitest';
import {
	MAX_CLOCK_LEAD_MS,
	PlaceSchema,
	ProgressPutSchema,
	clampReadAt,
	type Place
} from './progress.ts';

const place: Place = {
	bookId: 'b1',
	deviceId: 'd1',
	deviceName: 'Android phone',
	percent: 40,
	chapterLabel: 'Chapter 12',
	href: 'ch12.xhtml',
	fraction: 0.3,
	furthestPercent: 40,
	furthestHref: 'ch12.xhtml',
	readAt: '2026-11-25T18:00:00.000Z'
};

describe('PlaceSchema', () => {
	it('accepts a valid place', () => {
		expect(PlaceSchema.safeParse(place).success).toBe(true);
	});
	it('rejects out-of-range percent and fraction', () => {
		expect(PlaceSchema.safeParse({ ...place, percent: 101 }).success).toBe(false);
		expect(PlaceSchema.safeParse({ ...place, fraction: -0.1 }).success).toBe(false);
	});
	it('needs furthestPercent ≥ percent', () => {
		expect(PlaceSchema.safeParse({ ...place, furthestPercent: 39 }).success).toBe(false);
	});
	it('rejects a malformed file hash', () => {
		expect(PlaceSchema.safeParse({ ...place, fileSha256: 'abc' }).success).toBe(false);
	});
});

describe('ProgressPutSchema', () => {
	it('takes 1 to 100 places', () => {
		expect(ProgressPutSchema.safeParse({ places: [] }).success).toBe(false);
		expect(ProgressPutSchema.safeParse({ places: [place] }).success).toBe(true);
		expect(ProgressPutSchema.safeParse({ places: Array(101).fill(place) }).success).toBe(false);
	});
});

describe('clampReadAt', () => {
	const now = Date.parse('2026-11-25T18:00:00.000Z');
	it('keeps a time within the allowed lead', () => {
		const t = new Date(now + MAX_CLOCK_LEAD_MS).toISOString();
		expect(clampReadAt(t, now)).toBe(t);
	});
	it('clamps a time too far ahead to now', () => {
		const t = new Date(now + MAX_CLOCK_LEAD_MS + 1).toISOString();
		expect(clampReadAt(t, now)).toBe(new Date(now).toISOString());
	});
});
