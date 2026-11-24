/**
 * Book data for server code (spec 003 T027). In a deployment it reads D1 `book` rows, because the
 * browser's library loads /api/catalog, which a Worker can't fetch from itself. Elsewhere (sample,
 * local Calibre) it is the shared `library`. Only what the AI routes use: `book` and `allBooks`.
 */
import { env } from 'cloudflare:workers';
import type { Book, BookPage } from '@longshelf/shared/library';
import { bookSortKey } from '@longshelf/shared/library';
import { library, LIBRARY_MODE } from '#lib/library/index.ts';

export interface ServerLibrary {
	book(id: string): Promise<Pick<BookPage, 'book'> | null>;
	allBooks(): Promise<Book[]>;
}

export function d1Library(db: D1Database): ServerLibrary {
	return {
		async book(id) {
			const row = await db
				.prepare('SELECT metadata FROM book WHERE id = ?')
				.bind(id)
				.first<{ metadata: string }>();
			return row ? { book: JSON.parse(row.metadata) as Book } : null;
		},
		async allBooks() {
			const { results } = await db
				.prepare('SELECT metadata FROM book WHERE is_news = 0')
				.all<{ metadata: string }>();
			return results
				.map((r) => JSON.parse(r.metadata) as Book)
				.sort((a, b) => bookSortKey(a).localeCompare(bookSortKey(b)));
		}
	};
}

export function serverLibrary(): ServerLibrary {
	if (LIBRARY_MODE !== 'mirror') return library;
	const db = (env as Partial<Env>).DB;
	if (!db) throw new Error('The mirror database is not configured.');
	return d1Library(db);
}
