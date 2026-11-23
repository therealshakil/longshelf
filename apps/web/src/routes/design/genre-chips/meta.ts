import type { CatalogueMeta } from '@ribbon/shared/design/meta';
import { S } from '@ribbon/shared/design/sources';
import { checks } from '#lib/catalogue/meta-helpers.ts';

export const meta: CatalogueMeta = {
	id: 'genre-chips',
	title: 'Genre chips',
	kind: 'component',
	order: 445,
	rationale:
		'A book’s genres. Calibre’s are solid. AI suggestions are outlined, with Promote and Remove, and stay in Longshelf until promoted. A promoted genre says it is waiting for sync, and a removal can be undone.',
	sources: [S.approvedMocks, S.wcag22],
	checks: checks({
		I: ['pass', 'Quiet chips with no motion.'],
		II: ['pass', 'Solid always means Calibre, outlined always means Longshelf only.'],
		III: ['pass', 'One name and at most two small actions per chip.'],
		IV: ['pass', 'Choices are remembered and a removal can be undone.'],
		V: ['pass', 'No time limit on Undo and no prompts to review.'],
		VI: ['pass', '“Promote”, “Waiting for sync”.']
	})
};
