import type { CatalogueMeta } from '@longshelf/shared/design/meta';
import { S } from '@longshelf/shared/design/sources';
import { checks } from '#lib/catalogue/meta-helpers.ts';

export const meta: CatalogueMeta = {
	id: 'sync-status',
	title: 'Sync status',
	kind: 'component',
	order: 210,
	rationale:
		'Shows whether the library is up to date with Calibre: icon plus text, peripheral, never animated, and always in the header. On phones only the icon shows, with the full text available to screen readers.',
	sources: [S.approvedMocks, S.wcag22],
	checks: checks({
		I: ['pass', 'Never spins or pulses.'],
		II: ['pass', 'Always in the same corner of the header.'],
		III: ['pass', 'One short line.'],
		IV: ['pass', 'Says when the last sync was, so you don’t have to remember.'],
		V: ['pass', 'No urgency; “needs attention” is the strongest wording.'],
		VI: ['pass', '“Synced 4 min ago”, “Offline”.']
	})
};
