import type { CatalogueMeta } from '@ribbon/shared/design/meta';
import { S } from '@ribbon/shared/design/sources';
import { checks } from '#lib/catalogue/meta-helpers.ts';

export const meta: CatalogueMeta = {
	id: 'current-book',
	title: 'Current book',
	kind: 'component',
	order: 250,
	rationale:
		'The book you read last, large, at the top of Home: the cover, the title and author, then a labelled table of where you are (progress and chapter on this device, the other device’s progress, when you last read), and one Continue reading button aligned to the bottom of the cover. Approved as “Spread” in live review.',
	sources: [S.approvedMocks, S.wcag22],
	checks: checks({
		I: ['pass', 'One large cover; no motion.'],
		II: ['pass', 'Always first on Home.'],
		III: ['pass', 'One book, one action.'],
		IV: ['pass', 'Where you are on every device and when you last read.'],
		V: ['pass', 'No streaks or nudges.'],
		VI: ['pass', '“Kobo is at 41%”, “Yesterday, 22:40”.']
	})
};
