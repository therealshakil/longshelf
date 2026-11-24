/**
 * Which caller may reach which path (spec 003 FR-015, FR-017). Kept apart from the hook so it
 * can be tested without the Worker runtime.
 */
import type { Identity } from './access.ts';

export const ROBOTS = 'noindex, nofollow';

/** True when this caller may reach this path. Local runs (dev, e2e preview) may reach anything. */
export function allowed(path: string, who: Identity | null, local: boolean): boolean {
	if (local) return true;
	if (!who) return false;
	return path.startsWith('/api/ingest/') ? who.kind === 'cli' : who.kind === 'owner';
}

/** The refusal: plain text, no library data. */
export const refusal = () =>
	new Response('Sign in to Longshelf to continue.', {
		status: 403,
		headers: { 'content-type': 'text/plain; charset=utf-8', 'x-robots-tag': ROBOTS }
	});
