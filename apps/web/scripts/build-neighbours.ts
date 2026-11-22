/**
 * Builds each book's closest matches from stored embeddings. Run after the embedding job:
 * `pnpm ai:neighbours`. Uses the local D1 database, and calls no AI model.
 */
import { createSampleLibrary } from '@ribbon/shared/sample';
import { getPlatformProxy } from 'wrangler';
import { saveNeighbours } from '../src/lib/server/ai/neighbours.ts';

const proxy = await getPlatformProxy<{ DB: D1Database }>();
try {
	const books = await createSampleLibrary().allBooks();
	const result = await saveNeighbours(proxy.env.DB, new Map(books.map((b) => [b.id, b.title])));
	console.log(`${result.books} books, ${result.changed} updated, ${result.removed} removed.`);
} finally {
	await proxy.dispose();
}
