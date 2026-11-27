import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	allPlaces,
	isPending,
	loadPlace,
	markSynced,
	parsePlace,
	savePlace,
	type SavedPlace
} from './settings.ts';
import { memoryStorage } from '../../../tests/unit/memory-storage.ts';

const at = (min: number) => new Date(Date.UTC(2026, 10, 25, 18, min)).toISOString();
const place = (min: number, extra: Partial<SavedPlace> = {}): SavedPlace => ({
	cfi: `epubcfi(/6/${min})`,
	fraction: 0.4,
	chapterLabel: 'Chapter 12',
	savedAt: at(min),
	href: 'ch12.xhtml',
	percent: 40,
	furthestPercent: 40,
	furthestHref: 'ch12.xhtml',
	readAt: at(min),
	syncedAt: null,
	...extra
});

beforeEach(() => vi.stubGlobal('localStorage', memoryStorage()));
afterEach(() => vi.unstubAllGlobals());

describe('parsePlace', () => {
	it('upgrades a spec 002 entry', () => {
		const old = JSON.stringify({ cfi: 'c', fraction: 0.25, chapterLabel: 'One', savedAt: at(1) });
		expect(parsePlace(old)).toEqual({
			cfi: 'c',
			fraction: 0.25,
			chapterLabel: 'One',
			savedAt: at(1),
			href: '',
			percent: 25,
			furthestPercent: 25,
			furthestHref: '',
			readAt: at(1),
			syncedAt: null
		});
	});
	it('rejects junk', () => {
		expect(parsePlace('{')).toBeNull();
		expect(parsePlace('{"cfi":1}')).toBeNull();
	});
});

describe('savePlace', () => {
	it('never moves back to an older place (two tabs)', () => {
		expect(savePlace('b', place(5))).toBe(true);
		expect(savePlace('b', place(3))).toBe(false);
		expect(loadPlace('b')?.readAt).toBe(at(5));
		expect(savePlace('b', place(7))).toBe(true);
	});
});

describe('pending and synced', () => {
	it('is pending until the mirror confirms the same readAt', () => {
		savePlace('b', place(5));
		expect(isPending(loadPlace('b')!)).toBe(true);
		markSynced('b', at(5));
		expect(isPending(loadPlace('b')!)).toBe(false);
	});
	it('stays pending if the place moved after it was sent', () => {
		savePlace('b', place(5));
		savePlace('b', place(6));
		markSynced('b', at(5));
		expect(isPending(loadPlace('b')!)).toBe(true);
	});
	it('lists every place', () => {
		savePlace('a', place(1));
		savePlace('b', place(2));
		localStorage.setItem('longshelf.reader.v1', '{}');
		expect([...allPlaces().keys()].sort()).toEqual(['a', 'b']);
	});
});
