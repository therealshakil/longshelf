import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createSampleLibrary } from '@longshelf/shared/sample';
import { localSuggestions } from '../../src/lib/ai/local-suggestions.ts';
import { d1Library } from '../../src/lib/server/mirror/server-library.ts';
import { mirrorEnv } from './mirror-env.ts';

const data = (body: object) => vi.fn(async () => Response.json(body)) as unknown as typeof fetch;

describe('suggestions in the browser', () => {
	it('answers Read next and More like this, and nothing else', async () => {
		const library = createSampleLibrary();
		const empty = { neighbours: {}, copies: {}, dismissed: [] };
		expect(await localSuggestions(data(empty), '/api/ai/other', library)).toBeNull();
		const readNext = await localSuggestions(data(empty), '/api/ai/read-next', library);
		expect(Array.isArray(readNext)).toBe(true);
		const [book] = await library.allBooks();
		const more = await localSuggestions(
			data({ ...empty, neighbours: { [book.id]: [] } }),
			`/api/ai/more-like/${book.id}`,
			library
		);
		expect(more).toEqual([]);
	});

	it('asks the server only for the seed books, and leaves out dismissed ones', async () => {
		const library = createSampleLibrary();
		const books = await library.allBooks();
		const [target, match] = books;
		const f = data({ neighbours: { [target.id]: [[match.id, 0.9]] }, copies: {}, dismissed: [] });
		const out = await localSuggestions(f, `/api/ai/more-like/${target.id}`, library);
		expect(vi.mocked(f).mock.calls[0][0]).toBe(
			`/api/ai/suggestion-data?seeds=${encodeURIComponent(target.id)}`
		);
		expect(out?.map((s) => s.bookId)).toContain(match.id);
		const gone = await localSuggestions(
			data({ neighbours: { [target.id]: [[match.id, 0.9]] }, copies: {}, dismissed: [match.id] }),
			`/api/ai/more-like/${target.id}`,
			library
		);
		expect(gone?.map((s) => s.bookId)).not.toContain(match.id);
	});
});

describe('D1 library for server routes', () => {
	let env: Awaited<ReturnType<typeof mirrorEnv>>;
	beforeAll(async () => (env = await mirrorEnv()), 60_000);
	afterAll(() => env?.dispose());

	it('reads books from D1 rows, title order, news left out', async () => {
		const row = (id: string, title: string, news = 0) =>
			env.store.db
				.prepare(
					"INSERT INTO book (id, metadata, metadata_hash, is_news, updated_at) VALUES (?, ?, 'h', ?, 'now')"
				)
				.bind(
					id,
					JSON.stringify({ id, title, authors: [], tags: [], formats: [], addedAt: '2026-11-24' }),
					news
				);
		await env.store.db.batch([
			row('b', 'The Zebra'),
			row('a', 'An Apple'),
			row('n', 'Paper [1 Nov]', 1)
		]);
		const lib = d1Library(env.store.db);
		expect((await lib.allBooks()).map((b) => b.title)).toEqual(['An Apple', 'The Zebra']);
		expect((await lib.book('n'))?.book.title).toBe('Paper [1 Nov]');
		expect(await lib.book('missing')).toBeNull();
	});
});
