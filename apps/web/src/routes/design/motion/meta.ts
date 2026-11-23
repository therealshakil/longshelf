import type { CatalogueMeta } from '@longshelf/shared/design/meta';
import { byGroup } from '@longshelf/shared/tokens';
import { checks, sourcesOf } from '#lib/catalogue/meta-helpers.ts';

export const meta: CatalogueMeta = {
	id: 'motion',
	title: 'Motion',
	kind: 'token',
	order: 50,
	rationale:
		'Longshelf does not animate. Panels open, pages change and status updates instantly, then stay still. There is no sound. A global rule removes transitions and animations from every element, including third-party components, so nothing can move by accident. Your system’s reduced-motion setting is also respected.',
	sources: sourcesOf(byGroup('motion')),
	checks: checks({
		I: ['pass', 'Nothing moves, flashes or makes sound; enforced by a global rule and a test.'],
		II: ['pass', 'Nothing slides or reflows on its own.'],
		III: ['pass', 'No movement competing for attention with the one thing on screen.'],
		IV: ['n/a', 'Motion holds no state.'],
		V: ['pass', 'No pulsing, spinning or countdown animations.'],
		VI: ['n/a', 'Motion carries no words.']
	})
};
