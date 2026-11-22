/**
 * Builds each book's closest matches from stored embeddings. Run after the embedding job:
 * `pnpm ai:neighbours`. Uses the local D1 database, and calls no AI model.
 */
import { getPlatformProxy } from 'wrangler';
import { library } from '../src/lib/library/index.ts';
import { saveNeighbours } from '../src/lib/server/ai/neighbours.ts';

const proxy = await getPlatformProxy<{ DB: D1Database }>();
try {
	const books = await library.allBooks();
	const result = await saveNeighbours(proxy.env.DB, new Map(books.map((b) => [b.id, b.title])));
	console.log(`${result.books} books, ${result.changed} updated, ${result.removed} removed.`);
} finally {
	await proxy.dispose();
}
