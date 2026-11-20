import { describe, expect, it } from 'vitest';
import { headingLetter, letterAt } from './letter-rail.ts';

describe('letter rail', () => {
	it('maps the pointer position to a letter', () => {
		expect(letterAt(0, 0, 260)).toBe('A');
		expect(letterAt(129, 0, 260)).toBe('M');
		expect(letterAt(259, 0, 260)).toBe('Z');
	});
	it('clamps outside the rail', () => {
		expect(letterAt(-50, 0, 260)).toBe('A');
		expect(letterAt(999, 0, 260)).toBe('Z');
	});
	it('files accented and non-letter titles sensibly', () => {
		expect(headingLetter('émile')).toBe('E');
		expect(headingLetter('1984')).toBe('#');
	});
});
