import { describe, expect, it } from 'vitest';
import { bookSortKey, statusFrom, statusLabel, titleSortKey } from './status.ts';
import type { ReadingPosition } from './types.ts';

const pos = (percent: number, furthestPercent = percent): ReadingPosition => ({
	bookId: 'b',
	source: 'this-device',
	percent,
	chapterLabel: 'Chapter 1',
	href: 'c1',
	fraction: 0,
	readAt: '2026-11-18T10:00:00Z',
	furthestHref: 'c1',
	furthestPercent
});

describe('read status (FR-005)', () => {
	it('unread shows no label', () => {
		expect(statusLabel(statusFrom([]))).toBeNull();
		expect(statusLabel(statusFrom([pos(0)]))).toBeNull();
	});
	it('in progress shows "N% read" from the furthest source', () => {
		expect(statusLabel(statusFrom([pos(38), pos(41)]))).toBe('41% read');
	});
	it('finished shows "Finished"', () => {
		expect(statusLabel(statusFrom([pos(100)]))).toBe('Finished');
		expect(statusLabel(statusFrom([pos(20)], true))).toBe('Finished');
	});
});

describe('title sort', () => {
	it('ignores The, A and An', () => {
		expect(titleSortKey('The Divine Comedy')).toBe('divine comedy');
		expect(titleSortKey('A Tale of Two Cities')).toBe('tale of two cities');
		expect(titleSortKey('Anna Karenina')).toBe('anna karenina');
	});
});

describe('bookSortKey', () => {
	it("uses Calibre's title sort when present", () => {
		expect(bookSortKey({ title: 'A Tale of Two Cities', sort: 'Tale of Two Cities, A' })).toBe(
			'tale of two cities, a'
		);
	});
	it('falls back to the The/A/An rule', () => {
		expect(bookSortKey({ title: 'The Divine Comedy' })).toBe('divine comedy');
	});
});
