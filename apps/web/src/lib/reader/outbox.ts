/**
 * Sending this device's places to the mirror (spec 004 FR-010, contracts/progress-api.md).
 * Nothing is queued separately: a place is pending while `readAt > syncedAt`, so a place read
 * offline, or with the app closed before sending, is simply sent next time. At most one send is
 * in flight; a change while reading sends 10 s later.
 */
import {
	MAX_PLACES_PER_PUT,
	ProgressPutResultSchema,
	type Place
} from '@longshelf/shared/progress';
import { thisDevice } from '#lib/offline/device.ts';
import { allPlaces, isPending, markSynced, type SavedPlace } from './settings.ts';

export const DEBOUNCE_MS = 10_000;

/** How the last send went. `sign-in` and `offline` keep everything pending. */
export type SendResult = 'sent' | 'nothing' | 'sign-in' | 'offline' | 'error';

/** Places this device hasn't had confirmed by the mirror, one per book. */
export function pendingPlaces(): { bookId: string; place: SavedPlace }[] {
	return [...allPlaces()]
		.filter(([, place]) => isPending(place))
		.map(([bookId, place]) => ({ bookId, place }));
}

/** A saved place as the mirror takes it. The web reader has no chapter fraction: it sends 0. */
export function toWire(bookId: string, p: SavedPlace, device = thisDevice()): Place {
	const clamp = (n: number) => Math.min(100, Math.max(0, n));
	const percent = clamp(p.percent);
	return {
		bookId,
		deviceId: device.id,
		deviceName: device.name,
		percent,
		chapterLabel: p.chapterLabel.slice(0, 200),
		href: p.href.slice(0, 500),
		fraction: 0,
		...(p.cfi && p.cfi.length <= 1000 ? { cfi: p.cfi } : {}),
		...(p.fileSha256 ? { fileSha256: p.fileSha256 } : {}),
		furthestPercent: Math.max(percent, clamp(p.furthestPercent)),
		furthestHref: p.furthestHref.slice(0, 500),
		readAt: p.readAt
	};
}

const listeners = new Set<(r: SendResult) => void>();
/** Hear how each send went (the header shows "Sign in again" on `sign-in`). */
export function onSendResult(fn: (r: SendResult) => void): () => void {
	listeners.add(fn);
	return () => listeners.delete(fn);
}

let inFlight: Promise<SendResult> | null = null;

/** Send every pending place now. A second call while one is sending waits for that one. */
export function flush(opts: { keepalive?: boolean; fetch?: typeof fetch } = {}) {
	inFlight ??= send(opts).finally(() => (inFlight = null));
	return inFlight;
}

async function send({ keepalive = false, fetch: f = fetch }): Promise<SendResult> {
	const pending = pendingPlaces();
	if (!pending.length) return report('nothing');
	const device = thisDevice();
	let result: SendResult = 'sent';
	for (let i = 0; i < pending.length; i += MAX_PLACES_PER_PUT) {
		const places = pending
			.slice(i, i + MAX_PLACES_PER_PUT)
			.map(({ bookId, place }) => toWire(bookId, place, device));
		let res: Response;
		try {
			res = await f('/api/progress', {
				method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ places }),
				redirect: 'manual',
				keepalive
			});
		} catch {
			return report('offline');
		}
		if (
			res.type === 'opaqueredirect' ||
			res.status === 403 ||
			(res.status >= 300 && res.status < 400)
		)
			return report('sign-in');
		if (!res.ok) {
			result = 'error';
			continue;
		}
		const parsed = ProgressPutResultSchema.safeParse(await res.json().catch(() => null));
		if (!parsed.success) {
			result = 'error';
			continue;
		}
		// Accepted or stale, the mirror now holds this place or a newer one.
		const sent = new Map(places.map((p) => [p.bookId, p.readAt]));
		for (const k of [...parsed.data.accepted, ...parsed.data.stale])
			if (k.deviceId === device.id && sent.has(k.bookId)) markSynced(k.bookId, sent.get(k.bookId)!);
	}
	return report(result);
}

function report(r: SendResult): SendResult {
	for (const fn of listeners) fn(r);
	return r;
}

let timer: ReturnType<typeof setTimeout> | null = null;

/** Send 10 s after the last change, so turning pages doesn't send on every page. */
export function queueSend(opts: { fetch?: typeof fetch } = {}) {
	if (timer) clearTimeout(timer);
	timer = setTimeout(() => {
		timer = null;
		void flush(opts);
	}, DEBOUNCE_MS);
}

/** Send now instead of waiting for the debounce (the page is being hidden). */
export function flushNow(opts: { keepalive?: boolean; fetch?: typeof fetch } = {}) {
	if (timer) clearTimeout(timer);
	timer = null;
	return flush(opts);
}
