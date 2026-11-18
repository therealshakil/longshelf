import type { CatalogueMeta } from '@ribbon/shared/design/meta';
import { S } from '@ribbon/shared/design/sources';
import { checks } from '#lib/catalogue/meta-helpers.ts';

export const meta: CatalogueMeta = {
	id: 'periodical-row',
	title: 'Periodical row',
	kind: 'component',
	order: 270,
	rationale:
		'News and magazine issues fetched by Calibre, as plain bindings with the publication and date, newest first. Unopened issues are marked New. They have their own place so they never bury your books.',
	sources: [S.approvedMocks, S.wcag22],
	checks: checks({
		I: ['pass', 'Plain bindings; no images or motion.'],
		II: ['pass', 'Newest first, always.'],
		III: ['pass', 'One row per publication.'],
		IV: ['pass', 'New and read issues are marked.'],
		V: ['pass', 'No unread counts.'],
		VI: ['pass', 'Publication name and date only.']
	})
};
