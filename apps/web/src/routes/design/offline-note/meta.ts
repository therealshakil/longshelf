import type { CatalogueMeta } from '@longshelf/shared/design/meta';
import { S } from '@longshelf/shared/design/sources';
import { checks } from '#lib/catalogue/meta-helpers.ts';

export const meta: CatalogueMeta = {
	id: 'offline-note',
	title: 'Offline note',
	kind: 'component',
	order: 336,
	rationale:
		'One line above the library while offline (spec 004 FR-005): says which books open now, by the ✓ on their covers, instead of leaving the owner to find out by trying. Approved mock design-mocks/offline-states.html (owner, 2026-11-25).',
	sources: [S.approvedMocks, S.wcag22],
	checks: checks({
		I: ['pass', 'Only while offline; one line, no motion.'],
		II: ['pass', 'Always above the grid.'],
		III: ['pass', 'One fact: what opens now.'],
		IV: ['pass', 'Points to the ✓ so nothing has to be remembered.'],
		V: ['pass', 'No action needed; nothing is lost.'],
		VI: ['pass', '“Offline. Books marked ✓ are on this device and open now.”']
	})
};
