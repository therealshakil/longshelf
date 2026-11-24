import { library, LIBRARY_MODE } from '#lib/library/index.ts';
import type { LayoutLoad } from './$types';

/**
 * A deployment renders in the browser only (spec 003 research R3): the Worker never parses the
 * catalogue. The sample build keeps server rendering.
 */
export const ssr = LIBRARY_MODE !== 'mirror';

/** Whether AI features show at all (FR-016). Off when switched off or not available here. */
async function aiEnabled(f: typeof fetch): Promise<boolean> {
	try {
		const r = await f('/api/ai/usage');
		return r.ok && ((await r.json()) as { enabled: boolean }).enabled;
	} catch {
		return false;
	}
}

export const load: LayoutLoad = async ({ fetch }) => ({
	sync: await library.syncStatus(),
	ai: await aiEnabled(fetch)
});
