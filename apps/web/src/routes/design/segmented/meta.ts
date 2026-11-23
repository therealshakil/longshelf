import type { CatalogueMeta } from '@longshelf/shared/design/meta';
import { S } from '@longshelf/shared/design/sources';
import { checks } from '#lib/catalogue/meta-helpers.ts';

export const meta: CatalogueMeta = {
	id: 'segmented',
	title: 'Segmented choice',
	kind: 'component',
	order: 300,
	rationale:
		'A few options side by side, with the chosen one filled. It is a real radio group, so arrow keys move between options and screen readers announce the choice.',
	sources: [S.approvedMocks, S.wcag22],
	checks: checks({
		I: ['pass', 'No motion; the fill changes instantly.'],
		II: ['pass', 'Same control for every reader setting.'],
		III: ['pass', 'Two or three options at a time.'],
		IV: ['pass', 'Your choice stays selected.'],
		V: ['pass', 'No defaults pushed.'],
		VI: ['pass', 'Option names are plain words.']
	})
};
