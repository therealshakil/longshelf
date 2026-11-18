import type { CatalogueMeta } from '@ribbon/shared/design/meta';
import { S } from '@ribbon/shared/design/sources';
import { checks } from '#lib/catalogue/meta-helpers.ts';

export const meta: CatalogueMeta = {
	id: 'error-state',
	title: 'Error state',
	kind: 'component',
	order: 240,
	rationale:
		'What happened, whether anything was lost, and the one next step. No blame and no idioms (FR-016).',
	sources: [S.approvedMocks, S.wcag22],
	checks: checks({
		I: ['pass', 'No red alarm colour; a quiet panel.'],
		II: ['pass', 'Same three parts every time.'],
		III: ['pass', 'One problem, one next step.'],
		IV: ['pass', 'Says what was kept, so nothing needs re-checking.'],
		V: ['pass', 'No countdowns or pressure.'],
		VI: ['pass', 'Plain words, no error codes.']
	})
};
