import { describe, expect, it } from 'vitest';
import { DEFAULTS, parseSettings, measurePx, SIZES } from './settings.ts';

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

describe('measurePx', () => {
	it('keeps the same line length as text grows', () => {
		const at = (size: number) => measurePx({ size, margins: 'medium' }) / SIZES[size];
		expect(at(1)).toBeCloseTo(at(5), 0);
		expect(measurePx({ size: 3, margins: 'medium' })).toBe(570);
		expect(measurePx({ size: 3, margins: 'wide' })).toBeLessThan(570);
	});
});
