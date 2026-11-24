import { SuggestionsSchema } from '@longshelf/shared/ai';
import type { Book } from '@longshelf/shared/library';
import { library, LIBRARY_MODE } from '#lib/library/index.ts';
import { localSuggestions } from './local-suggestions.ts';

export type ShelfItem = { book: Book; reason: string };
export type DismissKind = 'not_now' | 'never';

/** Suggestions joined to their books. Empty when AI is off or unavailable, so the area hides. */
export async function loadSuggestions(f: typeof fetch, url: string): Promise<ShelfItem[]> {
	try {
		const local = LIBRARY_MODE === 'mirror' ? await localSuggestions(f, url, library) : null;
		let items = local;
		if (!items) {
			const r = await f(url);
			if (!r.ok) return [];
			items = SuggestionsSchema.parse(await r.json()).items;
		}
		const found = await Promise.all(
			items.map(async ({ bookId, reason }) => {
				const page = await library.book(bookId);
				return page ? [{ book: page.book, reason }] : [];
			})
		);
		return found.flat();
	} catch {
		return [];
	}
}

async function send(method: 'POST' | 'DELETE', body: object): Promise<boolean> {
	try {
		const r = await fetch('/api/ai/dismiss', {
			method,
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body)
		});
		return r.ok;
	} catch {
		return false;
	}
}

export const dismissBook = (bookId: string, kind: DismissKind) => send('POST', { bookId, kind });
export const undoDismissBook = (bookId: string) => send('DELETE', { bookId });
