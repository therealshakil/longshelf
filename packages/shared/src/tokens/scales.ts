import { S, assume } from '../design/sources.ts';
import type { Token } from './types.ts';

/** Type, space, radius, motion, focus and size tokens. All lengths are in rem so browser zoom and text size work. */

export const type: Token[] = [
	{
		name: 'font-ui',
		group: 'type',
		value: "'Atkinson Hyperlegible Next', system-ui, sans-serif",
		rationale:
			'Interface typeface, designed so no two letters can be mistaken for each other. Self-hosted for offline use. So-called dyslexia fonts were rejected because studies found no benefit.',
		sources: [
			S.atkinson,
			S.wery2017,
			S.kuster2018,
			assume('Legibility benefit is plausible but not proven by a controlled reading study.')
		]
	},
	{
		name: 'font-reading',
		group: 'type',
		value: "'Literata', Georgia, serif",
		rationale: 'Long-form reading typeface, commissioned for e-reading. Used for book descriptions and samples.',
		sources: [S.literata, assume('Literata suits long reading; based on its design brief, not a study.')]
	},
	{
		name: 'text-sm',
		group: 'type',
		value: '0.875rem',
		rationale: 'Small labels only (badges, captions). Never for body text.',
		sources: [S.bda]
	},
	{
		name: 'text-base',
		group: 'type',
		value: '1rem',
		rationale: 'Body text: 16px at default zoom, following dyslexia-friendly guidance on size.',
		sources: [S.bda, S.homeOffice]
	},
	{
		name: 'text-lg',
		group: 'type',
		value: '1.25rem',
		rationale: 'Section headings.',
		sources: [assume('Scale steps of about 1.25× give clear hierarchy without shouting.')]
	},
	{
		name: 'text-xl',
		group: 'type',
		value: '1.5rem',
		rationale: 'Page headings.',
		sources: [assume('Scale steps of about 1.25× give clear hierarchy without shouting.')]
	},
	{
		name: 'text-2xl',
		group: 'type',
		value: '2rem',
		rationale: 'The one title on a page, e.g. a book title on its detail page.',
		sources: [assume('Scale steps of about 1.25× give clear hierarchy without shouting.')]
	},
	{
		name: 'leading-body',
		group: 'type',
		value: '1.5',
		rationale: 'Line height for body text. WCAG text spacing and dyslexia guidance both use 1.5.',
		sources: [S.wcag22, S.bda]
	},
	{
		name: 'leading-tight',
		group: 'type',
		value: '1.25',
		rationale: 'Headings and single-line labels.',
		sources: [assume('Headings are short; tighter leading keeps them as one visual unit.')]
	},
	{
		name: 'weight-regular',
		group: 'type',
		value: '400',
		rationale: 'Body text.',
		sources: [S.atkinson]
	},
	{
		name: 'weight-strong',
		group: 'type',
		value: '650',
		rationale: 'Headings and emphasis. Bold is used for emphasis instead of italics or underline.',
		sources: [S.bda, S.atkinson]
	},
	{
		name: 'measure',
		group: 'type',
		value: '66ch',
		rationale:
			'Maximum line length for prose. Readers find moderate lines (about 55–70 characters) easiest.',
		sources: [S.dyson2004, S.bda]
	}
];

const SPACE_WHY = [
	S.coga,
	assume('A 0.25rem (4px) base step keeps rhythm consistent; generous spacing reduces clutter.')
];
export const space: Token[] = (
	[
		['space-1', '0.25rem', 'Hairline gaps (icon to label).'],
		['space-2', '0.5rem', 'Inside compact controls.'],
		['space-3', '0.75rem', 'Between related lines.'],
		['space-4', '1rem', 'Default gap and padding.'],
		['space-6', '1.5rem', 'Between items in a group.'],
		['space-8', '2rem', 'Between groups.'],
		['space-12', '3rem', 'Between page sections.'],
		['space-16', '4rem', 'Page top and bottom margins on wide screens.']
	] as const
).map(([name, value, rationale]) => ({ name, group: 'space', value, rationale, sources: SPACE_WHY }));

export const radius: Token[] = [
	{
		name: 'radius-sm',
		group: 'radius',
		value: '0.375rem',
		rationale: 'Controls. Softened corners, still clearly a box.',
		sources: [assume('Gentle rounding reads as calm without making controls look like decoration.')]
	},
	{
		name: 'radius-md',
		group: 'radius',
		value: '0.75rem',
		rationale: 'Cards and dialogs.',
		sources: [assume('Gentle rounding reads as calm without making controls look like decoration.')]
	}
];

export const motion: Token[] = [
	{
		name: 'duration',
		group: 'motion',
		value: '0ms',
		rationale:
			'No motion. Nothing animates. Changes happen instantly and stay put. Reduced-motion system settings are also honoured as a safety net.',
		sources: [S.calmDs, S.wcag22, S.mq5]
	}
];

export const focus: Token[] = [
	{
		name: 'focus-width',
		group: 'focus',
		value: '3px',
		rationale: 'Thick, solid focus ring: at least a 2px perimeter, as WCAG focus appearance asks.',
		sources: [S.wcag22]
	},
	{
		name: 'focus-offset',
		group: 'focus',
		value: '2px',
		rationale: 'A gap between ring and control so the ring contrasts with the page, not the control.',
		sources: [S.wcag22]
	}
];

export const size: Token[] = [
	{
		name: 'target',
		group: 'size',
		value: '2.75rem',
		rationale: 'Minimum size of anything you can press: 44px at default zoom (WCAG AAA target size).',
		sources: [S.wcag22]
	}
];
