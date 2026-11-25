import type { CatalogueMeta } from '@longshelf/shared/design/meta';
import { S } from '@longshelf/shared/design/sources';
import { checks } from '#lib/catalogue/meta-helpers.ts';

export const meta: CatalogueMeta = {
	id: 'download-button',
	title: 'Download button',
	kind: 'component',
	order: 335,
	rationale:
		'Keeps a book on this device for reading offline (spec 004 US1). One quiet outline button beside Continue reading; its states follow the approved mock design-mocks/offline-states.html (owner, 2026-11-25). Removing is in the More menu.',
	sources: [S.approvedMocks, S.wcag22],
	checks: checks({
		I: ['pass', 'Outline button; a thin bar while downloading, no motion.'],
		II: ['pass', 'Always beside Continue reading.'],
		III: ['pass', 'One action per state.'],
		IV: ['pass', 'Says when a copy is on this device and opens offline.'],
		V: ['pass', 'Cancel at any time; a failed download leaves nothing behind.'],
		VI: ['pass', '“Not enough space on this device. It needs 9.1 MB.”']
	})
};
