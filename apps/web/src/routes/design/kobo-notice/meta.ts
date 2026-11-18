import type { CatalogueMeta } from '@ribbon/shared/design/meta';
import { S } from '@ribbon/shared/design/sources';
import { checks } from '#lib/catalogue/meta-helpers.ts';

export const meta: CatalogueMeta = {
	id: 'kobo-notice',
	title: 'Device notice',
	kind: 'component',
	order: 330,
	rationale:
		'When another device is further on in the book, a compact pill in the reader’s top bar says so, with Go there and Stay. It never floats over the text (owner, 2026-11-18).',
	sources: [S.approvedMocks, S.wcag22],
	checks: checks({
		I: ['pass', 'Quiet pill, no motion.'],
		II: ['pass', 'Always in the top bar.'],
		III: ['pass', 'One message, two choices.'],
		IV: ['pass', 'Remembers the other device’s place for you.'],
		V: ['pass', 'Stay is as easy as Go there.'],
		VI: ['pass', '“Kobo is further on · Chapter 41, 41%”.']
	})
};
