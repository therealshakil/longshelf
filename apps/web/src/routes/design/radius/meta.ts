import type { CatalogueMeta } from '@ribbon/shared/design/meta';
import { byGroup } from '@ribbon/shared/tokens';
import { checks, sourcesOf } from '#lib/catalogue/meta-helpers.ts';

export const meta: CatalogueMeta = {
	id: 'radius',
	title: 'Corners',
	kind: 'token',
	order: 40,
	rationale:
		'Two corner sizes: small for controls, medium for cards and dialogs. Gently rounded, so things look soft but still clearly shaped. This is an aesthetic choice with no research behind it, so it is marked ASSUMPTION for the owner to judge.',
	sources: sourcesOf(byGroup('radius')),
	checks: checks({
		I: ['pass', 'No sharp, high-contrast edges competing for attention.'],
		II: ['pass', 'Controls always use one radius, containers the other.'],
		III: ['n/a', 'Corners do not affect how many decisions a view asks for.'],
		IV: ['n/a', 'Corners hold no state.'],
		V: ['n/a', 'Corners apply no pressure either way.'],
		VI: ['n/a', 'Corners carry no words.']
	})
};
