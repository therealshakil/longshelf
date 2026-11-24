/**
 * TEMPORARY spec 003 T003 spike. Deleted once the spike log in docs/PLAN.md is written.
 * ?t=identity  what Access tells the Worker (names only, never token values)
 * ?t=images    resize one sample cover with the Images binding
 * ?t=parse     read and parse a 670-book synthetic catalogue from R2
 * ?t=readnext  parse, then run Read next over it (CPU check, research R9)
 */
import { env } from 'cloudflare:workers';
import { json } from '@sveltejs/kit';
import { createSnapshotLibrary, type LibrarySnapshot } from '@longshelf/shared/library/snapshot';
import { readNext, readNextSeeds } from '#lib/server/ai/suggest.ts';
import { suggestItems } from '#lib/server/ai/suggestions.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const e = env as unknown as Env;
	const t = event.url.searchParams.get('t');

	if (t === 'identity') {
		const ctx = (event.platform as { ctx?: Record<string, unknown> } | undefined)?.ctx;
		const access = ctx?.access as { getIdentity?: () => Promise<unknown> } | undefined;
		let identity: unknown = null;
		try {
			identity = access?.getIdentity ? await access.getIdentity() : null;
		} catch (err) {
			identity = { error: String(err) };
		}
		const jwt = event.request.headers.get('cf-access-jwt-assertion');
		const claims = jwt ? JSON.parse(atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) : null;
		return json({
			hasCtxAccess: Boolean(access),
			ctxAccessKeys: access ? Object.keys(access) : [],
			identity,
			hasJwtHeader: Boolean(jwt),
			jwtClaimKeys: claims ? Object.keys(claims) : [],
			jwtEmail: claims?.email ?? null,
			jwtCommonName: claims?.common_name ?? null,
			jwtType: claims?.type ?? null
		});
	}

	if (t === 'images') {
		const src = await e.ASSETS.fetch(new URL('/sample/covers/jane-austen_emma.jpg', event.url));
		if (!src.ok || !src.body) return json({ ok: false, reason: `cover ${src.status}` });
		try {
			const out = await e.IMAGES.input(src.body)
				.transform({ width: 400 })
				.output({ format: 'image/webp' });
			const bytes = await out.response().arrayBuffer();
			return json({ ok: true, bytes: bytes.byteLength });
		} catch (err) {
			return json({ ok: false, reason: String(err) });
		}
	}

	if (t === 'parse' || t === 'readnext') {
		const obj = await e.BUCKET.get('spike/catalog.json');
		if (!obj) return json({ ok: false, reason: 'no spike catalogue' });
		const text = await obj.text();
		const snapshot = JSON.parse(text) as LibrarySnapshot;
		if (t === 'parse') return json({ ok: true, books: snapshot.books.length, kb: text.length >> 10 });
		const library = createSnapshotLibrary(snapshot, { fileUrl: () => null });
		const items = await suggestItems(e.DB, library, readNextSeeds);
		return json({ ok: true, books: items.length, suggestions: readNext(items).length });
	}

	return json({ tests: ['identity', 'images', 'parse', 'readnext'] });
};
