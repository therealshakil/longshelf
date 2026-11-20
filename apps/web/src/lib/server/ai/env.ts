import { env } from 'cloudflare:workers';
import { error } from '@sveltejs/kit';
import { d1Store, type GuardStore } from './guard.ts';

/**
 * The AI bindings (research R3). SvelteKit 3 exposes Cloudflare bindings through
 * `cloudflare:workers`, emulated locally in dev. Without a database, AI counts as offline.
 */
export function aiEnv(): { db: D1Database; ai: Ai | null; store: GuardStore } {
	const e = env as Partial<Env>;
	if (!e.DB) error(503, JSON.stringify({ reason: 'offline' }));
	return { db: e.DB, ai: e.AI ?? null, store: d1Store(e.DB) };
}
