import { library } from '#lib/library/index.ts';
import { ALSO_READING_MAX } from '@ribbon/shared/library';
import { loadSuggestions } from '#lib/ai/suggestions.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, parent }) => {
	const { ai } = await parent();
	const [current, also, periodicals, readNext] = await Promise.all([
		library.current(),
		library.alsoReading(ALSO_READING_MAX),
		library.latestPeriodicals(),
		ai ? loadSuggestions(fetch, '/api/ai/read-next') : []
	]);
	return { current, also, periodicals, readNext };
};
