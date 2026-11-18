import { S, assume } from '../design/sources.ts';
import type { Token } from './types.ts';

/**
 * Colour tokens (OKLCH), measured from the owner-approved mocks (`design-mocks/styles.css`,
 * DR-0002). Light is the default; dark follows `prefers-color-scheme: dark`; night is chosen in
 * the reader's text settings. Neutrals are near-grey paper and ink. The only accent hue is oxblood
 * (about 12°). Ratios are checked in contrast.test.ts.
 */
const NEUTRAL_WHY = [S.calmDs, S.bda, S.scopeAutism] as const;
const MOCK = S.approvedMocks;

export const ACCENT_HUE = 12;

export const color: Token[] = [
	{
		name: 'bg',
		group: 'color',
		value: {
			light: 'oklch(0.976 0.003 106)',
			dark: 'oklch(0.227 0.004 85)',
			night: 'oklch(0.165 0.003 68)'
		},
		rationale:
			'Page paper, under a fine grain. Never pure white, to avoid glare. Dark grey in dark; near-black in night, for reading in bed.',
		sources: [
			...NEUTRAL_WHY,
			MOCK,
			assume('Dark grey rather than black reduces text halation for some readers.')
		]
	},
	{
		name: 'surface',
		group: 'color',
		value: {
			light: 'oklch(0.940 0.004 91)',
			dark: 'oklch(0.281 0.006 92)',
			night: 'oklch(0.222 0.004 85)'
		},
		rationale: 'Plain bindings, hover tints and the catalogue stage. One small step from the page.',
		sources: [...NEUTRAL_WHY, MOCK]
	},
	{
		name: 'raised',
		group: 'color',
		value: {
			light: 'oklch(0.986 0.002 90)',
			dark: 'oklch(0.260 0.006 92)',
			night: 'oklch(0.201 0.004 85)'
		},
		rationale: 'Search field and panels. Slightly lifted from the paper.',
		sources: [...NEUTRAL_WHY, MOCK]
	},
	{
		name: 'ink',
		group: 'color',
		value: {
			light: 'oklch(0.214 0.002 68)',
			dark: 'oklch(0.938 0.010 82)',
			night: 'oklch(0.869 0.015 81)'
		},
		rationale:
			'Titles and headings set in Literata. Darker than body text, so headings lead without bold colour.',
		sources: [S.wcag22, MOCK]
	},
	{
		name: 'text',
		group: 'color',
		value: {
			light: 'oklch(0.314 0.008 85)',
			dark: 'oklch(0.874 0.013 82)',
			night: 'oklch(0.779 0.017 79)'
		},
		rationale:
			'Body text. About 10–12:1 in light and dark and 9.6:1 in night: well above 4.5:1, short of maximum contrast to avoid glare.',
		sources: [S.wcag22, S.calmDs, S.piepenbrock2014, S.polarityOverview, MOCK]
	},
	{
		name: 'text-muted',
		group: 'color',
		value: {
			light: 'oklch(0.491 0.011 78)',
			dark: 'oklch(0.708 0.016 81)',
			night: 'oklch(0.615 0.019 85)'
		},
		rationale: 'Secondary text such as authors and dates. Still at least 4.5:1 on every surface.',
		sources: [S.wcag22, MOCK]
	},
	{
		name: 'border',
		group: 'color',
		value: {
			light: 'oklch(0.894 0.008 91)',
			dark: 'oklch(0.330 0.011 85)',
			night: 'oklch(0.278 0.006 78)'
		},
		rationale:
			'Hairline rules between sections and rows. Decorative only, so the 3:1 rule does not apply.',
		sources: [S.wcag22, MOCK]
	},
	{
		name: 'control',
		group: 'color',
		value: {
			light: 'oklch(0.600 0.011 82)',
			dark: 'oklch(0.564 0.015 82)',
			night: 'oklch(0.525 0.013 85)'
		},
		rationale:
			'Outlines of inputs and buttons, and the other device’s progress bar. At least 3:1 so controls can be found.',
		sources: [S.wcag22, MOCK]
	},
	{
		name: 'accent',
		group: 'color',
		value: {
			light: 'oklch(0.413 0.106 13)',
			dark: 'oklch(0.759 0.087 11)',
			night: 'oklch(0.698 0.078 11)'
		},
		rationale:
			'The one accent: progress, links, the current place. Oxblood, chosen in live review (DR-0002); muted, never bright red.',
		sources: [S.calmDs, S.scopeAutism, S.homeOffice, MOCK]
	},
	{
		name: 'accent-surface',
		group: 'color',
		value: {
			light: 'oklch(0.934 0.012 17)',
			dark: 'oklch(0.294 0.031 9)',
			night: 'oklch(0.245 0.022 9)'
		},
		rationale: 'Quiet tint behind the current item. Text keeps full contrast on it.',
		sources: [S.calmDs, MOCK]
	},
	{
		name: 'action',
		group: 'color',
		value: {
			light: 'oklch(0.235 0.004 85)',
			dark: 'oklch(0.938 0.010 82)',
			night: 'oklch(0.869 0.015 81)'
		},
		rationale:
			'Fill of the one primary button (Continue reading): ink, not the accent, so oxblood stays for progress.',
		sources: [MOCK]
	},
	{
		name: 'on-accent',
		group: 'color',
		value: {
			light: 'oklch(0.982 0.003 85)',
			dark: 'oklch(0.227 0.004 85)',
			night: 'oklch(0.165 0.003 68)'
		},
		rationale: 'Text on a solid accent or action fill.',
		sources: [S.wcag22, MOCK]
	},
	{
		name: 'focus',
		group: 'color',
		value: {
			light: 'oklch(0.413 0.106 13)',
			dark: 'oklch(0.759 0.087 11)',
			night: 'oklch(0.698 0.078 11)'
		},
		rationale:
			'Focus ring, in the accent. At least 3:1 against every surface, so focus is never lost.',
		sources: [S.wcag22, MOCK]
	}
];
