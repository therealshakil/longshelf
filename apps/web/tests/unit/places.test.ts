import { describe, expect, it } from 'vitest';
import type { ReadingPosition } from '@longshelf/shared/library';
import type { Place } from '@longshelf/shared/progress';
import {
	adoptedPlace,
	chooseOpen,
	fileShaOf,
	mergePositions,
	offerKey,
	placeToOffer,
	startAt,
	THIS_DEVICE
} from '#lib/reader/places.ts';
import type { SavedPlace } from '#lib/reader/settings.ts';

const at = (min: number) => new Date(Date.UTC(2026, 10, 25, 18, min)).toISOString();
const SHA_A = 'a'.repeat(64);
const SHA_B = 'b'.repeat(64);

const local = (min: number, syncedMin: number | null, extra: Partial<SavedPlace> = {}) => ({
	cfi: 'epubcfi(/6/4)',
	fraction: 0.2,
	chapterLabel: 'Chapter 3',
	savedAt: at(min),
	href: 'ch03.xhtml',
	percent: 20,
	furthestPercent: 20,
	furthestHref: 'ch03.xhtml',
	fileSha256: SHA_A,
	readAt: at(min),
	syncedAt: syncedMin === null ? null : at(syncedMin),
	...extra
});

const row = (device: string, min: number, extra: Partial<Place> = {}): Place => ({
	bookId: 'book-1',
	deviceId: device,
	deviceName: device === 'phone' ? 'Android phone' : 'Linux PC',
	percent: 63,
	chapterLabel: 'Chapter 12',
	href: 'ch12.xhtml',
	fraction: 0,
	cfi: 'epubcfi(/6/26)',
	fileSha256: SHA_A,
	furthestPercent: 63,
	furthestHref: 'ch12.xhtml',
	readAt: at(min),
	...extra
});

const remote = (min: number, extra: Partial<Place> = {}): ReadingPosition =>
	mergePositions('book-1', [row('phone', min, extra)], null, 'laptop')[0];

describe('chooseOpen (FR-009, research R6)', () => {
	it('opens here when no other device read more recently', () => {
		expect(chooseOpen(local(30, 30), [remote(10)])).toEqual({ kind: 'here' });
		expect(chooseOpen(local(30, null), [])).toEqual({ kind: 'here' });
	});

	it('adopts a newer place when this device has not moved since it synced', () => {
		const choice = chooseOpen(local(10, 10), [remote(20)]);
		expect(choice.kind).toBe('adopt');
		expect(choice.kind !== 'here' && choice.from.readAt).toBe(at(20));
		// A book never read here takes the newer place too.
		expect(chooseOpen(null, [remote(20)]).kind).toBe('adopt');
	});

	it('adopts the newer place even when both devices moved (owner, 2026-11-27)', () => {
		const choice = chooseOpen(local(15, 10), [remote(20)]);
		expect(choice).toMatchObject({ kind: 'adopt', from: { deviceName: 'Android phone' } });
		expect(chooseOpen(local(15, null), [remote(20)]).kind).toBe('adopt');
	});

	it('goes by when a place was read, not when it arrived', () => {
		// A Kobo place read yesterday and synced today is older than this morning's place here.
		const kobo = { ...remote(5), source: 'kobo', deviceName: undefined };
		expect(chooseOpen(local(10, 10), [kobo])).toEqual({ kind: 'here' });
	});

	it('picks the most recent of several other devices', () => {
		const positions = mergePositions(
			'book-1',
			[row('phone', 20), row('tablet', 25, { percent: 30, furthestPercent: 30 })],
			null,
			'laptop'
		);
		const choice = chooseOpen(local(10, 10), positions);
		expect(choice.kind !== 'here' && choice.from.source).toBe('tablet');
	});

	it('adopting keeps the other place’s readAt and counts as synced', () => {
		const p = adoptedPlace(remote(20), SHA_A);
		expect(p).toMatchObject({ readAt: at(20), syncedAt: at(20), cfi: 'epubcfi(/6/26)' });
		expect(adoptedPlace(remote(20), SHA_B).cfi).toBe('');
	});
});

describe('placeToOffer (FR-009)', () => {
	const opened = { percent: 20, href: 'ch03.xhtml' };
	const none = new Set<string>();

	it('offers a place further on, in a later chapter', () => {
		expect(placeToOffer(opened, [remote(5)], none)?.percent).toBe(63);
	});

	it('does not offer a place behind, or further on in the same chapter', () => {
		expect(placeToOffer(opened, [remote(5, { percent: 10, href: 'ch02.xhtml' })], none)).toBe(
			undefined
		);
		expect(placeToOffer(opened, [remote(5, { percent: 24, href: 'ch03.xhtml' })], none)).toBe(
			undefined
		);
	});

	it('with no chapter to compare, needs a few percent', () => {
		const bare = { percent: 20, href: '' };
		expect(placeToOffer(bare, [remote(5, { percent: 23 })], none)).toBe(undefined);
		expect(placeToOffer(bare, [remote(5, { percent: 25 })], none)?.percent).toBe(25);
	});

	it('offers each place once', () => {
		const p = remote(5);
		expect(placeToOffer(opened, [p], new Set([offerKey(p)]))).toBe(undefined);
		// The same device read on: a new place, so it can be offered again.
		expect(placeToOffer(opened, [remote(6)], new Set([offerKey(p)]))?.readAt).toBe(at(6));
	});

	it('offers the furthest of several', () => {
		const near = remote(5, { percent: 40, href: 'ch08.xhtml' });
		const far = { ...remote(4, { percent: 70, href: 'ch14.xhtml' }), source: 'kobo' };
		expect(placeToOffer(opened, [near, far], none)?.source).toBe('kobo');
	});
});

describe('startAt', () => {
	it('uses the CFI only on the same file, then the chapter, then the percent', () => {
		expect(startAt(remote(20), SHA_A)).toEqual({ cfi: 'epubcfi(/6/26)' });
		expect(startAt(remote(20), SHA_B)).toEqual({ href: 'ch12.xhtml', fraction: 0.63 });
		expect(startAt(remote(20, { href: '' }), SHA_B)).toEqual({ fraction: 0.63 });
		expect(startAt(remote(20, { fileSha256: undefined }), SHA_A).cfi).toBeUndefined();
	});

	it('reads the file hash from a mirror file URL', () => {
		expect(fileShaOf(`/api/files/${SHA_A}`)).toBe(SHA_A);
		expect(fileShaOf('/sample/books/x.epub')).toBeUndefined();
	});
});

describe('mergePositions', () => {
	it('replaces this device’s mirror row with the local place', () => {
		const out = mergePositions(
			'book-1',
			[row('laptop', 5), row('phone', 20)],
			local(30, 5),
			'laptop'
		);
		expect(out.map((p) => p.source)).toEqual([THIS_DEVICE, 'phone']);
		expect(out[0]).toMatchObject({ percent: 20, readAt: at(30) });
		expect(out[1]).toMatchObject({ deviceName: 'Android phone', percent: 63 });
	});

	it('falls back to this device’s mirror row when storage was cleared', () => {
		const out = mergePositions(
			'book-1',
			[row('laptop', 5, { percent: 12, furthestPercent: 12 })],
			null,
			'laptop'
		);
		expect(out).toMatchObject([{ source: THIS_DEVICE, percent: 12 }]);
	});

	it('ignores other books', () => {
		expect(mergePositions('book-2', [row('phone', 20)], null, 'laptop')).toEqual([]);
	});
});
