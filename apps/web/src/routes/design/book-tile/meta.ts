import type { CatalogueMeta } from '@ribbon/shared/design/meta';
import { S } from '@ribbon/shared/design/sources';
import { checks } from '#lib/catalogue/meta-helpers.ts';

export const meta: CatalogueMeta = {
	id: 'book-tile',
	title: 'Book tile',
	kind: 'component',
	order: 220,
	rationale:
		'A book in any grid: the cover at a fixed 2:3 ratio so nothing shifts while it loads, the title (two lines at most), the author, and the read status: nothing when unread, “N% read” in oxblood when in progress, “Finished” when done (FR-005). Suggestions add one line saying why.',
	sources: [S.approvedMocks, S.wcag22],
	checks: checks({
		I: ['pass', 'Soft shadow, no hover motion.'],
		II: ['pass', 'The same tile and the same status rule everywhere.'],
		III: ['pass', 'Cover, title, author, one status.'],
		IV: ['pass', 'Your progress is on every tile.'],
		V: ['pass', 'No ratings, counts or badges.'],
		VI: ['pass', '“55% read”, “Finished”.']
	})
};
