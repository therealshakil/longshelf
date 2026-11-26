/**
 * Places from other devices (spec 004 US2): reading them from the mirror, joining them with
 * this device's place, and choosing where a book opens (FR-009, research R6).
 */
import type { ReadingPosition } from '@longshelf/shared/library';
import { ProgressGetSchema, type Place } from '@longshelf/shared/progress';
import type { SavedPlace } from './settings.ts';

export const THIS_DEVICE = 'this-device';

/** A mirror row as a position, under its device id. */
export const fromPlace = (p: Place): ReadingPosition => ({
	bookId: p.bookId,
	source: p.deviceId,
	deviceName: p.deviceName,
	percent: p.percent,
	chapterLabel: p.chapterLabel,
	href: p.href,
	fraction: p.fraction,
	...(p.cfi ? { cfi: p.cfi } : {}),
	...(p.fileSha256 ? { fileSha256: p.fileSha256 } : {}),
	readAt: p.readAt,
	furthestHref: p.furthestHref,
	furthestPercent: p.furthestPercent
});

/** This device's saved place as a position. */
export const fromSaved = (bookId: string, s: SavedPlace): ReadingPosition => ({
	bookId,
	source: THIS_DEVICE,
	percent: s.percent,
	chapterLabel: s.chapterLabel,
	href: s.href,
	fraction: 0,
	...(s.cfi ? { cfi: s.cfi } : {}),
	...(s.fileSha256 ? { fileSha256: s.fileSha256 } : {}),
	readAt: s.readAt,
	furthestHref: s.furthestHref,
	furthestPercent: Math.max(s.furthestPercent, s.percent)
});

/**
 * A book's positions: this device first (its local place, or its mirror row if storage was
 * cleared), then other devices, most recently read first.
 */
export function mergePositions(
	bookId: string,
	rows: Place[],
	local: SavedPlace | null,
	deviceId: string
): ReadingPosition[] {
	const mine = rows.filter((r) => r.bookId === bookId);
	const own = mine.find((r) => r.deviceId === deviceId);
	const others = mine
		.filter((r) => r.deviceId !== deviceId)
		.map(fromPlace)
		.sort((a, b) => b.readAt.localeCompare(a.readAt));
	const here = local
		? fromSaved(bookId, local)
		: own
			? { ...fromPlace(own), source: THIS_DEVICE }
			: null;
	return here ? [here, ...others] : others;
}

/** Where the reader starts for a position: the CFI on the same file, else chapter, else percent. */
export interface Start {
	cfi?: string;
	href?: string;
	/** Through the whole book, 0–1. */
	fraction?: number;
}

export function startAt(p: ReadingPosition, fileSha256?: string): Start {
	if (p.cfi && fileSha256 && p.fileSha256 === fileSha256) return { cfi: p.cfi };
	return { ...(p.href ? { href: p.href } : {}), fraction: p.percent / 100 };
}

export type OpenChoice =
	| { kind: 'here' }
	| { kind: 'adopt'; from: ReadingPosition }
	| { kind: 'offer'; from: ReadingPosition };

/**
 * FR-009: open at a more recent place from another device if this device hasn't moved since
 * it last synced; if it has, open here and offer the other place. `here` is null when this
 * device has never read the book.
 */
export function chooseOpen(
	here: Pick<SavedPlace, 'readAt' | 'syncedAt'> | null,
	positions: ReadingPosition[]
): OpenChoice {
	const newest = positions
		.filter((p) => p.source !== THIS_DEVICE)
		.reduce<ReadingPosition | null>((a, p) => (!a || p.readAt > a.readAt ? p : a), null);
	if (!newest) return { kind: 'here' };
	if (here && Date.parse(newest.readAt) <= Date.parse(here.readAt)) return { kind: 'here' };
	const moved =
		here && (here.syncedAt === null || Date.parse(here.readAt) > Date.parse(here.syncedAt));
	return moved ? { kind: 'offer', from: newest } : { kind: 'adopt', from: newest };
}

/** The place this device keeps when it adopts another device's place: same `readAt`, synced. */
export function adoptedPlace(from: ReadingPosition, fileSha256?: string): SavedPlace {
	const sameFile = !!from.cfi && !!fileSha256 && from.fileSha256 === fileSha256;
	return {
		cfi: sameFile ? from.cfi! : '',
		fraction: from.percent / 100,
		chapterLabel: from.chapterLabel,
		savedAt: from.readAt,
		href: from.href,
		percent: from.percent,
		furthestPercent: Math.max(from.furthestPercent, from.percent),
		furthestHref: from.furthestHref,
		...(sameFile ? { fileSha256 } : {}),
		readAt: from.readAt,
		syncedAt: from.readAt
	};
}

/** The content hash in a mirror file URL (`/api/files/<sha>`), if there is one. */
export const fileShaOf = (url: string | null | undefined) =>
	/\/api\/files\/([0-9a-f]{64})/.exec(url ?? '')?.[1];

/**
 * Every place on the mirror, or null if they can't be read now (offline with no copy, signed
 * out, or a local run with no mirror). The service worker answers offline with its last copy.
 */
export async function fetchPlaces(f: typeof fetch = fetch): Promise<Place[] | null> {
	try {
		const res = await f('/api/progress', { redirect: 'manual' });
		if (!res.ok) return null;
		const parsed = ProgressGetSchema.safeParse(await res.json());
		return parsed.success ? parsed.data.places : null;
	} catch {
		return null;
	}
}
