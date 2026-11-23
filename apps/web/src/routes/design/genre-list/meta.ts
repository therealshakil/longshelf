import type { CatalogueMeta } from '@longshelf/shared/design/meta';
import { S } from '@longshelf/shared/design/sources';
import { checks } from '#lib/catalogue/meta-helpers.ts';

export const meta: CatalogueMeta = {
	id: 'genre-list',
	title: 'Genre list',
	kind: 'component',
	order: 440,
	rationale:
		'Genres in three columns with their counts and how many are still AI suggestions. Opens the genre’s shelf.',
	sources: [S.approvedMocks, S.wcag22],
	checks: checks({
		I: ['pass', 'Plain list.'],
		II: ['pass', 'Same layout for every genre.'],
		III: ['pass', 'Name, count and one status line.'],
		IV: ['pass', 'Shows which genres you have kept.'],
		V: ['pass', 'Suggestions are optional.'],
		VI: ['pass', '“12 in Calibre · 29 suggested”.']
	})
};
