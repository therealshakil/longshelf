import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readCalibreSnapshot } from '../src/calibre.ts';
import { BOOK, makeLibrary, NEWS } from './make-library.ts';

let root: string;
let dir: string;
beforeAll(() => {
	root = mkdtempSync(join(tmpdir(), 'longshelf-cli-'));
	({ dir } = makeLibrary(root));
});
afterAll(() => rmSync(root, { recursive: true, force: true }));

describe('readCalibreSnapshot', () => {
	it('reads title sort and rating, and leaves metadata.db unchanged', () => {
		const before = readFileSync(join(root, 'metadata.db'));
		const { snapshot } = readCalibreSnapshot(root);
		expect(readFileSync(join(root, 'metadata.db')).equals(before)).toBe(true);
		expect(snapshot.books[0]).toMatchObject({
			id: BOOK,
			sort: 'Tale of Two Cities, A',
			rating: 4,
			formats: ['EPUB', 'PDF']
		});
	});

	it('omits sort when it equals the title, and rating when there is none', () => {
		const news = readCalibreSnapshot(root).snapshot.news[0];
		expect(news.id).toBe(NEWS);
		expect(news.sort).toBeUndefined();
		expect(news.rating).toBeUndefined();
	});

	it('lists every format with its path', () => {
		const { files } = readCalibreSnapshot(root);
		expect(files.byFormat.get(BOOK)).toEqual([
			{ format: 'EPUB', path: join(dir, 'A Tale of Two Cities.epub') },
			{ format: 'PDF', path: join(dir, 'A Tale of Two Cities.pdf') }
		]);
		expect(files.byFormat.get(NEWS)).toEqual([]);
	});
});
