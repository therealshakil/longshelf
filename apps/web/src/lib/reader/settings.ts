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

/** Saved place per book on this device. */
const placeKey = (bookId: string) => `longshelf.reader.place.${bookId}`;

export interface SavedPlace {
	cfi: string;
	fraction: number;
	chapterLabel: string;
	savedAt: string;
}

export function loadPlace(bookId: string): SavedPlace | null {
	try {
		const raw = localStorage.getItem(placeKey(bookId));
		return raw ? (JSON.parse(raw) as SavedPlace) : null;
	} catch {
		return null;
	}
}

export function savePlace(bookId: string, place: SavedPlace): void {
	try {
		localStorage.setItem(placeKey(bookId), JSON.stringify(place));
	} catch {
		// Storage unavailable: the place is kept for this visit only.
	}
}
