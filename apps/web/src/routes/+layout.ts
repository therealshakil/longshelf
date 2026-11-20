import { library } from '#lib/library/index.ts';
import type { LayoutLoad } from './$types';

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
