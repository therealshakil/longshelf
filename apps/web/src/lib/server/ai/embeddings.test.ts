import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import type { Book } from '@longshelf/shared/library';
import { describe, expect, it, vi } from 'vitest';
import {
	bookProfile,
	decodeVector,
	embedLibrary,
	encodeVector,
	profileHash
} from './embeddings.ts';
import type { GuardStore } from './guard.ts';

const book = (id: string, extra: Partial<Book> = {}): Book => ({
	id,
	title: `Title ${id}`,
	authors: [{ id: 'a', name: 'An Author', sort: 'Author, An' }],
	tags: ['Fiction'],
	formats: ['EPUB'],
	addedAt: '2026-11-01',
	...extra
});

/** Just enough of D1 over node:sqlite to run the real SQL against the real migration. */
function fakeD1() {
	const sqlite = new DatabaseSync(':memory:');
	sqlite.exec(readFileSync('migrations/0001_ai.sql', 'utf8'));
	const value = (v: unknown) => (v instanceof ArrayBuffer ? new Uint8Array(v) : v) as string;
	const statement = (sql: string, args: unknown[] = []) => ({
		bind: (...next: unknown[]) => statement(sql, next),
		run: async () => sqlite.prepare(sql).run(...args.map(value)),
		all: async () => ({ results: sqlite.prepare(sql).all(...args.map(value)) })
	});
	const db = {
		prepare: (sql: string) => statement(sql),
		batch: async (list: { run(): Promise<unknown> }[]) => {
			for (const s of list) await s.run();
		}
	} as unknown as D1Database;
	const rows = () =>
		sqlite.prepare('SELECT * FROM book_embedding ORDER BY book_id').all() as {
			book_id: string;
			profile_hash: string;
			vector: Uint8Array;
		}[];
	return { db, rows };
}

function fakeStore(settings: Record<string, string> = {}) {
	let neurons = 0;
	const store: GuardStore = {
		usage: async () => ({ neuronsEst: neurons, calls: 0 }),
		add: async (_day, n) => {
			neurons += n;
		},
		setting: async (key) => settings[key] ?? null,
		setSetting: async () => {}
	};
	return { store, spent: () => neurons };
}

const fakeAi = () => {
	const run = vi.fn(async (_model: string, input: { text: string[] }) => ({
		data: input.text.map(() => [0.25, 0.5, 0.75])
	}));
	return { ai: { run } as unknown as Ai, run };
};

describe('bookProfile', () => {
	it('uses title, author, genres and plain description', () => {
		const text = bookProfile(
			book('x', {
				title: 'Paradise',
				subtitle: 'A Novel',
				tags: ['Fiction', 'Historical'],
				description: '<p>A boy &amp; his <b>journey</b>.</p>'
			})
		);
		expect(text).toBe(
			'Title: Paradise: A Novel\nAuthor: An Author\nGenres: Fiction, Historical\nDescription: A boy & his journey .'
		);
	});
	it('leaves out what a book does not have and limits long descriptions', () => {
		expect(bookProfile(book('x', { authors: [], tags: [] }))).toBe('Title: Title x');
		const long = bookProfile(book('x', { description: 'a'.repeat(5000) }));
		expect(long.split('Description: ')[1].length).toBe(2000);
	});
});

describe('stored values', () => {
	it('changes the hash with the profile or the model', async () => {
		const hash = await profileHash('one', 'model-a');
		expect(await profileHash('one', 'model-a')).toBe(hash);
		expect(await profileHash('two', 'model-a')).not.toBe(hash);
		expect(await profileHash('one', 'model-b')).not.toBe(hash);
	});
	it('reads a vector back from each form D1 can return', () => {
		const buffer = encodeVector([0.25, -1.5]);
		const bytes = new Uint8Array(buffer);
		for (const blob of [buffer, bytes, [...bytes]])
			expect([...decodeVector(blob)]).toEqual([0.25, -1.5]);
	});
});

describe('embedLibrary', () => {
	it('embeds new books and skips them the next time', async () => {
		const { db, rows } = fakeD1();
		const { store, spent } = fakeStore();
		const { ai, run } = fakeAi();
		const books = [book('a'), book('b')];
		expect(await embedLibrary({ ai, db, store, books })).toEqual({
			total: 2,
			embedded: 2,
			unchanged: 0,
			removed: 0,
			remaining: 0
		});
		expect(rows().map((r) => r.book_id)).toEqual(['a', 'b']);
		expect([...decodeVector(rows()[0].vector)]).toEqual([0.25, 0.5, 0.75]);
		expect(spent()).toBeGreaterThan(0);
		const again = await embedLibrary({ ai, db, store, books });
		expect(again).toMatchObject({ embedded: 0, unchanged: 2 });
		expect(run).toHaveBeenCalledTimes(1);
	});
	it('rebuilds only a changed book and removes one that left the library', async () => {
		const { db, rows } = fakeD1();
		const { store } = fakeStore();
		const { ai, run } = fakeAi();
		await embedLibrary({ ai, db, store, books: [book('a'), book('b'), book('c')] });
		const out = await embedLibrary({
			ai,
			db,
			store,
			books: [book('a', { description: 'New text' }), book('b')]
		});
		expect(out).toMatchObject({ embedded: 1, unchanged: 1, removed: 1, remaining: 0 });
		expect(run.mock.calls[1][1].text).toHaveLength(1);
		expect(rows().map((r) => r.book_id)).toEqual(['a', 'b']);
	});
	it('does a bounded amount per run and continues on the next', async () => {
		const { db, rows } = fakeD1();
		const { store } = fakeStore();
		const { ai, run } = fakeAi();
		const books = Array.from({ length: 150 }, (_, i) => book(String(i)));
		expect(await embedLibrary({ ai, db, store, books })).toMatchObject({
			embedded: 144,
			remaining: 6
		});
		expect(run).toHaveBeenCalledTimes(6);
		expect(await embedLibrary({ ai, db, store, books })).toMatchObject({
			embedded: 6,
			unchanged: 144,
			remaining: 0
		});
		expect(rows()).toHaveLength(150);
	});
	it('refuses without calling the model when AI is off or over the ceiling', async () => {
		for (const [settings, reason] of [
			[{ enabled: 'false' }, 'ai_off'],
			[{ ceiling: '0.0000001' }, 'ai_paused']
		] as const) {
			const { db, rows } = fakeD1();
			const { store } = fakeStore(settings);
			const { ai, run } = fakeAi();
			await expect(embedLibrary({ ai, db, store, books: [book('a')] })).rejects.toMatchObject({
				status: 503,
				body: { message: JSON.stringify({ reason }) }
			});
			expect(run).not.toHaveBeenCalled();
			expect(rows()).toEqual([]);
		}
	});
	it('stores nothing from a malformed response', async () => {
		for (const data of [[[1, 2]], [[1, 2], [3]], [[1], [Number.NaN]], undefined]) {
			const { db, rows } = fakeD1();
			const { store, spent } = fakeStore();
			const ai = { run: async () => ({ data }) } as unknown as Ai;
			await expect(
				embedLibrary({ ai, db, store, books: [book('a'), book('b')] })
			).rejects.toMatchObject({ status: 503 });
			expect(rows()).toEqual([]);
			expect(spent()).toBe(0);
		}
	});
	it('keeps finished batches when the model fails partway', async () => {
		const { db, rows } = fakeD1();
		const { store } = fakeStore();
		let calls = 0;
		const ai = {
			run: async (_m: string, input: { text: string[] }) => {
				if (++calls > 1) throw new Error('down');
				return { data: input.text.map(() => [1, 2]) };
			}
		} as unknown as Ai;
		const books = Array.from({ length: 30 }, (_, i) => book(String(i)));
		expect(await embedLibrary({ ai, db, store, books })).toMatchObject({
			embedded: 24,
			remaining: 6,
			stopped: 'offline'
		});
		expect(rows()).toHaveLength(24);
	});
});
