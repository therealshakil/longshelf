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
		name: 'text-xs',
		group: 'type',
		value: '0.8125rem',
		rationale: 'Metadata such as device progress and footnotes. Never for body text.',
		sources: [S.approvedMocks]
	},
	{
		name: 'text-display',
		group: 'type',
		value: 'clamp(2rem, 1.4rem + 1.8vw, 3rem)',
		rationale:
			'The current book’s title on Home and a book’s title on its page: the one large title, scaling with the window.',
		sources: [S.approvedMocks]
	},
	{
		name: 'text-reading',
		group: 'type',
		value: '1.25rem',
		rationale: 'Reading text and recaps in Literata (1.125rem on phones), as in the approved reader.',
		sources: [S.approvedMocks, S.bda]
	},
	{
		name: 'leading-display',
		group: 'type',
		value: '1.05',
		rationale: 'Large titles sit tight so a two-line title reads as one block.',
		sources: [S.approvedMocks]
	},
	{
		name: 'leading-reading',
		group: 'type',
		value: '1.7',
		rationale: 'Generous line spacing for long reading, within dyslexia-friendly guidance (1.5 or more).',
		sources: [S.bda, S.approvedMocks]
	},
	{
		name: 'weight-title',
		group: 'type',
		value: '600',
		rationale: 'Literata titles: firm without being bold.',
		sources: [S.approvedMocks]
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
		name: 'radius-cover',
		group: 'radius',
		value: '0.125rem',
		rationale: 'Book covers: almost square, like a real book’s board.',
		sources: [S.approvedMocks]
	},
	{
		name: 'radius-pill',
		group: 'radius',
		value: '999rem',
		rationale: 'Buttons and the search field: fully rounded, as in the approved mocks.',
		sources: [S.approvedMocks]
	},
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
	},
	{
		name: 'duration-reveal',
		group: 'motion',
		value: '200ms',
		rationale:
			'The one exception: when you tap the page, the reader’s bars slide away or back. You started it, it is short, and it is off when your system asks for reduced motion (DR-0002).',
		sources: [S.approvedMocks, S.wcag22, S.mq5]
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

const grain = (rgb: string, alpha: number) =>
	`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 ${rgb} 0 0 0 0 ${rgb} 0 0 0 0 ${rgb} 0 0 0 ${alpha} 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`;

/** Paper grain and soft shadows from the approved mocks (spec 002, DR-0002). */
export const depth: Token[] = [
	{
		name: 'grain',
		group: 'depth',
		value: { light: grain('0', 0.07), dark: grain('1', 0.045), night: 'none' },
		rationale:
			'A fine paper grain behind the page: texture rather than colour. None in night, where the page should be as quiet as possible.',
		sources: [S.approvedMocks]
	},
	{
		name: 'shadow-cover',
		group: 'depth',
		value: {
			light: '0 1px 2px #0002, 0 18px 30px -14px #0007',
			dark: '0 1px 2px #0006, 0 18px 30px -14px #000c',
			night: '0 1px 2px #000, 0 18px 30px -14px #000'
		},
		rationale: 'Large covers sit on the paper with a soft, offset shadow, like a book on a table.',
		sources: [S.approvedMocks]
	},
	{
		name: 'shadow-tile',
		group: 'depth',
		value: {
			light: '0 1px 1px #0001, 0 8px 14px -10px #0006',
			dark: '0 1px 1px #0004, 0 8px 14px -10px #000a',
			night: '0 1px 1px #000, 0 8px 14px -10px #000'
		},
		rationale: 'Small covers get a lighter shadow so a grid does not look heavy.',
		sources: [S.approvedMocks]
	}
];
