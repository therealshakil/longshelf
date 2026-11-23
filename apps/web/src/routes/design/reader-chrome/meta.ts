import type { CatalogueMeta } from '@longshelf/shared/design/meta';
import { S } from '@longshelf/shared/design/sources';
import { checks } from '#lib/catalogue/meta-helpers.ts';

export const meta: CatalogueMeta = {
	id: 'reader-chrome',
	title: 'Reader bars',
	kind: 'component',
	order: 340,
	rationale:
		'The reader’s two thin bars. Top: back, title and chapter, Contents, text settings and bookmark. Bottom: a full-width progress line with a tick for the other device, the percentage, minutes left in the chapter and Story so far. A tap in the middle of the page hides both.',
	sources: [S.approvedMocks, S.wcag22],
	checks: checks({
		I: ['pass', 'The bars slide only when you tap, and not at all with reduced motion.'],
		II: ['pass', 'Same bars in every book.'],
		III: ['pass', 'Hidden while you read.'],
		IV: ['pass', 'Shows where you are and where the other device is.'],
		V: ['pass', 'Minutes left is information, not a goal.'],
		VI: ['pass', 'Plain labels.']
	})
};
