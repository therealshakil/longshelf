import { SuggestionsSchema } from '@ribbon/shared/ai';
import type { Book } from '@ribbon/shared/library';
import { library } from '#lib/library/index.ts';

export type ShelfItem = { book: Book; reason: string };
export type DismissKind = 'not_now' | 'never';

/** Suggestions joined to their books. Empty when AI is off or unavailable, so the area hides. */
export async function loadSuggestions(f: typeof fetch, url: string): Promise<ShelfItem[]> {
	try {
		const r = await f(url);
		if (!r.ok) return [];
		const { items } = SuggestionsSchema.parse(await r.json());
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
