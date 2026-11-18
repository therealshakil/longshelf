import type { CatalogueMeta } from '@ribbon/shared/design/meta';
import { S } from '@ribbon/shared/design/sources';
import { checks } from '#lib/catalogue/meta-helpers.ts';

export const meta: CatalogueMeta = {
	id: 'empty-state',
	title: 'Empty state',
	kind: 'component',
	order: 230,
	rationale: 'Says what is empty and the one next step, in plain words.',
	sources: [S.approvedMocks, S.wcag22],
	checks: checks({
		I: ['pass', 'Text only.'],
		II: ['pass', 'Same shape for every empty view.'],
		III: ['pass', 'One message, one next step.'],
		IV: ['n/a', 'Nothing to remember.'],
		V: ['pass', 'No guilt or prompts to do more.'],
		VI: ['pass', 'Literal wording.']
	})
};
