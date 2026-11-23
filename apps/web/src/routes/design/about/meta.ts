import type { CatalogueMeta } from '@longshelf/shared/design/meta';
import { S } from '@longshelf/shared/design/sources';

export const meta: CatalogueMeta = {
	id: 'about',
	title: 'How to read this catalogue',
	kind: 'guide',
	order: 0,
	rationale:
		'The catalogue is built into the app, so what you review is what ships. Each page shows every state of one element at once, with no controls to toggle. Pages are reviewed in the light or dark theme your system uses.',
	sources: [S.calmDs, S.coga],
	checks: [
		{
			principle: 'I',
			result: 'pass',
			reason: 'Nothing moves or makes sound; muted colours, one accent.'
		},
		{
			principle: 'II',
			result: 'pass',
			reason: 'The index sits in the same place on every page, with fixed names and order.'
		},
		{
			principle: 'III',
			result: 'pass',
			reason: 'One element per page; detail comes after the examples, under headings.'
		},
		{
			principle: 'IV',
			result: 'pass',
			reason: 'Returning to the catalogue opens the last page you were on.'
		},
		{ principle: 'V', result: 'pass', reason: 'No counts, badges or progress pressure.' },
		{ principle: 'VI', result: 'pass', reason: 'Headings and labels say literally what they are.' },
		{
			principle: 'VII',
			result: 'deferred',
			reason:
				'Appearance settings are deferred (scope change 2026-11-14). System light/dark, reduced motion and browser zoom are honoured.'
		}
	]
};
