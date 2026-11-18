import type { Source } from '../design/meta.ts';

/** light and dark follow the system; night is chosen by the owner in the reader (spec 002). */
export const THEMES = ['light', 'dark', 'night'] as const;
export type Theme = (typeof THEMES)[number];

export type TokenGroup =
	| 'color'
	| 'type'
	| 'space'
	| 'radius'
	| 'motion'
	| 'focus'
	| 'size'
	| 'depth';

export interface Token {
	/** kebab-case; becomes the CSS custom property `--r-<name>`. */
	name: string;
	group: TokenGroup;
	/** Colour and depth tokens vary by theme; other tokens are a single CSS value. */
	value: string | Record<Theme, string>;
	/** Plain words: why this value. */
	rationale: string;
	sources: Source[];
}

export const cssVar = (name: string) => `--r-${name}`;
