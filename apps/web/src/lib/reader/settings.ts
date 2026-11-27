/**
 * Reader text settings (spec 002 FR-004): one versioned localStorage key, applied to every book on
 * this device. Storage can be unavailable (private mode); reads and writes never throw.
 */
export const SETTINGS_KEY = 'longshelf.reader.v1';

export const SIZES = [0.9375, 1, 1.125, 1.25, 1.375, 1.5, 1.75] as const; // rem
export type Font = 'literata' | 'atkinson';
export type Spacing = 'tight' | 'normal' | 'loose';
export type Margins = 'narrow' | 'medium' | 'wide';
export type PageMode = 'scroll' | 'pages';
export type ReaderTheme = 'system' | 'paper' | 'night';

export interface ReaderSettings {
	size: number; // index into SIZES
	font: Font;
	spacing: Spacing;
	margins: Margins;
	page: PageMode;
	theme: ReaderTheme;
}

export const DEFAULTS: ReaderSettings = {
	size: 3,
	font: 'literata',
	spacing: 'normal',
	margins: 'medium',
	page: 'scroll',
	theme: 'system'
};

const pick = <T extends string>(v: unknown, allowed: readonly T[], d: T): T =>
	allowed.includes(v as T) ? (v as T) : d;

export function parseSettings(raw: string | null): ReaderSettings {
	if (!raw) return { ...DEFAULTS };
	try {
		const o = JSON.parse(raw) as Partial<ReaderSettings>;
		const size =
			Number.isInteger(o.size) && o.size! >= 0 && o.size! < SIZES.length ? o.size! : DEFAULTS.size;
		return {
			size,
			font: pick(o.font, ['literata', 'atkinson'], DEFAULTS.font),
			spacing: pick(o.spacing, ['tight', 'normal', 'loose'], DEFAULTS.spacing),
			margins: pick(o.margins, ['narrow', 'medium', 'wide'], DEFAULTS.margins),
			page: pick(o.page, ['scroll', 'pages'], DEFAULTS.page),
			theme: pick(o.theme, ['system', 'paper', 'night'], DEFAULTS.theme)
		};
	} catch {
		return { ...DEFAULTS };
	}
}

export function loadSettings(): ReaderSettings {
	try {
		return parseSettings(localStorage.getItem(SETTINGS_KEY));
	} catch {
		return { ...DEFAULTS };
	}
}

export function saveSettings(s: ReaderSettings): void {
	try {
		localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
	} catch {
		// Storage unavailable: the settings still apply for this visit.
	}
}

/** Measure (characters per line) for each margin setting. */
/** In `em`, so the line stays about 60 characters at every text size. */
export const MEASURE: Record<Margins, number> = { narrow: 33, medium: 28.5, wide: 24.5 };

/** The text column in pixels, for the renderer, which sets its own column width. */
export const measurePx = (s: Pick<ReaderSettings, 'size' | 'margins'>, rootPx = 16) =>
	Math.round(MEASURE[s.margins] * SIZES[s.size] * rootPx);
export const LEADING: Record<Spacing, number> = { tight: 1.5, normal: 1.7, loose: 1.9 };

/**
 * Saved place per book on this device (spec 004 data-model.md). `readAt` is when it was read;
 * `syncedAt` is the `readAt` the mirror last confirmed, so a place with `readAt > syncedAt` (or
 * never synced) is still to send. Older entries (spec 002) are upgraded on read.
 */
export const PLACE_PREFIX = 'longshelf.reader.place.';
const placeKey = (bookId: string) => `${PLACE_PREFIX}${bookId}`;

export interface SavedPlace {
	cfi: string;
	/** Through the whole book, 0–1 (as foliate reports it). */
	fraction: number;
	chapterLabel: string;
	/** Kept for spec 002 entries; same as `readAt` for new ones. */
	savedAt: string;
	/** The chapter's document within the file. */
	href: string;
	/** 0–100 through the book. */
	percent: number;
	furthestPercent: number;
	furthestHref: string;
	/** The file the CFI belongs to (its content hash), when known. */
	fileSha256?: string;
	readAt: string;
	syncedAt: string | null;
}

/** A stored entry in its current shape, or null if unreadable. */
export function parsePlace(raw: string | null): SavedPlace | null {
	if (!raw) return null;
	try {
		const o = JSON.parse(raw) as Partial<SavedPlace>;
		if (typeof o.cfi !== 'string' || typeof o.fraction !== 'number') return null;
		const readAt = o.readAt ?? o.savedAt ?? new Date(0).toISOString();
		const percent = typeof o.percent === 'number' ? o.percent : Math.round(o.fraction * 1000) / 10;
		return {
			cfi: o.cfi,
			fraction: o.fraction,
			chapterLabel: o.chapterLabel ?? '',
			savedAt: o.savedAt ?? readAt,
			href: o.href ?? '',
			percent,
			furthestPercent: Math.max(o.furthestPercent ?? percent, percent),
			furthestHref: o.furthestHref ?? o.href ?? '',
			...(o.fileSha256 ? { fileSha256: o.fileSha256 } : {}),
			readAt,
			syncedAt: o.syncedAt ?? null
		};
	} catch {
		return null;
	}
}

export function loadPlace(bookId: string): SavedPlace | null {
	try {
		return parsePlace(localStorage.getItem(placeKey(bookId)));
	} catch {
		return null;
	}
}

/**
 * Save a place unless the stored one was read later (another tab, or a place adopted from
 * another device): nothing ever moves back. Returns whether it was written.
 */
export function savePlace(bookId: string, place: SavedPlace): boolean {
	try {
		const current = loadPlace(bookId);
		if (current && Date.parse(current.readAt) > Date.parse(place.readAt)) return false;
		localStorage.setItem(placeKey(bookId), JSON.stringify(place));
		return true;
	} catch {
		// Storage unavailable: the place is kept for this visit only.
		return false;
	}
}

/** Every saved place on this device, by book id. */
export function allPlaces(): Map<string, SavedPlace> {
	const out = new Map<string, SavedPlace>();
	try {
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (!key?.startsWith(PLACE_PREFIX)) continue;
			const place = parsePlace(localStorage.getItem(key));
			if (place) out.set(key.slice(PLACE_PREFIX.length), place);
		}
	} catch {
		// Storage unavailable: nothing saved.
	}
	return out;
}

/** True when the mirror hasn't confirmed this place yet. */
export const isPending = (p: SavedPlace) =>
	p.syncedAt === null || Date.parse(p.readAt) > Date.parse(p.syncedAt);

/** Record that the mirror holds this place, unless it has moved on since it was sent. */
export function markSynced(bookId: string, readAt: string): void {
	const current = loadPlace(bookId);
	if (!current || current.readAt !== readAt) return;
	try {
		localStorage.setItem(placeKey(bookId), JSON.stringify({ ...current, syncedAt: readAt }));
	} catch {
		// Storage unavailable: it will be sent again, which is harmless.
	}
}
