import type { CatalogueMeta } from '@ribbon/shared/design/meta';
import { S } from '@ribbon/shared/design/sources';
import { checks } from '#lib/catalogue/meta-helpers.ts';

export const meta: CatalogueMeta = {
	id: 'search-results',
	title: 'Search results',
	kind: 'component',
	order: 270,
	rationale:
		'One plain list of matching books. Each row is one link, with the cover, title, author and a short note saying which details matched.',
	sources: [S.approvedMocks, S.wcag22],
	checks: checks({
		I: ['pass', 'Hairline rows with no motion.'],
		II: ['pass', 'Every result has the same parts in the same places.'],
		III: ['pass', 'One list and one target per book.'],
		IV: ['pass', 'Your search stays in the header.'],
		V: ['pass', 'No scores, promotion or pressure.'],
		VI: ['pass', '“Title matches”, “Author matches”.']
	})
};
