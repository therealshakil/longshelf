import type { Source } from '../design/meta.ts';

export const THEMES = ['light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

export type TokenGroup = 'color' | 'type' | 'space' | 'radius' | 'motion' | 'focus' | 'size';

export interface Token {
	/** kebab-case; becomes the CSS custom property `--r-<name>`. */
	name: string;
	group: TokenGroup;
	/** Colour tokens vary by theme; other tokens are a single CSS value. */
	value: string | Record<Theme, string>;
	/** Plain words: why this value. */
	rationale: string;
	sources: Source[];
}

export const cssVar = (name: string) => `--r-${name}`;
