import { json } from '@sveltejs/kit';
import type { Usage } from '@longshelf/shared/ai';
import { aiEnv } from '#lib/server/ai/env.ts';
import { ceiling, isEnabled, utcDay } from '#lib/server/ai/guard.ts';
import type { RequestHandler } from './$types';

/** Operator view: today's estimated use against the ceiling, and whether AI is on. */
export const GET: RequestHandler = async () => {
	const { store } = aiEnv();
	const used = await store.usage(utcDay());
	const body: Usage = {
		today: {
			neuronsEst: Math.round(used.neuronsEst),
			calls: used.calls,
			ceiling: await ceiling(store)
		},
		enabled: await isEnabled(store)
	};
	return json(body);
};
