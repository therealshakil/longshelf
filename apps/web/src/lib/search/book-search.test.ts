import type { Book } from '@longshelf/shared/library';
import { describe, expect, it } from 'vitest';
import { createBookSearch, SEARCH_MAX } from './book-search.ts';

const book = (id: string, title: string, author: string, tags: string[] = []): Book => ({
	id,
	title,
	authors: [{ id: author, name: author, sort: author }],
	tags,
	formats: ['EPUB'],
	addedAt: '2026-01-01'
});
const books = [
	book('wp', 'War and Peace', 'Leo Tolstoy', ['Classics']),
	book('ww', 'The War of the Worlds', 'H. G. Wells', ['Science Fiction']),
	book('jane', 'Jane Eyre', 'Charlotte Brontë', ['Gothic']),
	book('car', 'The Car', 'Someone Else'),
	book('emma-l', 'Emma and Others', 'Writer One'),
	book('emma', 'Emma', 'Jane Austen', ['Classics'])
];
const search = createBookSearch(books);
const ids = (q: string) => search(q).items.map((i) => i.book.id);

describe('createBookSearch', () => {
	it('finds titles and authors despite typos and accents', () => {
		expect(ids('jane eire')).toEqual(['jane']);
		expect(ids('bronte')).toEqual(['jane']);
		expect(ids('tolstoi')).toEqual(['wp']);
	});
	it('keeps short words exact', () => {
		expect(ids('war')).toEqual(expect.arrayContaining(['wp', 'ww']));
		expect(ids('war')).not.toContain('car');
	});
	it('needs every word to match', () => {
		expect(ids('war worlds')).toEqual(['ww']);
		expect(ids('war zebra')).toEqual([]);
	});
	it('puts an exact title first', () => {
		expect(ids('emma')[0]).toBe('emma');
	});
	it('says which fields matched', () => {
		const reason = (q: string) => search(q).items[0].reason;
		expect(reason('eyre')).toBe('Title matches');
		expect(reason('tolstoy')).toBe('Author matches');
		expect(reason('gothic')).toBe('Tag matches');
		expect(reason('jane eyre bronte')).toBe('Title and author match');
		expect(reason('jane eyre bronte gothic')).toBe('Title, author and tag match');
	});
	it('returns nothing for an empty search', () => {
		expect(search('   ')).toEqual({ total: 0, items: [] });
	});
	it('shows a limited list but reports the full count', () => {
		const many = Array.from({ length: SEARCH_MAX + 5 }, (_, i) => book(`b${i}`, `Saga ${i}`, 'A'));
		const out = createBookSearch(many)('saga');
		expect(out.total).toBe(SEARCH_MAX + 5);
		expect(out.items).toHaveLength(SEARCH_MAX);
	});
});
