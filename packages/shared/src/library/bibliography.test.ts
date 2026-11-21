import { describe, expect, it } from 'vitest';
import { linkOwnedWorks, shortWorkList, titleKey } from './bibliography.ts';

describe('titleKey', () => {
	it('treats forms of a title as the same work', () => {
		const key = titleKey('Pride and Prejudice');
		expect(titleKey('Pride & Prejudice')).toBe(key);
		expect(titleKey('Pride and Prejudice (Signature Editions)')).toBe(key);
		expect(titleKey('Pride and Prejudice: A Novel')).toBe(key);
		expect(titleKey('Frankenstein; or, The Modern Prometheus')).toBe(titleKey('Frankenstein'));
	});
	it('ignores a leading article and accents', () => {
		expect(titleKey('The Watsons')).toBe('watsons');
		expect(titleKey('Les Misérables')).toBe('les miserables');
	});
});

describe('shortWorkList', () => {
	const works = ['a', 'b', 'c', 'd', 'e'].map((title) => ({
		title,
		...(title === 'e' ? { ownedBookId: 'e-id' } : {})
	}));
	it('keeps owned works and fills the limit with the earliest, in order', () => {
		expect(shortWorkList(works, 3).map((w) => w.title)).toEqual(['a', 'b', 'e']);
	});
	it('keeps every owned work even past the limit', () => {
		expect(shortWorkList(works, 0).map((w) => w.title)).toEqual(['e']);
	});
	it('returns a short list unchanged', () => {
		expect(shortWorkList(works, 12)).toEqual(works);
	});
});

describe('linkOwnedWorks', () => {
	it('links only the works in the library and keeps their order and years', () => {
		const out = linkOwnedWorks(
			[
				{ title: 'Mansfield Park', year: '1814' },
				{ title: 'Emma', year: '1815' }
			],
			[{ id: 'emma-id', title: 'Emma' }]
		);
		expect(out).toEqual([
			{ title: 'Mansfield Park', year: '1814' },
			{ title: 'Emma', year: '1815', ownedBookId: 'emma-id' }
		]);
	});
});
