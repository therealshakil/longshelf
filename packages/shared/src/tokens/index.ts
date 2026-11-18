import { color } from './color.ts';
import { depth, focus, motion, radius, size, space, type } from './scales.ts';
import type { Token, TokenGroup } from './types.ts';

export * from './types.ts';
export { ACCENT_HUE } from './color.ts';
export { pairs, type Pair } from './pairs.ts';
export { contrast, inSrgbGamut, parseOklch } from './contrast.ts';
export { tokensToCss } from './to-css.ts';

export const tokens: Token[] = [
	...color,
	...type,
	...space,
	...radius,
	...motion,
	...focus,
	...size,
	...depth
];

export const byGroup = (g: TokenGroup) => tokens.filter((t) => t.group === g);

export function getToken(name: string): Token {
	const t = tokens.find((x) => x.name === name);
	if (!t) throw new Error(`Unknown token: ${name}`);
	return t;
}
