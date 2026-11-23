import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createSnapshotLibrary, parseIssueTitle } from '@longshelf/shared/library/snapshot';
import {
	fileForRequest,
	htmlToText,
	localCalibre,
	readCalibreSnapshot
} from '../../scripts/local-calibre.ts';

const BOOK = '11111111-1111-4111-8111-111111111111';
const NEWS = '22222222-2222-4222-8222-222222222222';
let root: string;

beforeAll(() => {
	root = mkdtempSync(join(tmpdir(), 'longshelf-calibre-'));
	mkdirSync(join(root, 'Mary Shelley/Frankenstein (1)'), { recursive: true });
	writeFileSync(join(root, 'Mary Shelley/Frankenstein (1)/Frankenstein.epub'), 'epub');
	writeFileSync(join(root, 'Mary Shelley/Frankenstein (1)/cover.jpg'), 'jpg');
	const db = new DatabaseSync(join(root, 'metadata.db'));
	db.exec(`
		CREATE TABLE books (id INTEGER PRIMARY KEY, uuid TEXT, title TEXT, series_index REAL,
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
		CREATE TABLE custom_columns (id INTEGER PRIMARY KEY, label TEXT, datatype TEXT, is_multiple INTEGER);
		CREATE TABLE custom_column_1 (id INTEGER PRIMARY KEY, value TEXT);
		CREATE TABLE books_custom_column_1_link (id INTEGER PRIMARY KEY, book INTEGER, value INTEGER);
		INSERT INTO books VALUES
			(1, '${BOOK}', 'Frankenstein', 1, '2026-11-20 10:00:00+00:00', '1818-01-01 00:00:00+00:00', 'Mary Shelley/Frankenstein (1)', 1),
			(2, '${NEWS}', 'The Paper [Sat, 14 Nov 2026]', 1, '2026-11-14 10:00:00+00:00', '0101-01-01 00:00:00+00:00', 'calibre/The Paper (2)', 0);
		INSERT INTO authors VALUES (1, 'Mary Shelley', 'Shelley, Mary');
		INSERT INTO books_authors_link (book, author) VALUES (1, 1), (2, 1);
		INSERT INTO tags VALUES (1, 'Gothic'), (2, 'News');
		INSERT INTO books_tags_link (book, tag) VALUES (1, 1), (2, 2);
		INSERT INTO data (book, format, name) VALUES (1, 'EPUB', 'Frankenstein');
		INSERT INTO comments (book, text) VALUES (1, '<p>One &amp; two.</p><p>Three</p>');
		INSERT INTO custom_columns VALUES (1, 'collection', 'text', 0);
		INSERT INTO custom_column_1 VALUES (1, 'Gothic shelf');
		INSERT INTO books_custom_column_1_link (book, value) VALUES (1, 1);
	`);
	db.close();
});

afterAll(() => rmSync(root, { recursive: true, force: true }));

describe('local Calibre', () => {
	it('reads books, keeps news apart, and leaves metadata.db unchanged', async () => {
		const before = readFileSync(join(root, 'metadata.db'));
		const { snapshot, files } = readCalibreSnapshot(root);
		expect(readFileSync(join(root, 'metadata.db')).equals(before)).toBe(true);
		expect(snapshot.books.map((b) => b.id)).toEqual([BOOK]);
		expect(snapshot.books[0]).toMatchObject({
			description: 'One & two.\n\nThree',
			collection: 'Gothic shelf',
			pubYear: '1818',
			addedAt: '2026-11-20'
		});
		expect(snapshot.news[0].pubYear).toBeUndefined();

		const library = createSnapshotLibrary(snapshot, {
			now: new Date('2026-11-23T12:00:00Z'),
			fileUrl: (b) => (b.formats.includes('EPUB') ? `/f/${b.id}` : null)
		});
		expect((await library.allBooks()).length).toBe(1);
		expect((await library.recentlyAdded()).thisWeek[0].id).toBe(BOOK);
		expect((await library.shelves('collection'))[0].name).toBe('Gothic shelf');
		expect((await library.latestPeriodicals())[0].publication).toBe('The Paper');
		expect((await library.book(NEWS))?.book.id).toBe(NEWS);
		expect(await library.bookFileUrl(BOOK)).toBe(`/f/${BOOK}`);
		expect(await library.bookFileUrl(NEWS)).toBeNull();
		expect(fileForRequest(`/book/${BOOK}.epub`, root, files)?.type).toBe('application/epub+zip');
	});

	it('refuses paths outside known book files', () => {
		const { files } = readCalibreSnapshot(root);
		expect(fileForRequest('/book/../../etc/passwd', root, files)).toBeNull();
		expect(fileForRequest(`/book/${NEWS}.epub`, root, files)).toBeNull();
		expect(fileForRequest(`/cover/${BOOK}.epub`, root, files)).toBeNull();
		files.epub.set(NEWS, '/etc/hostname');
		expect(fileForRequest(`/book/${NEWS}.epub`, root, files)).toBeNull();
	});

	it('is empty in a production build even with the flag set', async () => {
		process.env.LONGSHELF_LOCAL_CALIBRE = '1';
		process.env.LONGSHELF_CALIBRE_LIBRARY = root;
		try {
			const plugin = localCalibre();
			(plugin.config as (c: object, e: { command: string }) => void)({}, { command: 'build' });
			const load = plugin.load as (id: string) => string;
			expect(load('\0virtual:longshelf/calibre')).toBe('export default null;');
		} finally {
			delete process.env.LONGSHELF_LOCAL_CALIBRE;
			delete process.env.LONGSHELF_CALIBRE_LIBRARY;
		}
	});

	it('parses text helpers', () => {
		expect(htmlToText('<script>x</script><p>A&nbsp;&#8212; B</p>')).toBe('A — B');
		expect(parseIssueTitle('Plain')).toEqual({ publication: 'Plain', label: 'Plain' });
	});
});
