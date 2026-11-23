import type { CatalogueMeta } from '@longshelf/shared/design/meta';
import { S } from '@longshelf/shared/design/sources';
import { byGroup, getToken } from '@longshelf/shared/tokens';
import { checks, sourcesOf } from '#lib/catalogue/meta-helpers.ts';

export const meta: CatalogueMeta = {
	id: 'focus',
	title: 'Focus',
	kind: 'token',
	order: 60,
	rationale:
		'When you move through Longshelf with a keyboard, the focused item gets a solid 3px ring in the accent hue, with a small gap around it. The ring contrasts at least 3:1 with every surface in both themes, so you can always see where you are. It meets WCAG’s stricter (AAA) focus appearance criterion, not only the minimum.',
	sources: sourcesOf([...byGroup('focus'), getToken('focus')], [S.calmDs]),
	checks: checks({
		I: ['pass', 'A steady ring, no glow or pulse.'],
		II: ['pass', 'Every control shows focus the same way.'],
		III: ['pass', 'Exactly one item is focused at a time, and it is obvious which.'],
		IV: ['pass', 'Focus stays where you left it; nothing steals it.'],
		V: ['n/a', 'Focus applies no pressure either way.'],
		VI: ['n/a', 'Focus carries no words.']
	})
};
