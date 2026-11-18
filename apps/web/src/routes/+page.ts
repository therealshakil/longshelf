import { library } from '#lib/library/index.ts';
import { ALSO_READING_MAX } from '@ribbon/shared/library';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const [current, also, periodicals] = await Promise.all([
		library.current(),
		library.alsoReading(ALSO_READING_MAX),
		library.latestPeriodicals()
	]);
	return { current, also, periodicals };
};
