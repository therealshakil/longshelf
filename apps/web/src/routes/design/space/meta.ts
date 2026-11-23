import type { CatalogueMeta } from '@longshelf/shared/design/meta';
import { S } from '@longshelf/shared/design/sources';
import { byGroup } from '@longshelf/shared/tokens';
import { checks, sourcesOf } from '#lib/catalogue/meta-helpers.ts';

export const meta: CatalogueMeta = {
	id: 'space',
	title: 'Space',
	kind: 'token',
	order: 30,
	rationale:
		'One spacing scale on a 4px (0.25rem) step, the same as Tailwind’s, so `p-4` is always `space-4`. Space is generous between groups and tighter inside them, so related things look related and screens feel uncluttered. Steps are in rem and grow with text size.',
	sources: sourcesOf(byGroup('space'), [S.homeOffice]),
	checks: checks({
		I: ['pass', 'Generous spacing lowers visual density and clutter.'],
		II: ['pass', 'One scale used everywhere, so layouts repeat predictably.'],
		III: ['pass', 'Larger gaps between groups make each group read as one thing.'],
		IV: ['n/a', 'Spacing holds no state.'],
		V: ['n/a', 'Spacing applies no pressure either way.'],
		VI: ['n/a', 'Spacing carries no words.']
	})
};
