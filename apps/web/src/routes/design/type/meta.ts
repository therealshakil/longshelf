import type { CatalogueMeta } from '@longshelf/shared/design/meta';
import { byGroup } from '@longshelf/shared/tokens';
import { checks, sourcesOf } from '#lib/catalogue/meta-helpers.ts';

export const meta: CatalogueMeta = {
	id: 'type',
	title: 'Type',
	kind: 'token',
	order: 20,
	rationale:
		'Atkinson Hyperlegible Next for the interface: its letters are designed not to be confused with one another. Literata for long reading. So-called dyslexia fonts were not used: two controlled studies found no gain in speed or accuracy. Body text is 16px at default zoom with 1.5 line height. Prose lines stop at about 66 characters. Emphasis uses weight, not italics or underline. All sizes are in rem, so browser zoom and text size settings work everywhere.',
	sources: sourcesOf(byGroup('type')),
	checks: checks({
		I: ['pass', 'Moderate contrast, no thin weights for body text, no flashing or motion.'],
		II: ['pass', 'Five sizes, each with one job; headings look the same on every page.'],
		III: ['pass', 'Short line length and clear heading steps break text into readable pieces.'],
		IV: ['n/a', 'Type holds no state.'],
		V: ['n/a', 'Type applies no pressure either way.'],
		VI: ['pass', 'Unambiguous letterforms support reading words exactly as written.']
	})
};
