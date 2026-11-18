import { describe, expect, it } from 'vitest';
import { DEFAULTS, parseSettings } from './settings.ts';

describe('reader settings', () => {
	it('falls back to defaults for missing or broken storage', () => {
		expect(parseSettings(null)).toEqual(DEFAULTS);
		expect(parseSettings('{not json')).toEqual(DEFAULTS);
	});
	it('keeps valid values and replaces invalid ones', () => {
		const s = parseSettings(
			JSON.stringify({ size: 5, font: 'atkinson', theme: 'neon', page: 'pages' })
		);
		expect(s).toEqual({ ...DEFAULTS, size: 5, font: 'atkinson', page: 'pages' });
	});
	it('rejects out-of-range sizes', () => {
		expect(parseSettings(JSON.stringify({ size: 99 })).size).toBe(DEFAULTS.size);
	});
});
