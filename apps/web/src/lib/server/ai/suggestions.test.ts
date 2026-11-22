import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import type { Book, LibrarySource, ReadingPosition, ReadStatus } from '@ribbon/shared/library';
import { describe, expect, it } from 'vitest';
import { encodeVector } from './embeddings.ts';
import { MODELS } from './models.ts';
import { activeDismissals, dismiss, suggestItems, undoDismiss } from './suggestions.ts';

/** Just enough of D1 over node:sqlite to run the real SQL against the real migration. */
function fakeD1() {
	const sqlite = new DatabaseSync(':memory:');
	sqlite.exec(readFileSync('migrations/0001_ai.sql', 'utf8'));
	const statement = (sql: string, args: (string | null)[] = []) => ({
		bind: (...next: (string | null)[]) => statement(sql, next),
		run: async () => sqlite.prepare(sql).run(...args),
		all: async () => ({ results: sqlite.prepare(sql).all(...args) })
	});
	return { sqlite, db: { prepare: (sql: string) => statement(sql) } as unknown as D1Database };
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

describe('suggestItems', () => {
	it('joins status, the latest read time and only current-model vectors', async () => {
		const { db, sqlite } = fakeD1();
		const save = sqlite.prepare(
			`INSERT INTO book_embedding (book_id, profile_hash, vector, model, created_at)
			 VALUES (?, 'h', ?, ?, 'now')`
		);
		save.run('a', new Uint8Array(encodeVector([1, 0])), MODELS.embedding);
		save.run('b', new Uint8Array(encodeVector([0, 1])), 'an-old-model');
		const book = (id: string) => ({ id, title: id, authors: [], tags: [] }) as unknown as Book;
		const reads: Record<string, string[]> = { a: ['2026-01-01T00:00:00Z', '2026-03-01T00:00:00Z'] };
		const library = {
			allBooks: async () => [book('a'), book('b')],
			status: async (id: string): Promise<ReadStatus> =>
				id === 'a' ? { kind: 'finished' } : { kind: 'unread' },
			positions: async (id: string) =>
				(reads[id] ?? []).map((readAt) => ({ readAt }) as ReadingPosition)
		} as unknown as LibrarySource;

		const [a, b] = await suggestItems(db, library);
		expect(a.status.kind).toBe('finished');
		expect(a.lastReadAt).toBe('2026-03-01T00:00:00Z');
		expect([...a.vector!]).toEqual([1, 0]);
		expect(b.lastReadAt).toBeUndefined();
		expect(b.vector).toBeNull();
	});
});
