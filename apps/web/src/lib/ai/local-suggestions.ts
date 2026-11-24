/**
 * Read next and More like this computed in the browser on the catalogue it already holds
 * (spec 003 T027): the Worker on the Free plan can't score a whole library within 10 ms of CPU.
 * The server sends only stored matches and dismissals (/api/ai/suggestion-data).
 */
import type { LibrarySource } from '@longshelf/shared/library';
import {
	moreLike,
	readNext,
	readNextSeeds,
	type Suggestion,
	type SuggestItem
} from '#lib/ai/suggest.ts';

interface SuggestionData {
	neighbours: Record<string, [string, number][]>;
	copies: Record<string, string[]>;
	dismissed: string[];
}

/** `/api/ai/read-next` or `/api/ai/more-like/<id>` answered locally. Null for any other URL. */
export async function localSuggestions(
	f: typeof fetch,
	url: string,
	library: LibrarySource
): Promise<Suggestion[] | null> {
	const more = /^\/api\/ai\/more-like\/([^/?]+)$/.exec(url);
	if (url !== '/api/ai/read-next' && !more) return null;
	const books = await library.allBooks();
	const items: SuggestItem[] = await Promise.all(
		books.map(async (book) => {
			const [status, positions] = await Promise.all([
				library.status(book.id),
				library.positions(book.id)
			]);
			const lastReadAt = positions
				.map((p) => p.readAt)
				.sort()
				.at(-1);
			return { book, status, lastReadAt };
		})
	);
	const target = more ? decodeURIComponent(more[1]) : null;
	if (target && !items.some((i) => i.book.id === target)) return [];
	const seeds = target ? [target] : readNextSeeds(items);
	const r = await f(`/api/ai/suggestion-data?seeds=${encodeURIComponent(seeds.join(','))}`);
	if (!r.ok) throw new Error(`suggestion data: ${r.status}`);
	const data = (await r.json()) as SuggestionData;
	for (const item of items) {
		const copies = data.copies[item.book.id];
		if (copies) item.copies = copies;
		const n = data.neighbours[item.book.id];
		if (n) item.neighbours = n.map(([id, score]) => ({ id, score }));
	}
	const dismissed = new Set(data.dismissed);
	return target ? moreLike(target, items, dismissed) : readNext(items, dismissed);
}
