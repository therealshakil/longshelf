import type { CatalogueMeta } from '@longshelf/shared/design/meta';
import { S } from '@longshelf/shared/design/sources';
import { checks } from '#lib/catalogue/meta-helpers.ts';

export const meta: CatalogueMeta = {
	id: 'ledger-row',
	title: 'Ledger row',
	kind: 'component',
	order: 260,
	rationale:
		'One of the other books you’re reading, in the “Also reading” list on Home. The whole row opens the book (one link per book), with your progress on the right, a full-width progress line, a grey second line for the other device, and “Story so far” when you’ve been away a week or more. Approved as “Compact band” in live review.',
	sources: [S.approvedMocks, S.wcag22],
	checks: checks({
		I: ['pass', 'A faint tint on hover; no movement.'],
		II: ['pass', 'Every row has the same parts in the same places.'],
		III: ['pass', 'One book per row, one target.'],
		IV: ['pass', 'Progress on both devices, and how long you’ve been away.'],
		V: ['pass', 'The recap is offered, never pushed.'],
		VI: ['pass', '“Away 12 days · Story so far”.']
	})
};
