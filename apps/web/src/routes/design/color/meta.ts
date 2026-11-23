import type { CatalogueMeta } from '@longshelf/shared/design/meta';
import { S } from '@longshelf/shared/design/sources';
import { byGroup } from '@longshelf/shared/tokens';
import { checks, sourcesOf } from '#lib/catalogue/meta-helpers.ts';

export const meta: CatalogueMeta = {
	id: 'color',
	title: 'Colour',
	kind: 'token',
	order: 10,
	rationale:
		'Warm, low-saturation neutrals with one muted blue-green accent. Light is the default when your system has no preference, because dark text on a light background measured slightly better for reading; the difference is small, so dark follows your system setting. The light background is off-white, never pure white, and dark mode is dark grey, not black. Body text sits around 11–12:1: far above the 4.5:1 minimum, short of maximum glare. Meaning never relies on colour alone.',
	sources: sourcesOf(byGroup('color'), [S.wcag22, S.mq5]),
	checks: checks({
		I: ['pass', 'No pure white, no saturated areas, one accent hue (tested).'],
		II: ['pass', 'Each colour has one job and one name, used the same way everywhere.'],
		III: ['pass', 'One accent per view keeps the primary action obvious.'],
		IV: ['n/a', 'Colour holds no state.'],
		V: ['pass', 'No red alerts or urgency colours; errors use words and an icon.'],
		VI: ['pass', 'Colour is never the only carrier of meaning.']
	})
};
