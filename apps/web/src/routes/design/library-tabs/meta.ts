import type { CatalogueMeta } from '@ribbon/shared/design/meta';
import { S } from '@ribbon/shared/design/sources';
import { checks } from '#lib/catalogue/meta-helpers.ts';

export const meta: CatalogueMeta = {
	id: 'library-tabs',
	title: 'Library tabs',
	kind: 'component',
	order: 400,
	rationale:
		'The Library’s six tabs, always in the same order: Recently added, Authors, Genres, Collections, News & magazines, All Books. The chosen tab is kept in the address, so Back and reload return to it. Arrow keys move between tabs.',
	sources: [S.approvedMocks, S.wcag22],
	checks: checks({
		I: ['pass', 'An underline marks the tab; nothing moves.'],
		II: ['pass', 'Fixed order, never rearranged.'],
		III: ['pass', 'One tab’s content at a time.'],
		IV: ['pass', 'The tab is remembered in the address.'],
		V: ['pass', 'No counts or badges on tabs.'],
		VI: ['pass', 'Plain names.']
	})
};
