import type { CatalogueMeta } from '@ribbon/shared/design/meta';
import { S } from '@ribbon/shared/design/sources';
import { checks } from '#lib/catalogue/meta-helpers.ts';

export const meta: CatalogueMeta = {
	id: 'text-panel',
	title: 'Text settings',
	kind: 'component',
	order: 310,
	rationale:
		'The reader’s one settings panel: size, font (Literata or Atkinson Hyperlegible), line spacing, margins, scroll or turn pages, and theme (Match system, Paper, Night). Changes apply at once and to every book on this device. It opens from the side and keeps focus inside until closed.',
	sources: [S.approvedMocks, S.wcag22],
	checks: checks({
		I: ['pass', 'Changes apply in place; no animation.'],
		II: ['pass', 'Every setting uses the same control.'],
		III: ['pass', 'One panel for all text settings.'],
		IV: ['pass', 'Settings are remembered on this device.'],
		V: ['pass', 'No suggested “optimal” settings.'],
		VI: ['pass', 'Plain labels.'],
		VII: [
			'pass',
			'You set size, font, spacing, margins, page mode and theme yourself; nothing is fixed.'
		]
	})
};
