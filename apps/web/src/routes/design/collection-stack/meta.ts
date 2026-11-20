import type { CatalogueMeta } from '@ribbon/shared/design/meta';
import { S } from '@ribbon/shared/design/sources';
import { checks } from '#lib/catalogue/meta-helpers.ts';

export const meta: CatalogueMeta = {
	id: 'collection-stack',
	title: 'Collection stack',
	kind: 'component',
	order: 430,
	rationale:
		'A Calibre collection (or a genre) as three fanned covers, its name and how many books it holds. Opens the shelf.',
	sources: [S.approvedMocks, S.wcag22],
	checks: checks({
		I: ['pass', 'Still covers, no motion.'],
		II: ['pass', 'Same shape for every shelf.'],
		III: ['pass', 'Name and count only.'],
		IV: ['n/a', 'Nothing to remember.'],
		V: ['pass', 'No pressure.'],
		VI: ['pass', '“6 books”.']
	})
};
