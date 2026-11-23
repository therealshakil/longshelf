import type { CatalogueMeta } from '@longshelf/shared/design/meta';
import { S } from '@longshelf/shared/design/sources';
import { checks } from '#lib/catalogue/meta-helpers.ts';

export const meta: CatalogueMeta = {
	id: 'book-grid',
	title: 'Book grid',
	kind: 'component',
	order: 450,
	rationale:
		'A grid of book tiles that keeps every cover the same shape, so nothing jumps while covers load. Three across on a phone.',
	sources: [S.approvedMocks, S.wcag22],
	checks: checks({
		I: ['pass', 'No motion.'],
		II: ['pass', 'The same grid everywhere in the Library.'],
		III: ['pass', 'Covers only, with title and status.'],
		IV: ['pass', 'Read status on every tile.'],
		V: ['pass', 'No ratings or counts.'],
		VI: ['pass', 'Titles and authors only.']
	})
};
