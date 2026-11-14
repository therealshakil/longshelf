import { S, assume } from '../design/sources.ts';
import type { Token } from './types.ts';

/**
 * Colour tokens (OKLCH). Light is the default when the system has no preference; dark follows
 * `prefers-color-scheme: dark`. Neutrals have a slight warm tint (hue 65–85). The only accent hue is
 * a muted blue-green (195). Ratios are checked in contrast.test.ts.
 */
const NEUTRAL_WHY = [S.calmDs, S.bda, S.scopeAutism] as const;

export const ACCENT_HUE = 195;

export const color: Token[] = [
	{
		name: 'bg',
		group: 'color',
		value: { light: 'oklch(0.965 0.010 85)', dark: 'oklch(0.215 0.008 70)' },
		rationale:
			'Page background. Off-white in light, never pure white, to avoid glare; dark grey in dark, not black.',
		sources: [
			...NEUTRAL_WHY,
			assume('Dark grey rather than black reduces text halation for some readers.')
		]
	},
	{
		name: 'surface',
		group: 'color',
		value: { light: 'oklch(0.94 0.010 85)', dark: 'oklch(0.25 0.008 70)' },
		rationale: 'Sunken areas (panels, code, the catalogue stage). One small step from the page.',
		sources: [...NEUTRAL_WHY]
	},
	{
		name: 'raised',
		group: 'color',
		value: { light: 'oklch(0.975 0.006 85)', dark: 'oklch(0.275 0.008 70)' },
		rationale: 'Cards and dialogs. Slightly lifted from the page without a shadow.',
		sources: [...NEUTRAL_WHY]
	},
	{
		name: 'text',
		group: 'color',
		value: { light: 'oklch(0.32 0.015 65)', dark: 'oklch(0.87 0.012 80)' },
		rationale:
			'Body text. About 10–12:1: well above the 4.5:1 minimum, but short of maximum contrast to avoid glare.',
		sources: [S.wcag22, S.calmDs, S.piepenbrock2014, S.polarityOverview]
	},
	{
		name: 'text-muted',
		group: 'color',
		value: { light: 'oklch(0.47 0.014 65)', dark: 'oklch(0.72 0.012 75)' },
		rationale: 'Secondary text such as authors and dates. Still at least 4.5:1 on every surface.',
		sources: [S.wcag22]
	},
	{
		name: 'border',
		group: 'color',
		value: { light: 'oklch(0.87 0.010 75)', dark: 'oklch(0.34 0.008 70)' },
		rationale:
			'Decorative dividers only. Not used to identify a control, so the 3:1 rule does not apply.',
		sources: [S.wcag22]
	},
	{
		name: 'control',
		group: 'color',
		value: { light: 'oklch(0.58 0.012 70)', dark: 'oklch(0.56 0.010 70)' },
		rationale: 'Outlines of inputs and buttons. At least 3:1 so controls can be found.',
		sources: [S.wcag22]
	},
	{
		name: 'accent',
		group: 'color',
		value: { light: 'oklch(0.47 0.065 195)', dark: 'oklch(0.76 0.06 195)' },
		rationale:
			'The one accent: links, the primary action, current location. Muted blue-green; no bright red or yellow.',
		sources: [S.calmDs, S.scopeAutism, S.homeOffice]
	},
	{
		name: 'accent-surface',
		group: 'color',
		value: { light: 'oklch(0.92 0.025 195)', dark: 'oklch(0.32 0.03 195)' },
		rationale: 'Quiet tint behind the current item. Text keeps full contrast on it.',
		sources: [S.calmDs]
	},
	{
		name: 'on-accent',
		group: 'color',
		value: { light: 'oklch(0.975 0.006 85)', dark: 'oklch(0.215 0.008 70)' },
		rationale: 'Text on a solid accent fill (the primary button).',
		sources: [S.wcag22]
	},
	{
		name: 'focus',
		group: 'color',
		value: { light: 'oklch(0.45 0.075 195)', dark: 'oklch(0.80 0.08 195)' },
		rationale:
			'Focus ring, in the accent hue. At least 3:1 against every surface, so focus is never lost.',
		sources: [S.wcag22]
	}
];
