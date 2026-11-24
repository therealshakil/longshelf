/** Builds a tiny Calibre-shaped library on disk for tests (the columns the reader uses). */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export const BOOK = '11111111-1111-4111-8111-111111111111';
export const NEWS = '22222222-2222-4222-8222-222222222222';

export function makeLibrary(root: string) {
	const dir = join(root, 'Charles Dickens/A Tale of Two Cities (1)');
	mkdirSync(dir, { recursive: true });
	writeFileSync(join(dir, 'A Tale of Two Cities.epub'), 'epub bytes');
	writeFileSync(join(dir, 'A Tale of Two Cities.pdf'), 'pdf bytes');
	writeFileSync(join(dir, 'cover.jpg'), 'jpg bytes');
	const db = new DatabaseSync(join(root, 'metadata.db'));
	db.exec(`
		CREATE TABLE books (id INTEGER PRIMARY KEY, uuid TEXT, title TEXT, sort TEXT, series_index REAL,
			timestamp TEXT, pubdate TEXT, path TEXT, has_cover INTEGER);
		CREATE TABLE authors (id INTEGER PRIMARY KEY, name TEXT, sort TEXT);
		CREATE TABLE books_authors_link (id INTEGER PRIMARY KEY, book INTEGER, author INTEGER);
		CREATE TABLE tags (id INTEGER PRIMARY KEY, name TEXT);
		CREATE TABLE books_tags_link (id INTEGER PRIMARY KEY, book INTEGER, tag INTEGER);
		CREATE TABLE data (id INTEGER PRIMARY KEY, book INTEGER, format TEXT, name TEXT);
		CREATE TABLE comments (id INTEGER PRIMARY KEY, book INTEGER, text TEXT);
		CREATE TABLE publishers (id INTEGER PRIMARY KEY, name TEXT);
		CREATE TABLE books_publishers_link (id INTEGER PRIMARY KEY, book INTEGER, publisher INTEGER);
		CREATE TABLE series (id INTEGER PRIMARY KEY, name TEXT);
		CREATE TABLE books_series_link (id INTEGER PRIMARY KEY, book INTEGER, series INTEGER);
		CREATE TABLE ratings (id INTEGER PRIMARY KEY, rating INTEGER);
		CREATE TABLE books_ratings_link (id INTEGER PRIMARY KEY, book INTEGER, rating INTEGER);
		CREATE TABLE custom_columns (id INTEGER PRIMARY KEY, label TEXT, datatype TEXT, is_multiple INTEGER);
		INSERT INTO books VALUES
			(1, '${BOOK}', 'A Tale of Two Cities', 'Tale of Two Cities, A', 1, '2026-11-20 10:00:00+00:00', '1859-01-01 00:00:00+00:00', 'Charles Dickens/A Tale of Two Cities (1)', 1),
			(2, '${NEWS}', 'The Paper [Sat, 14 Nov 2026]', 'The Paper [Sat, 14 Nov 2026]', 1, '2026-11-14 10:00:00+00:00', '0101-01-01 00:00:00+00:00', 'calibre/The Paper (2)', 0);
		INSERT INTO authors VALUES (1, 'Charles Dickens', 'Dickens, Charles');
		INSERT INTO books_authors_link (book, author) VALUES (1, 1), (2, 1);
		INSERT INTO tags VALUES (1, 'News');
		INSERT INTO books_tags_link (book, tag) VALUES (2, 1);
		INSERT INTO data (book, format, name) VALUES (1, 'EPUB', 'A Tale of Two Cities'), (1, 'PDF', 'A Tale of Two Cities');
		INSERT INTO ratings VALUES (1, 8);
		INSERT INTO books_ratings_link (book, rating) VALUES (1, 1);
	`);
	db.close();
	return { dir };
}
