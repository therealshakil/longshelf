import { describe, expect, it } from 'vitest';
import { ACCENT_HUE, contrast, getToken, inSrgbGamut, pairs, parseOklch, THEMES, tokens } from './index.ts';
import { contrastRgb } from './contrast.ts';

describe('contrast function', () => {
	it('matches WCAG reference values', () => {
		expect(contrastRgb([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 5);
		expect(contrastRgb([255, 255, 255], [255, 255, 255])).toBeCloseTo(1, 5);
		// #767676 on white is the classic 4.54:1 grey
		expect(contrastRgb([0x76, 0x76, 0x76], [255, 255, 255])).toBeCloseTo(4.54, 2);
		// oklch black/white round-trip
		expect(contrast('oklch(0 0 0)', 'oklch(1 0 0)')).toBeCloseTo(21, 5);
	});
});

const colourTokens = tokens.filter((t) => t.group === 'color');

describe('colour tokens', () => {
	it.each(THEMES)('are valid, in-gamut oklch in the %s theme', (theme) => {
		for (const t of colourTokens) {
			const v = (t.value as Record<string, string>)[theme];
			expect(() => parseOklch(v), t.name).not.toThrow();
			expect(inSrgbGamut(v), `${t.name} ${theme} out of sRGB gamut`).toBe(true);
		}
	});

	it('never use pure white or pure black', () => {
		for (const t of colourTokens)
			for (const v of Object.values(t.value as Record<string, string>)) {
				const { l } = parseOklch(v);
				expect(l, t.name).toBeGreaterThan(0.1);
				expect(l, t.name).toBeLessThan(0.99);
			}
	});

	it('use one accent hue only (FR-005)', () => {
		const chromatic = colourTokens.flatMap((t) =>
			Object.values(t.value as Record<string, string>)
				.map(parseOklch)
				.filter((c) => c.c >= 0.02)
				.map((c) => ({ name: t.name, h: c.h }))
		);
		expect(chromatic.length).toBeGreaterThan(0);
		for (const { name, h } of chromatic) expect(Math.abs(h - ACCENT_HUE), name).toBeLessThanOrEqual(5);
	});
});

describe('contrast pairs (FR-004, SC-003)', () => {
	const cases = THEMES.flatMap((theme) => pairs.map((p) => ({ theme, ...p })));
	it.each(cases)('$theme: $fg on $bg ≥ $minRatio ($use)', ({ theme, fg, bg, minRatio }) => {
		const f = (getToken(fg).value as Record<string, string>)[theme];
		const b = (getToken(bg).value as Record<string, string>)[theme];
		expect(contrast(f, b)).toBeGreaterThanOrEqual(minRatio);
	});

	it.each(THEMES)('%s: body text sits in the calm band (about 9–12:1, not maximum)', (theme) => {
		const text = (getToken('text').value as Record<string, string>)[theme];
		const bg = (getToken('bg').value as Record<string, string>)[theme];
		const r = contrast(text, bg);
		expect(r).toBeGreaterThanOrEqual(9);
		expect(r).toBeLessThanOrEqual(12.5);
	});
});

describe('token metadata', () => {
	it('every token has a rationale and at least one source', () => {
		for (const t of tokens) {
			expect(t.rationale.length, t.name).toBeGreaterThan(0);
			expect(t.sources.length, t.name).toBeGreaterThan(0);
		}
	});
	it('token names are unique kebab-case', () => {
		const names = tokens.map((t) => t.name);
		expect(new Set(names).size).toBe(names.length);
		for (const n of names) expect(n).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
	});
});
