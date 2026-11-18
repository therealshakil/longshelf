import type { CatalogueMeta } from '@ribbon/shared/design/meta';
import { S } from '@ribbon/shared/design/sources';
import { checks } from '#lib/catalogue/meta-helpers.ts';

export const meta: CatalogueMeta = {
	id: 'contents-panel',
	title: 'Contents',
	kind: 'component',
	order: 320,
	rationale:
		'The book’s chapters, grouped as the book groups them, opening from the left. The chapter you’re in is marked with “You’re here” and a tint, not colour alone.',
	sources: [S.approvedMocks, S.wcag22],
	checks: checks({
		I: ['pass', 'No motion.'],
		II: ['pass', 'Always opens from the same side.'],
		III: ['pass', 'One list.'],
		IV: ['pass', 'Marks where you are.'],
		V: ['pass', 'No progress pressure.'],
		VI: ['pass', 'The book’s own chapter names.']
	})
};
