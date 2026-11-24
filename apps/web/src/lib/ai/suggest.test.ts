import type { Book, ReadStatus } from '@longshelf/shared/library';
import { describe, expect, it } from 'vitest';
import { buildNeighbours } from '#lib/server/ai/neighbours.ts';
import {
	cosine,
	MIN_SIMILARITY,
	moreLike as moreLikeFrom,
	READ_NEXT_MAX,
	readNext as readNextFrom,
	type SuggestItem
} from './suggest.ts';

type TestItem = SuggestItem & { vector?: Float32Array };

const UNREAD: ReadStatus = { kind: 'unread' };
const FINISHED: ReadStatus = { kind: 'finished' };
const READING: ReadStatus = { kind: 'in-progress', percent: 40 };

function item(
	id: string,
	o: Partial<Book> & { author?: string; status?: ReadStatus; at?: string; v?: number[] } = {}
): TestItem {
	const { author = `Author x${id}`, status = UNREAD, at, v, ...book } = o;
	return {
		book: {
			id,
			title: `Title ${id}`,
			authors: [{ id: author.toLowerCase(), name: author, sort: author }],
			tags: [],
			formats: ['EPUB'],
			addedAt: '2026-01-01',
			...book
		},
		status,
		lastReadAt: at,
		vector: v ? Float32Array.from(v) : undefined
	};
}
/** Runs the real neighbour build on the test vectors, as the operator script does. */
function linked(items: TestItem[]): SuggestItem[] {
	const rows = buildNeighbours(
		items.flatMap((i) =>
			i.vector ? [{ id: i.book.id, title: i.book.title, vector: i.vector }] : []
		)
	);
	return items.map((i) => ({ ...i, ...rows.get(i.book.id) }));
}
const readNext = (items: TestItem[], dismissed?: Set<string>) =>
	readNextFrom(linked(items), dismissed);
const moreLike = (id: string, items: TestItem[], dismissed?: Set<string>) =>
	moreLikeFrom(id, linked(items), dismissed);
const ids = (list: { bookId: string }[]) => list.map((s) => s.bookId);
const reasonFor = (list: { bookId: string; reason: string }[], id: string) =>
	list.find((s) => s.bookId === id)?.reason;

describe('cosine', () => {
	it('scores direction, and is 0 for unusable vectors', () => {
		expect(cosine(Float32Array.of(1, 0), Float32Array.of(2, 0))).toBeCloseTo(1);
		expect(cosine(Float32Array.of(1, 0), Float32Array.of(0, 1))).toBeCloseTo(0);
		expect(cosine(Float32Array.of(0, 0), Float32Array.of(1, 0))).toBe(0);
		expect(cosine(Float32Array.of(1), Float32Array.of(1, 0))).toBe(0);
	});
});

describe('readNext', () => {
	it('applies the rules in order, each with a true reason', () => {
		const out = readNext([
			item('sim', { v: [1, 0.01] }),
			item('coll', { collection: 'Gothic' }),
			item('auth', { author: 'Jane Austen' }),
			item('list', { collection: 'Reading List' }),
			item('s2', { series: { name: 'Saga', index: 2 } }),
			item('s1', {
				series: { name: 'Saga', index: 1 },
				author: 'Jane Austen',
				status: FINISHED,
				at: '2026-02-01',
				v: [1, 0]
			}),
			item('now', { collection: 'Gothic', status: READING, at: '2026-03-01' })
		]);
		expect(out).toEqual([
			{ bookId: 's2', reason: 'Next in Saga' },
			{ bookId: 'list', reason: 'On your Reading List' },
			{ bookId: 'auth', reason: 'Another by Jane Austen' },
			{ bookId: 'coll', reason: 'In your Gothic collection' },
			{ bookId: 'sim', reason: 'Like Title s1' }
		]);
	});
	it('never suggests read, in-progress, dismissed or unknown books', () => {
		const items = [
			item('done', { status: FINISHED, at: '2026-01-02', v: [1, 0] }),
			item('now', { status: READING, at: '2026-01-03', v: [1, 0] }),
			item('gone', { v: [1, 0] }),
			item('ok', { v: [1, 0] })
		];
		const out = readNext(items, new Set(['gone']));
		expect(ids(out)).toEqual(['ok']);
		const known = new Set(items.map((i) => i.book.id));
		expect(out.every((s) => known.has(s.bookId) && s.reason.length > 0)).toBe(true);
	});
	it('skips another copy of a book already read, and shows one copy of a work', () => {
		const out = readNext([
			item('read', { title: 'Emma', author: 'Jane Austen', status: FINISHED, at: '2026-01-01' }),
			item('copy', { title: 'Emma: A Novel', author: 'Jane Austen' }),
			item('one', { title: 'Persuasion', author: 'Jane Austen', collection: 'Reading List' }),
			item('two', {
				title: 'Persuasion (Reissue)',
				author: 'Jane Austen',
				collection: 'Reading List'
			})
		]);
		expect(ids(out)).toEqual(['one']);
	});
	it('keeps different books with the same title by different authors', () => {
		const out = readNext([
			item('a', { title: 'Persuasion', author: 'Mary Shelley', collection: 'Reading List' }),
			item('b', { title: 'Persuasion', author: 'Jane Austen', collection: 'Reading List' })
		]);
		expect(out).toHaveLength(2);
	});
	it('takes the next unread book after the furthest one read in a series', () => {
		const s = (index: number) => ({ series: { name: 'Saga', index } });
		const out = readNext([
			item('1', s(1)),
			item('2', { ...s(2), status: FINISHED, at: '2026-01-01' }),
			item('4', s(4)),
			item('3', s(3))
		]);
		expect(out[0]).toEqual({ bookId: '3', reason: 'Next in Saga' });
		expect(ids(out)).not.toContain('1');
	});
	it('does not call a weak match similar', () => {
		const below = MIN_SIMILARITY - 0.1;
		const out = readNext([
			item('seed', { status: FINISHED, at: '2026-01-01', v: [1, 0] }),
			item('weak', { v: [below, Math.sqrt(1 - below * below)] })
		]);
		expect(out).toEqual([]);
	});
	it('lets other rules in before a long list, then refills spare places', () => {
		const list = Array.from({ length: 20 }, (_, i) =>
			item(`list${i}`, { collection: 'Reading List' })
		);
		const out = readNext([
			...list,
			item('seed', { author: 'Jane Austen', status: FINISHED, at: '2026-01-01' }),
			item('auth', { author: 'Jane Austen' })
		]);
		expect(out).toHaveLength(READ_NEXT_MAX);
		expect(out.slice(0, 5).map((s) => s.reason)).toContain('Another by Jane Austen');
		expect(out.filter((s) => s.reason === 'On your Reading List')).toHaveLength(READ_NEXT_MAX - 1);
	});
	it('treats spellings of a name as one author', () => {
		const out = readNext([
			item('read', { author: 'H. G Wells', status: FINISHED, at: '2026-01-01' }),
			item('next', { author: 'H. G. Wells' })
		]);
		expect(out).toEqual([{ bookId: 'next', reason: 'Another by H. G. Wells' }]);
	});
	it('names the author actually shared by a co-written book', () => {
		const seed = item('read', { author: 'First Writer', status: FINISHED, at: '2026-01-01' });
		seed.book.authors.push({ id: 'shared', name: 'Shared Writer', sort: 'Writer, Shared' });
		const out = readNext([seed, item('next', { author: 'Shared Writer' })]);
		expect(out[0].reason).toBe('Another by Shared Writer');
	});
	it('uses similarity to find new authors, not more of one already read', () => {
		const out = readNext([
			item('seed', { author: 'Jane Austen', status: FINISHED, at: '2026-01-01', v: [1, 0] }),
			item('same1', { author: 'Jane Austen', v: [1, 0] }),
			item('same2', { author: 'Jane Austen', v: [1, 0] }),
			item('new', { v: [1, 0.1] })
		]);
		expect(out.map((s) => s.reason)).toEqual([
			'Another by Jane Austen',
			'Like Title seed',
			'Another by Jane Austen'
		]);
		expect(reasonFor(out, 'new')).toBe('Like Title seed');
	});
	it('works with no reading history and no vectors', () => {
		expect(ids(readNext([item('a', { collection: 'Reading List' }), item('b')]))).toEqual(['a']);
	});
});

describe('moreLike', () => {
	const source = item('src', { title: 'Source: A Novel', v: [1, 0] });
	it('ranks by similarity, at most five, with a reason on each', () => {
		const others = Array.from({ length: 8 }, (_, i) => item(`o${i}`, { v: [1, i / 20] }));
		const out = moreLike('src', [source, ...others]);
		expect(ids(out)).toEqual(['o0', 'o1', 'o2', 'o3', 'o4']);
		expect(reasonFor(out, 'o0')).toBe('Like Source');
	});
	it('names a shared author as the reason, and limits one author', () => {
		const a = 'Herman Melville';
		const out = moreLike('src2', [
			item('src2', { author: a, v: [1, 0] }),
			item('b1', { author: a, v: [1, 0.01] }),
			item('b2', { author: a, v: [1, 0.02] }),
			item('b3', { author: a, v: [1, 0.03] }),
			item('other', { v: [1, 0.2] })
		]);
		expect(ids(out)).toEqual(['b1', 'b2', 'other']);
		expect(reasonFor(out, 'b1')).toBe(`Another by ${a}`);
	});
	it('excludes read, dismissed and other copies of the book', () => {
		const out = moreLike(
			'src',
			[
				source,
				item('copy', { title: 'Source', author: 'Author src', v: [1, 0] }),
				item('done', { status: FINISHED, v: [1, 0] }),
				item('now', { status: READING, v: [1, 0] }),
				item('gone', { v: [1, 0] }),
				item('ok', { v: [1, 0] })
			],
			new Set(['gone'])
		);
		expect(ids(out)).toEqual(['ok']);
	});
	it('treats a near-identical record with a misspelled author as the same work', () => {
		const out = moreLike('a', [
			item('a', { title: 'Villette', author: 'Charlotte Bronte', v: [1, 0] }),
			item('typo', { title: 'Villette', author: 'Charlote Bronte', v: [1, 0.05] }),
			item('other', { title: 'Villette', author: 'Someone Else', v: [1, 1] })
		]);
		expect(ids(out)).toEqual(['other']);
	});
	it('returns nothing for a book without a vector', () => {
		expect(moreLike('x', [item('x'), item('y', { v: [1, 0] })])).toEqual([]);
		expect(moreLike('missing', [item('y', { v: [1, 0] })])).toEqual([]);
	});
});
