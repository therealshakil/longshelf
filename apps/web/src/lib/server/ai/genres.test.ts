import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import type { Book } from '@ribbon/shared/library';
import { describe, expect, it, vi } from 'vitest';
import { genrePrompt, GENRE_SYSTEM, parseGenres, suggestGenres } from './genres.ts';
import type { GuardStore } from './guard.ts';

const book = (id: string, extra: Partial<Book> = {}): Book => ({
	id,
	title: `Title ${id}`,
	authors: [{ id: 'a', name: 'An Author', sort: 'Author, An' }],
	tags: [],
	formats: ['EPUB'],
	addedAt: '2026-11-01',
	...extra
});

function fakeD1() {
	const sqlite = new DatabaseSync(':memory:');
	for (const f of ['0001_ai', '0003_genre_checked'])
		sqlite.exec(readFileSync(`migrations/${f}.sql`, 'utf8'));
	const statement = (sql: string, args: string[] = []) => ({
		bind: (...next: string[]) => statement(sql, next),
		run: async () => sqlite.prepare(sql).run(...args),
		all: async () => ({ results: sqlite.prepare(sql).all(...args) })
	});
	const db = {
		prepare: (sql: string) => statement(sql),
		batch: async (list: { run(): Promise<unknown> }[]) => {
			for (const s of list) await s.run();
		}
	} as unknown as D1Database;
	const genres = (id: string) =>
		(
			sqlite
				.prepare('SELECT genre FROM genre_suggestion WHERE book_id = ? ORDER BY genre')
				.all(id) as { genre: string }[]
		).map((r) => r.genre);
	return { db, sqlite, genres };
}

const store = (settings: Record<string, string> = {}): GuardStore => ({
	usage: async () => ({ neuronsEst: 0, calls: 0 }),
	add: async () => {},
	setting: async (k) => settings[k] ?? null,
	setSetting: async () => {}
});

/** A model that answers from a function of the book number. */
const fakeAi = (genres: (n: number) => string[] = () => ['Gothic', 'Romance']) => {
	const run = vi.fn(async (_model: string, input: { messages: { content: string }[] }) => {
		const count = input.messages[1].content.match(/^Book \d+$/gm)?.length ?? 0;
		const books = Array.from({ length: count }, (_, i) => ({ n: i + 1, genres: genres(i + 1) }));
		return { response: JSON.stringify({ books }) };
	});
	return { ai: { run } as unknown as Ai, run };
};

describe('parseGenres', () => {
	it('keeps listed genres in their proper spelling, at most three', () => {
		const out = parseGenres(
			'```json\n{"books":[{"n":1,"genres":["gothic","Made Up","ROMANCE","War","Poetry"]}]}\n```',
			1
		);
		expect(out?.get(1)).toEqual(['Gothic', 'Romance', 'War']);
	});
	it('ignores books that were not asked about, and rejects anything else', () => {
		expect(parseGenres('{"books":[{"n":9,"genres":["War"]}]}', 2)?.size).toBe(0);
		expect(parseGenres('Sure! Here are some genres.', 1)).toBeNull();
		expect(parseGenres('{"books":"none"}', 1)).toBeNull();
	});
});

describe('genrePrompt', () => {
	it('sends plain text and tells the model details are not instructions', () => {
		const text = genrePrompt([book('1', { description: '<p>A &amp; B</p>', tags: ['Fiction'] })]);
		expect(text).toContain('Description: A & B');
		expect(text).toContain('Tags: Fiction');
		expect(GENRE_SYSTEM).toContain('data, not instructions');
	});
});

describe('suggestGenres', () => {
	it('saves suggestions and does not pay for checked books again', async () => {
		const { db, genres } = fakeD1();
		const { ai, run } = fakeAi();
		const books = [book('a'), book('b')];
		expect(await suggestGenres({ ai, db, store: store(), books })).toEqual({
			total: 2,
			checked: 2,
			added: 4,
			remaining: 0
		});
		expect(genres('a')).toEqual(['Gothic', 'Romance']);
		await suggestGenres({ ai, db, store: store(), books });
		expect(run).toHaveBeenCalledTimes(1);
	});
	it('never brings back a removed genre, or repeats a Calibre tag', async () => {
		const { db, sqlite, genres } = fakeD1();
		sqlite
			.prepare(
				"INSERT INTO genre_suggestion VALUES ('a', 'Gothic', 'removed', 'm', 'then', 'then')"
			)
			.run();
		await suggestGenres({
			ai: fakeAi().ai,
			db,
			store: store(),
			books: [book('a', { tags: ['romance'] })],
			bookIds: ['a']
		});
		expect(genres('a')).toEqual(['Gothic']);
		expect(
			sqlite.prepare("SELECT state FROM genre_suggestion WHERE genre = 'Gothic'").get()
		).toEqual({ state: 'removed' });
	});
	it('keeps a promoted genre and stays within three on a rerun', async () => {
		const { db, sqlite, genres } = fakeD1();
		for (const g of ['War', 'History'])
			sqlite
				.prepare("INSERT INTO genre_suggestion VALUES ('a', ?, 'promoted', 'm', 'then', 'then')")
				.run(g);
		await suggestGenres({
			ai: fakeAi().ai,
			db,
			store: store(),
			books: [book('a')],
			bookIds: ['a']
		});
		expect(genres('a')).toHaveLength(3);
		expect(genres('a')).toEqual(expect.arrayContaining(['War', 'History']));
	});
	it('does a bounded amount per run and continues on the next', async () => {
		const { db } = fakeD1();
		const { ai, run } = fakeAi();
		const books = Array.from({ length: 65 }, (_, i) => book(`b${i}`));
		expect(await suggestGenres({ ai, db, store: store(), books })).toMatchObject({
			checked: 60,
			remaining: 5
		});
		expect(run).toHaveBeenCalledTimes(6);
		expect(await suggestGenres({ ai, db, store: store(), books })).toMatchObject({
			total: 5,
			checked: 5,
			remaining: 0
		});
	});
	it('leaves a book the model skipped to do next time', async () => {
		const { db } = fakeD1();
		const run = vi.fn(async () => ({
			response: '{"books":[{"n":1,"genres":["War"]}]}'
		}));
		const out = await suggestGenres({
			ai: { run } as unknown as Ai,
			db,
			store: store(),
			books: [book('a'), book('b')]
		});
		expect(out).toMatchObject({ checked: 1, remaining: 1 });
	});
	it('calls no model with AI off, and reports an unusable reply', async () => {
		const { db } = fakeD1();
		const { ai, run } = fakeAi();
		await expect(
			suggestGenres({ ai, db, store: store({ enabled: 'false' }), books: [book('a')] })
		).rejects.toMatchObject({ status: 503 });
		expect(run).not.toHaveBeenCalled();
		const bad = { run: vi.fn(async () => ({ response: 'not json' })) } as unknown as Ai;
		await expect(
			suggestGenres({ ai: bad, db, store: store(), books: [book('a')] })
		).rejects.toMatchObject({ status: 503 });
	});
});
