import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import type { Book, LibrarySource, ReadingPosition, ReadStatus } from '@longshelf/shared/library';
import { describe, expect, it } from 'vitest';
import { encodeVector } from './embeddings.ts';
import { MODELS } from './models.ts';
import { saveNeighbours } from './neighbours.ts';
import { activeDismissals, dismiss, suggestItems, undoDismiss } from './suggestions.ts';

/** Just enough of D1 over node:sqlite to run the real SQL against the real migration. */
function fakeD1() {
	const sqlite = new DatabaseSync(':memory:');
	for (const file of ['0001_ai', '0002_neighbours'])
		sqlite.exec(readFileSync(`migrations/${file}.sql`, 'utf8'));
	const statement = (sql: string, args: (string | null)[] = []) => ({
		bind: (...next: (string | null)[]) => statement(sql, next),
		run: async () => sqlite.prepare(sql).run(...args),
		all: async () => ({ results: sqlite.prepare(sql).all(...args) })
	});
	const db = {
		prepare: (sql: string) => statement(sql),
		batch: async (list: { run(): Promise<unknown> }[]) => {
			for (const s of list) await s.run();
		}
	} as unknown as D1Database;
	return { sqlite, db };
}

const NOW = new Date('2026-11-22T12:00:00.000Z');
const later = (days: number) => new Date(NOW.getTime() + days * 86_400_000);

describe('dismissals', () => {
	it('hides "not now" for 30 days, then lets it lapse', async () => {
		const { db } = fakeD1();
		await dismiss(db, 'a', 'not_now', NOW);
		expect(await activeDismissals(db, later(29))).toEqual(new Set(['a']));
		expect(await activeDismissals(db, later(30))).toEqual(new Set());
	});
	it('keeps "never" until it is undone', async () => {
		const { db } = fakeD1();
		await dismiss(db, 'a', 'never', NOW);
		expect(await activeDismissals(db, later(4000))).toEqual(new Set(['a']));
		await undoDismiss(db, 'a');
		expect(await activeDismissals(db, later(4000))).toEqual(new Set());
	});
	it('uses the latest choice for a book', async () => {
		const { db } = fakeD1();
		await dismiss(db, 'a', 'never', NOW);
		await dismiss(db, 'a', 'not_now', NOW);
		expect(await activeDismissals(db, later(31))).toEqual(new Set());
	});
});

describe('stored neighbours', () => {
	const titles = new Map([
		['a', 'Villette'],
		['b', 'Villette'],
		['c', 'Shirley'],
		['far', 'Emma']
	]);
	const vectors: Record<string, number[]> = { a: [1, 0], b: [1, 0.01], c: [1, 0.5], far: [0, 1] };
	const seed = (sqlite: DatabaseSync) => {
		const save = sqlite.prepare(
			`INSERT OR REPLACE INTO book_embedding (book_id, profile_hash, vector, model, created_at)
			 VALUES (?, 'h', ?, ?, 'now')`
		);
		for (const [id, v] of Object.entries(vectors))
			save.run(id, new Uint8Array(encodeVector(v)), MODELS.embedding);
		save.run('old', new Uint8Array(encodeVector([1, 0])), 'an-old-model');
	};
	const book = (id: string) =>
		({ id, title: titles.get(id), authors: [], tags: [] }) as unknown as Book;
	const library = {
		allBooks: async () => [...titles.keys()].map(book),
		status: async (id: string): Promise<ReadStatus> =>
			id === 'a' ? { kind: 'finished' } : { kind: 'unread' },
		positions: async (id: string) =>
			id === 'a'
				? ['2026-01-01T00:00:00Z', '2026-03-01T00:00:00Z'].map(
						(readAt) => ({ readAt }) as ReadingPosition
					)
				: []
	} as unknown as LibrarySource;

	it('writes only what changed, and drops books that left', async () => {
		const { db, sqlite } = fakeD1();
		seed(sqlite);
		expect(await saveNeighbours(db, titles)).toEqual({ books: 4, changed: 4, removed: 0 });
		expect(await saveNeighbours(db, titles)).toEqual({ books: 4, changed: 0, removed: 0 });
		sqlite.prepare("DELETE FROM book_embedding WHERE book_id = 'far'").run();
		expect(await saveNeighbours(db, titles)).toMatchObject({ books: 3, removed: 1 });
	});
	it('refuses to erase matches when no embedding belongs to this library', async () => {
		const { db, sqlite } = fakeD1();
		seed(sqlite);
		await saveNeighbours(db, titles);
		await expect(saveNeighbours(db, new Map([['other', 'Other']]))).rejects.toThrow('left alone');
		expect(sqlite.prepare('SELECT COUNT(*) AS n FROM book_neighbours').get()).toEqual({ n: 4 });
	});
	it('loads matches only for the chosen books, with status and copies', async () => {
		const { db, sqlite } = fakeD1();
		seed(sqlite);
		await saveNeighbours(db, titles);
		const items = await suggestItems(db, library, () => ['a']);
		const a = items.find((i) => i.book.id === 'a')!;
		const c = items.find((i) => i.book.id === 'c')!;
		expect(a.lastReadAt).toBe('2026-03-01T00:00:00Z');
		expect(a.neighbours?.map((n) => n.id)).toEqual(['b', 'c']);
		expect(a.copies).toEqual(['b']);
		expect(c.neighbours).toBeUndefined();
	});
	it('ignores rows from another embedding model', async () => {
		const { db, sqlite } = fakeD1();
		sqlite
			.prepare("INSERT INTO book_neighbours VALUES ('a', 'an-old-model', '[[\"c\",0.9]]', NULL)")
			.run();
		const items = await suggestItems(db, library, () => ['a']);
		expect(items.find((i) => i.book.id === 'a')!.neighbours).toBeUndefined();
	});
});
