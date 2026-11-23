import type { CatalogueMeta } from '@longshelf/shared/design/meta';
import { S } from '@longshelf/shared/design/sources';
import { checks } from '#lib/catalogue/meta-helpers.ts';

export const meta: CatalogueMeta = {
	id: 'app-header',
	title: 'App header',
	kind: 'component',
	order: 200,
	rationale:
		'The header on every page except the reader: the Longshelf logo and wordmark, a Home · Library switch, the search field and the sync status. It stays in the same place on every page, so the way home and the way to the library never move. The sync status lives here, never floating over content (FR-006).',
	sources: [S.approvedMocks, S.wcag22],
	checks: checks({
		I: ['pass', 'No motion; the current page is marked by an oxblood underline and weight.'],
		II: ['pass', 'Same header, same order, on every page.'],
		III: ['pass', 'Two destinations and one search field.'],
		IV: ['pass', 'The current page is always marked.'],
		V: ['pass', 'No counts, badges or prompts.'],
		VI: ['pass', 'Plain labels: Home, Library, “Search your library”.']
	})
};
