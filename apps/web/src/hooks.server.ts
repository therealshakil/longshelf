import type { Handle } from '@sveltejs/kit/hooks';
import { dev } from '$app/env';
import { env } from 'cloudflare:workers';
import localCalibre from 'virtual:longshelf/calibre';
import { accessConfig, devIdentity, identityOf } from '#lib/server/mirror/access.ts';
import { allowed, refusal, ROBOTS } from '#lib/server/mirror/gate.ts';

/**
 * Every request needs the owner's Access sign-in, or the CLI's service token for /api/ingest/*
 * (spec 003 FR-015, FR-017). Fails closed: no valid Access token means 403, so turning Access
 * off by mistake exposes nothing (SC-004). Nothing is indexed (FR-018).
 * With a local Calibre library, AI stays off so no book data leaves this machine (DR-0009).
 */
export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;
	if (localCalibre && path.startsWith('/api/ai/'))
		return new Response('AI is off when running against a local Calibre library.', {
			status: 404
		});

	const vars = env as unknown as Partial<Record<string, unknown>>;
	const local = devIdentity(event.url, dev, vars);
	const who = local ?? (await identityOf(event.request, accessConfig(vars)));
	if (!allowed(path, who, Boolean(local))) return refusal();
	event.locals.identity = who;

	const response = await resolve(event);
	response.headers.set('x-robots-tag', ROBOTS);
	return response;
};
