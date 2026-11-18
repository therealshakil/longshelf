/**
 * Every foreground/background combination the design uses, with the WCAG 2.2 AA minimum it needs.
 * 4.5 = text (SC 1.4.3); 3 = interface parts and focus indicators (SC 1.4.11).
 */
export interface Pair {
	fg: string;
	bg: string;
	minRatio: number;
	use: string;
}

const SURFACES = ['bg', 'surface', 'raised'] as const;

export const pairs: Pair[] = [
	...SURFACES.flatMap((bg) => [
		{ fg: 'ink', bg, minRatio: 4.5, use: 'titles and headings' },
		{ fg: 'text', bg, minRatio: 4.5, use: 'body text' },
		{ fg: 'text-muted', bg, minRatio: 4.5, use: 'secondary text' },
		{ fg: 'accent', bg, minRatio: 4.5, use: 'links and accent text' },
		{ fg: 'control', bg, minRatio: 3, use: 'control outlines' },
		{ fg: 'focus', bg, minRatio: 3, use: 'focus ring' }
	]),
	{ fg: 'text', bg: 'accent-surface', minRatio: 4.5, use: 'text on the current-item tint' },
	{ fg: 'accent', bg: 'accent-surface', minRatio: 4.5, use: 'accent text on the tint' },
	{ fg: 'on-accent', bg: 'accent', minRatio: 4.5, use: 'text on an accent fill' },
	{ fg: 'on-accent', bg: 'action', minRatio: 4.5, use: 'primary button label' },
	{ fg: 'focus', bg: 'accent-surface', minRatio: 3, use: 'focus ring on the tint' }
];
