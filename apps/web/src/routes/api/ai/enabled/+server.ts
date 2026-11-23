import { error, json } from '@sveltejs/kit';
import { SetEnabledSchema } from '@longshelf/shared/ai';
import { aiEnv } from '#lib/server/ai/env.ts';
import type { RequestHandler } from './$types';

/** The owner's off switch for every AI feature (FR-016). */
export const PUT: RequestHandler = async ({ request }) => {
	const parsed = SetEnabledSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) error(400, 'Send { "enabled": true } or { "enabled": false }.');
	const { store } = aiEnv();
	await store.setSetting('enabled', String(parsed.data.enabled));
	return json({ ok: true });
};
