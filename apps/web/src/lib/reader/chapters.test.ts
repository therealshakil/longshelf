import { describe, expect, it } from 'vitest';
import { placeLabel } from './chapters.ts';

const toc = [
	{ label: 'PRELUDE.', href: 'p' },
	{
		label: 'BOOK IV. THREE LOVE PROBLEMS.',
		href: 'b4',
		subitems: [{ label: 'CHAPTER XL.', href: 'c40' }]
	}
];

describe('placeLabel', () => {
	it('names the book and a plain chapter number', () => {
		expect(placeLabel(toc, { label: 'CHAPTER XL.', href: 'c40' })).toBe('Book IV · Chapter 40');
	});
	it('tidies a shouted label with no parent', () => {
		expect(placeLabel(toc, { label: 'PRELUDE.', href: 'p' })).toBe('Prelude');
	});
	it('leaves a normally written label alone', () => {
		expect(placeLabel([], { label: 'The Spouter-Inn', href: 'x' })).toBe('The Spouter-Inn');
	});
});
