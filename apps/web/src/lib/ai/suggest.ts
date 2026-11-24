/**
 * Read next and More like this (spec 002 US5, research R6). Rules run first, then similarity
 * between book embeddings. Reasons come from templates naming the signal that chose the book, so
 * no model can misstate why it was suggested.
 */
import { titleKey, type Book, type ReadStatus } from '@longshelf/shared/library';

export const READ_NEXT_MAX = 12;
export const MORE_LIKE_MAX = 5;
const READING_LIST = 'Reading List';
/**
 * Below this, "Like X" would claim a resemblance the vectors don't show. It is the 99th percentile
 * of random book pairs in the owner's real library with `bge-m3` (2026-11-21).
 */
export const MIN_SIMILARITY = 0.62;
/** Same title and this close: another copy, even if the author is spelled differently. */
export const SAME_WORK_SIMILARITY = 0.8;
const MAX_SEEDS = 5;
/** First-pass limits, so one long rule can't fill the shelf. Spare places are refilled after. */
const FIRST_PASS = { readingList: 4, author: 3, collection: 3 };
const MAX_SIMILAR_PER_AUTHOR = 2;

export interface SuggestItem {
	book: Book;
	status: ReadStatus;
	/** When it was last read on any device. */
	lastReadAt?: string;
	/** Closest matches, best first. Loaded only for the books a request compares from. */
	neighbours?: Neighbour[];
	/** Other records of this work, found by near-identical profiles. */
	copies?: string[];
}

export interface Neighbour {
	id: string;
	score: number;
}

export interface Suggestion {
	bookId: string;
	reason: string;
}

type Candidate = { item: SuggestItem; reason: string };

export function cosine(a: Float32Array, b: Float32Array): number {
	if (a.length !== b.length || !a.length) return 0;
	let dot = 0;
	let aa = 0;
	let bb = 0;
	for (let i = 0; i < a.length; i++) {
		dot += a[i] * b[i];
		aa += a[i] * a[i];
		bb += b[i] * b[i];
	}
	return aa && bb ? dot / Math.sqrt(aa * bb) : 0;
}

/** The title without a subtitle or an edition note. */
const shortTitle = (title: string) =>
	title
		.replace(/\s*[([].*?[)\]]\s*/g, ' ')
		.split(/\s*:\s*/)[0]
		.trim() || title;

/** Keys are compared many times per request, and Worker CPU time is tight. */
function memo(fn: (s: string) => string) {
	const cache = new Map<string, string>();
	return (s: string) => {
		let value = cache.get(s);
		if (value === undefined) {
			if (cache.size >= 5000) cache.clear();
			value = fn(s);
			cache.set(s, value);
		}
		return value;
	};
}

const workKey = memo(titleKey);

/** One key for spellings of a name: "H. G Wells" and "H. G. Wells", "Wells| H. G.". */
const authorKey = memo((name) =>
	name
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.toLowerCase()
		.split(/[^\p{L}\p{N}']+/u)
		.filter((part) => part.length > 1)
		.sort()
		.join(' ')
);

/** The author of `a` who also wrote `b`, if any. */
const sharedAuthor = (a: Book, b: Book) =>
	a.authors.find((x) => b.authors.some((y) => authorKey(x.name) === authorKey(y.name)));

const firstAuthor = (book: Book) => authorKey(book.authors[0]?.name ?? '');

/**
 * Two records of one work: the same title by a shared author, or a stored copy with nearly the
 * same profile, which catches a misspelled author.
 */
function sameWork(a: SuggestItem, b: SuggestItem): boolean {
	if (a.book.id === b.book.id) return true;
	if (workKey(a.book.title) !== workKey(b.book.title)) return false;
	if (sharedAuthor(a.book, b.book)) return true;
	return Boolean(a.copies?.includes(b.book.id) || b.copies?.includes(a.book.id));
}

const byRecent = (a: SuggestItem, b: SuggestItem) =>
	(b.lastReadAt ?? '').localeCompare(a.lastReadAt ?? '');

function eligibleItems(items: SuggestItem[], dismissed: Set<string>) {
	const readByTitle = new Map<string, SuggestItem[]>();
	for (const r of items) {
		if (r.status.kind === 'unread') continue;
		const key = workKey(r.book.title);
		readByTitle.set(key, [...(readByTitle.get(key) ?? []), r]);
	}
	return items.filter(
		(i) =>
			i.status.kind === 'unread' &&
			!dismissed.has(i.book.id) &&
			!readByTitle.get(workKey(i.book.title))?.some((r) => sameWork(r, i))
	);
}

function nextInSeries(read: SuggestItem[], eligible: SuggestItem[]): Candidate[] {
	const out: Candidate[] = [];
	const seen = new Set<string>();
	for (const r of read) {
		const series = r.book.series;
		if (!series || seen.has(series.name)) continue;
		seen.add(series.name);
		const reached = Math.max(
			...read.filter((x) => x.book.series?.name === series.name).map((x) => x.book.series!.index)
		);
		const next = eligible
			.filter((i) => i.book.series?.name === series.name && i.book.series.index > reached)
			.sort((a, b) => a.book.series!.index - b.book.series!.index)[0];
		if (next) out.push({ item: next, reason: `Next in ${series.name}` });
	}
	return out;
}

function similar(seeds: SuggestItem[], eligible: SuggestItem[]): Candidate[] {
	const usable = seeds.flatMap((seed) =>
		seed.neighbours?.length
			? [{ seed, scores: new Map(seed.neighbours.map((n) => [n.id, n.score])) }]
			: []
	);
	const scored: { item: SuggestItem; score: number; seed: SuggestItem }[] = [];
	for (const item of eligible) {
		let best: { score: number; seed: SuggestItem } | null = null;
		for (const { seed, scores } of usable) {
			const score = scores.get(item.book.id);
			if (score !== undefined && (!best || score > best.score)) best = { score, seed };
		}
		if (best && best.score >= MIN_SIMILARITY) scored.push({ item, ...best });
	}
	return scored
		.sort((a, b) => b.score - a.score)
		.map((s) => ({ item: s.item, reason: `Like ${shortTitle(s.seed.book.title)}` }));
}

/** The books Read next compares from: the most recently read. */
export const readNextSeeds = (items: SuggestItem[]) =>
	items
		.filter((i) => i.status.kind !== 'unread')
		.sort(byRecent)
		.slice(0, MAX_SEEDS)
		.map((i) => i.book.id);

export function readNext(
	items: SuggestItem[],
	dismissed: Set<string> = new Set(),
	limit = READ_NEXT_MAX
): Suggestion[] {
	const eligible = eligibleItems(items, dismissed);
	const read = items.filter((i) => i.status.kind !== 'unread').sort(byRecent);
	const inProgress = read.filter((i) => i.status.kind === 'in-progress');
	const finished = read.filter((i) => i.status.kind === 'finished');

	const readingList = eligible
		.filter((i) => i.book.collection === READING_LIST)
		.sort((a, b) => b.book.addedAt.localeCompare(a.book.addedAt))
		.map((item) => ({ item, reason: 'On your Reading List' }));
	const byAuthorKey = new Map<string, { item: SuggestItem; name: string }[]>();
	for (const item of eligible)
		for (const a of item.book.authors) {
			const key = authorKey(a.name);
			byAuthorKey.set(key, [...(byAuthorKey.get(key) ?? []), { item, name: a.name }]);
		}
	const byAuthor = finished.flatMap((f) => {
		const seen = new Set<string>();
		return f.book.authors
			.flatMap((a) => byAuthorKey.get(authorKey(a.name)) ?? [])
			.filter(({ item }) => !seen.has(item.book.id) && seen.add(item.book.id))
			.sort((a, b) => eligible.indexOf(a.item) - eligible.indexOf(b.item))
			.map(({ item, name }) => ({ item, reason: `Another by ${name}` }));
	});
	const inCollection = inProgress.flatMap((p) => {
		const name = p.book.collection;
		if (!name || name === READING_LIST) return [];
		return eligible
			.filter((i) => i.book.collection === name)
			.map((item) => ({ item, reason: `In your ${name} collection` }));
	});
	const readAuthors = new Set(read.flatMap((r) => r.book.authors.map((a) => authorKey(a.name))));
	// Authors already read have their own rule, so similarity is for finding someone new.
	const like = similar(
		read.slice(0, MAX_SEEDS),
		eligible.filter((i) => !i.book.authors.some((a) => readAuthors.has(authorKey(a.name))))
	);
	const rules: { list: Candidate[]; cap: number; perAuthor?: number }[] = [
		{ list: nextInSeries(read, eligible), cap: limit },
		{ list: readingList, cap: FIRST_PASS.readingList },
		{ list: byAuthor, cap: FIRST_PASS.author, perAuthor: 1 },
		{ list: inCollection, cap: FIRST_PASS.collection },
		{ list: like, cap: limit, perAuthor: MAX_SIMILAR_PER_AUTHOR }
	];

	const out: Candidate[] = [];
	const add = (c: Candidate) => {
		if (out.length >= limit || out.some((x) => sameWork(x.item, c.item))) return false;
		out.push(c);
		return true;
	};
	for (const { list, cap, perAuthor } of rules) {
		let taken = 0;
		const authors = new Map<string, number>();
		for (const c of list) {
			if (taken >= cap) break;
			const author = firstAuthor(c.item.book);
			if (perAuthor && (authors.get(author) ?? 0) >= perAuthor) continue;
			if (add(c)) {
				taken++;
				authors.set(author, (authors.get(author) ?? 0) + 1);
			}
		}
	}
	// Refill spare places from the same rules, in order, without the first-pass limits.
	for (const { list } of rules) for (const c of list) add(c);
	return out.map((c) => ({ bookId: c.item.book.id, reason: c.reason }));
}

export function moreLike(
	bookId: string,
	items: SuggestItem[],
	dismissed: Set<string> = new Set(),
	limit = MORE_LIKE_MAX
): Suggestion[] {
	const source = items.find((i) => i.book.id === bookId);
	if (!source?.neighbours?.length) return [];
	const out: Candidate[] = [];
	const perAuthor = new Map<string, number>();
	const candidates = eligibleItems(items, dismissed).filter((i) => !sameWork(i, source));
	for (const c of similar([source], candidates)) {
		if (out.length >= limit) break;
		if (out.some((x) => sameWork(x.item, c.item))) continue;
		const author = firstAuthor(c.item.book);
		if ((perAuthor.get(author) ?? 0) >= MAX_SIMILAR_PER_AUTHOR) continue;
		perAuthor.set(author, (perAuthor.get(author) ?? 0) + 1);
		const shared = sharedAuthor(c.item.book, source.book);
		out.push({ item: c.item, reason: shared ? `Another by ${shared.name}` : c.reason });
	}
	return out.map((c) => ({ bookId: c.item.book.id, reason: c.reason }));
}
