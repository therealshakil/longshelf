import type { CatalogueMeta } from '@ribbon/shared/design/meta';
import { S } from '@ribbon/shared/design/sources';
import { byGroup } from '@ribbon/shared/tokens';
import { checks, sourcesOf } from '#lib/catalogue/meta-helpers.ts';

export const meta: CatalogueMeta = {
	id: 'size',
	title: 'Target size',
	kind: 'token',
	order: 70,
	rationale:
		'Anything you can press is at least 44px tall and wide at default zoom (WCAG’s stricter AAA target size), so it is easy to hit on a phone and hard to miss. Small text links inside paragraphs are the exception WCAG allows.',
	sources: sourcesOf(byGroup('size'), [S.homeOffice]),
	checks: checks({
		I: ['n/a', 'Target size does not affect sensory load.'],
		II: ['pass', 'Every control has the same minimum size, so hitting it never needs care.'],
		III: ['n/a', 'Target size does not affect how many decisions a view asks for.'],
		IV: ['n/a', 'Target size holds no state.'],
		V: ['pass', 'Large targets remove the pressure of precise tapping.'],
		VI: ['n/a', 'Target size carries no words.']
	})
};
