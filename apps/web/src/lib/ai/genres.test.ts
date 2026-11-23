import type { GenreIndex } from '@longshelf/shared/ai';
import type { Book } from '@longshelf/shared/library';
import { describe, expect, it, vi } from 'vitest';
import { genreSlug, shelvesFrom } from './genres.ts';

vi.mock('#lib/library/index.ts', () => ({ library: {} }));

const book = (id: string, title: string, sort: string, addedAt: string): Book => ({
	id,
	title,
	authors: [{ id: sort, name: sort, sort }],
	tags: [],
	formats: ['EPUB'],
	addedAt
});
const books = [
	book('a', 'The Zebra', 'Adams', '2026-01-01'),
	book('b', 'Apple', 'Young', '2026-03-01'),
	book('c', 'Mango', 'Brown', '2026-02-01')
];
const item = (bookId: string, name: string, state: GenreIndex['items'][number]['state']) => ({
	bookId,
	name,
	state
});

describe('genreSlug', () => {
	it('makes a stable address from a genre name', () => {
		expect(genreSlug('Art & Music')).toBe('art-music');
		expect(genreSlug('Children’s')).toBe('childrens');
	});
});

describe('shelvesFrom', () => {
	const items = [
		item('a', 'War', 'suggested'),
		item('a', 'Gothic', 'in_calibre'),
		item('b', 'Gothic', 'promoted'),
		item('c', 'Gothic', 'suggested'),
		item('gone', 'Poetry', 'suggested')
	];
	it('groups by genre, largest first, and leaves out books not in the library', () => {
		const out = shelvesFrom(items, books);
		expect(out.map((s) => [s.name, s.count, s.suggested])).toEqual([
			['Gothic', 3, 2],
			['War', 1, 1]
		]);
	});
	it('sorts a shelf by title ignoring "The", by author, or by newest', () => {
		const order = (sort: 'title' | 'author' | 'added') =>
			shelvesFrom(items, books, sort)[0].books.map((b) => b.id);
		expect(order('title')).toEqual(['b', 'c', 'a']);
		expect(order('author')).toEqual(['a', 'c', 'b']);
		expect(order('added')).toEqual(['b', 'c', 'a']);
	});
});
