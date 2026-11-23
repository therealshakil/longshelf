/**
 * Chapters of an open book, as flattened contents entries. An entry's position in this list is
 * its `ordinal`, which is the recap cut-off (spec 002 US4).
 */
import type { FoliateView, TocItem } from './foliate.d.ts';

export type FoliateBook = FoliateView['book'];
export interface Chapter {
	href: string;
	label: string;
}

export const flattenToc = (items: TocItem[]): Chapter[] =>
	items.flatMap((i) => [{ href: i.href, label: i.label.trim() }, ...flattenToc(i.subitems ?? [])]);

const ROMAN: Record<string, number> = { i: 1, v: 5, x: 10, l: 50, c: 100, d: 500, m: 1000 };

function fromRoman(text: string): number {
	const values = [...text.toLowerCase()].map((c) => ROMAN[c]);
	return values.reduce((sum, v, i) => sum + (v < (values[i + 1] ?? 0) ? -v : v), 0);
}

/** Contents labels are often shouted: "CHAPTER XL." reads as "Chapter 40". */
function tidyLabel(label: string): string {
	const text = label.trim().replace(/[.:]$/, '');
	const chapter = text.match(/^chapter\s+([ivxlcdm]+)$/i);
	if (chapter) return `Chapter ${fromRoman(chapter[1])}`;
	if (/\p{Ll}/u.test(text)) return text;
	return text
		.split(/\s+/)
		.map((word) =>
			/^[IVXLCDM]+$/.test(word) ? word : word.charAt(0) + word.slice(1).toLowerCase()
		)
		.join(' ');
}

/** The reader's place: "Book IV · Chapter 40", or the chapter alone when it has no book or part. */
export function placeLabel(toc: TocItem[], item: { href: string; label: string }): string {
	const parent = toc.find((t) => t.subitems?.some((s) => s.href === item.href));
	const part = parent?.label.trim().match(/^(book|part|volume)\s+([ivxlcdm]+|\d+)\b/i);
	const chapter = tidyLabel(item.label);
	if (!part) return chapter;
	const kind = part[1].charAt(0).toUpperCase() + part[1].slice(1).toLowerCase();
	return `${kind} ${part[2].toUpperCase()} · ${chapter}`;
}

/** Open a book without displaying it. */
export async function openBook(src: string): Promise<FoliateBook> {
	// Untyped vendor module; the parts Longshelf uses are typed in ./foliate.d.ts.
	const { makeBook } = (await import('../../../../../vendor/foliate-js/view.js')) as unknown as {
		makeBook(file: string | Blob): Promise<FoliateBook>;
	};
	return makeBook(src);
}

/** The text of contents entry `ordinal`: from its anchor up to the next entry's anchor. */
export async function chapterText(
	book: FoliateBook,
	chapters: Chapter[],
	ordinal: number,
	/** Reuses parsed sections when reading many chapters; one file can hold dozens of them. */
	docs?: Map<number, Promise<Document>>
): Promise<string> {
	const here = book.resolveHref?.(chapters[ordinal].href);
	if (!here) return '';
	let parsed = docs?.get(here.index);
	if (!parsed) {
		parsed = book.sections[here.index].createDocument();
		docs?.set(here.index, parsed);
	}
	const doc = await parsed;
	const range = doc.createRange();
	const start = here.anchor(doc);
	if (start instanceof Element) range.setStartBefore(start);
	else range.setStart(doc.body, 0);
	range.setEndAfter(doc.body.lastChild ?? doc.body);
	const next = chapters[ordinal + 1] && book.resolveHref?.(chapters[ordinal + 1].href);
	if (next && next.index === here.index) {
		const end = next.anchor(doc);
		if (end instanceof Element) range.setEndBefore(end);
	}
	return range.toString().replace(/\s+/g, ' ').trim();
}

/**
 * The ordinal of a saved place, or undefined if it can't be placed. Undefined means no chapter
 * is summarised on demand: guessing could send text from beyond the owner's place (FR-011).
 */
export function placeOrdinal(
	chapters: Chapter[],
	place: { href: string; label: string },
	sectionOf: (href: string) => number | undefined
): number | undefined {
	const exact = chapters.findIndex((c) => c.href === place.href);
	if (exact >= 0) return exact;
	const section = sectionOf(place.href);
	if (section !== undefined) {
		const at = chapters.findIndex((c) => (sectionOf(c.href) ?? -1) >= section);
		return at >= 0 ? at : chapters.length;
	}
	const named = chapters.filter((c) => c.label === place.label.trim());
	return named.length === 1 ? chapters.indexOf(named[0]) : undefined;
}
