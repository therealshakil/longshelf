import type { CatalogueMeta } from '@ribbon/shared/design/meta';
import { S } from '@ribbon/shared/design/sources';
import { checks } from '#lib/catalogue/meta-helpers.ts';

export const meta: CatalogueMeta = {
	id: 'read-next-shelf',
	title: 'Read next shelf',
	kind: 'component',
	order: 235,
	rationale:
		'Suggestions from your own library: two rows of six on Home, one row of five on a book page. Each book says why it is here. A quiet menu hides it for 30 days or until you undo it, and the undo line stays until you leave, so nothing has to be caught in time.',
	sources: [S.approvedMocks, S.wcag22],
	checks: checks({
		I: ['pass', 'The menu button stays hidden until hover or focus, except on touch screens.'],
		II: ['pass', 'The same tile and menu on Home and the book page.'],
		III: ['pass', 'One reason per book and two choices in the menu.'],
		IV: ['pass', 'Dismissals are remembered and can be undone.'],
		V: ['pass', 'No timed undo, scores or streaks.'],
		VI: ['pass', '“On your Reading List”, “Not now”, “Never suggest”.']
	})
};
