/**
 * WCAG 2.x contrast for OKLCH colours, with no dependencies.
 * OKLCH → OKLab → linear sRGB (Björn Ottosson's matrices) → 8-bit sRGB, as a browser would
 * render it → WCAG relative luminance → contrast ratio.
 * Source: https://bottosson.github.io/posts/oklab/ ; https://www.w3.org/TR/WCAG22/#dfn-relative-luminance
 */

export interface Oklch {
	l: number;
	c: number;
	h: number;
}

/** Parse `oklch(L C H)` where L is 0–1 (or a percentage), C is a number and H is in degrees. */
export function parseOklch(css: string): Oklch {
	const m = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)\s*\)$/.exec(css.trim());
	if (!m) throw new Error(`Not an oklch() colour: ${css}`);
	const l = m[2] === '%' ? Number(m[1]) / 100 : Number(m[1]);
	return { l, c: Number(m[3]), h: Number(m[4]) };
}

/** Linear-light sRGB channels; values outside 0–1 mean the colour is out of gamut. */
export function oklchToLinearSrgb({ l, c, h }: Oklch): [number, number, number] {
	const hr = (h * Math.PI) / 180;
	const a = c * Math.cos(hr);
	const b = c * Math.sin(hr);
	const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
	const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
	const s_ = l - 0.0894841775 * a - 1.291485548 * b;
	const L = l_ ** 3;
	const M = m_ ** 3;
	const S = s_ ** 3;
	return [
		4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
		-1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
		-0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S
	];
}

const GAMUT_EPSILON = 1e-4;
export function inSrgbGamut(css: string): boolean {
	return oklchToLinearSrgb(parseOklch(css)).every(
		(v) => v >= -GAMUT_EPSILON && v <= 1 + GAMUT_EPSILON
	);
}

const encode = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
const decode = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** 8-bit sRGB, as rendered. */
export function oklchToRgb8(css: string): [number, number, number] {
	const lin = oklchToLinearSrgb(parseOklch(css));
	return lin.map((v) => Math.round(clamp01(encode(clamp01(v))) * 255)) as [number, number, number];
}

/** WCAG relative luminance of an 8-bit sRGB colour. */
export function relativeLuminance([r, g, b]: [number, number, number]): number {
	const [R, G, B] = [r, g, b].map((v) => decode(v / 255));
	return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function contrastRgb(a: [number, number, number], b: [number, number, number]): number {
	const la = relativeLuminance(a);
	const lb = relativeLuminance(b);
	const [hi, lo] = la > lb ? [la, lb] : [lb, la];
	return (hi + 0.05) / (lo + 0.05);
}

/** WCAG contrast ratio between two oklch() colours. */
export function contrast(fg: string, bg: string): number {
	return contrastRgb(oklchToRgb8(fg), oklchToRgb8(bg));
}
