import { mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { HashCache, sha256Of } from '../src/hash-cache.ts';

let dir: string;
beforeEach(() => (dir = mkdtempSync(join(tmpdir(), 'longshelf-hash-'))));
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe('HashCache', () => {
	it('hashes once, then reuses the hash until size or mtime changes', async () => {
		const file = join(dir, 'a.epub');
		writeFileSync(file, 'one');
		const cachePath = join(dir, 'cache.json');
		const first = new HashCache(cachePath);
		expect((await first.hash(file)).sha256).toBe(sha256Of('one'));
		first.save();

		const second = new HashCache(cachePath);
		await second.hash(file);
		expect(second.hashed).toBe(0);

		writeFileSync(file, 'two');
		utimesSync(file, new Date(), new Date(Date.now() + 5000));
		expect((await second.hash(file)).sha256).toBe(sha256Of('two'));
		expect(second.hashed).toBe(1);
	});

	it('starts empty when the cache file is damaged', async () => {
		const cachePath = join(dir, 'cache.json');
		writeFileSync(cachePath, '{not json');
		const file = join(dir, 'b.pdf');
		writeFileSync(file, 'pdf');
		const cache = new HashCache(cachePath);
		expect((await cache.hash(file)).size).toBe(3);
	});
});
