import type { CatalogueMeta } from '@longshelf/shared/design/meta';
import { S } from '@longshelf/shared/design/sources';
import { checks } from '#lib/catalogue/meta-helpers.ts';

export const meta: CatalogueMeta = {
	id: 'story-so-far',
	title: 'Story so far',
	kind: 'component',
	order: 340,
	rationale:
		'A recap for coming back to a book after a break. The cut-off line says exactly how far it goes, the recap is set like the book, and a plain note says AI wrote it from the text up to your place. Writing, unavailable and too-early states say what is happening without alarm.',
	sources: [S.approvedMocks, S.wcag22],
	checks: checks({
		I: ['pass', 'No motion; the writing state is static lines and a sentence.'],
		II: ['pass', 'Opens from the same side every time (bottom on phones).'],
		III: ['pass', 'One recap, one primary action.'],
		IV: ['pass', 'The cut-off line says what it covers; states say what happens next.'],
		V: ['pass', 'Not now is always there; nothing nags.'],
		VI: ['pass', 'Says it is AI-written and can get details wrong.']
	})
};
