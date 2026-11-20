import type { CatalogueMeta } from '@ribbon/shared/design/meta';
import { S } from '@ribbon/shared/design/sources';
import { checks } from '#lib/catalogue/meta-helpers.ts';

export const meta: CatalogueMeta = {
	id: 'letter-rail',
	title: 'Letter rail',
	kind: 'component',
	order: 410,
	rationale:
		'A vertical A–Z down the right edge of All Books. Press and drag along it to move through the letters; a large letter shows where you are. Letters with no books are dimmed. Each letter is also an ordinary link.',
	sources: [S.approvedMocks, S.wcag22],
	checks: checks({
		I: ['pass', 'The large letter appears only while you drag.'],
		II: ['pass', 'Always on the right edge.'],
		III: ['pass', 'Only shown on All Books.'],
		IV: ['n/a', 'Nothing to remember.'],
		V: ['pass', 'No pressure.'],
		VI: ['pass', 'Letters only.']
	})
};
