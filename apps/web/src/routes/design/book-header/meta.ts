import type { CatalogueMeta } from '@longshelf/shared/design/meta';
import { S } from '@longshelf/shared/design/sources';
import { checks } from '#lib/catalogue/meta-helpers.ts';

export const meta: CatalogueMeta = {
	id: 'book-header',
	title: 'Book header',
	kind: 'component',
	order: 460,
	rationale:
		'The top of a book page: a large cover; the title, author and publication; where you are on each device; then Continue reading, a Download toggle and a More menu for rarer actions.',
	sources: [S.approvedMocks, S.wcag22],
	checks: checks({
		I: ['pass', 'No motion.'],
		II: ['pass', 'Same order on every book.'],
		III: ['pass', 'One primary action.'],
		IV: ['pass', 'Progress on both devices and when you last read.'],
		V: ['pass', 'No nudges.'],
		VI: ['pass', '“Start reading” for a new book, “Continue reading” otherwise.']
	})
};
