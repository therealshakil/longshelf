import type { CatalogueMeta } from '@ribbon/shared/design/meta';
import { S } from '@ribbon/shared/design/sources';
import { checks } from '#lib/catalogue/meta-helpers.ts';

export const meta: CatalogueMeta = {
	id: 'author-list',
	title: 'Author list',
	kind: 'component',
	order: 420,
	rationale:
		'Every author under letter headings, with how many of their books you have. Each name opens the author’s page.',
	sources: [S.approvedMocks, S.wcag22],
	checks: checks({
		I: ['pass', 'Plain list.'],
		II: ['pass', 'Sorted by surname, always.'],
		III: ['pass', 'Names and counts only.'],
		IV: ['n/a', 'Nothing to remember.'],
		V: ['pass', 'No rankings.'],
		VI: ['pass', '“4 books”.']
	})
};
