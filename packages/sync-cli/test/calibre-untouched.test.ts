import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { HashCache, sha256Of } from '../src/hash-cache.ts';
import { runLibrary } from '../src/library.ts';
import { MirrorClient } from '../src/upload.ts';

// Spec 003 SC-008: the Calibre library is byte-for-byte unchanged after any run.
const FIXTURE = join(import.meta.dirname, 'fixtures/library');
const work = mkdtempSync(join(tmpdir(), 'longshelf-untouched-'));
afterAll(() => rmSync(work, { recursive: true, force: true }));

function snapshot(dir: string): Record<string, string> {
	const out: Record<string, string> = {};
	const walk = (d: string) => {
		for (const name of readdirSync(d)) {
			const p = join(d, name);
			if (statSync(p).isDirectory()) walk(p);
			else out[p.slice(dir.length)] = `${statSync(p).mtimeMs}:${sha256Of(readFileSync(p))}`;
		}
	};
	walk(dir);
	return out;
}

describe('Calibre is only read', () => {
	it('leaves every file, and its modification time, unchanged after a run', async () => {
		const library = join(work, 'library');
		cpSync(FIXTURE, library, { recursive: true, preserveTimestamps: true });
		const before = snapshot(library);

		const plan = (await (async () => {
			const fetchImpl = (async (url: string) =>
				url.endsWith('/api/ingest/plan')
					? Response.json({
							runId: 'r',
							missingBlobs: [],
							changedBooks: [],
							newBooks: [],
							removedBooks: [],
							removalNeedsConfirm: false
						})
					: Response.json({ ok: true })) as unknown as typeof fetch;
			return runLibrary(
				{
					library,
					client: new MirrorClient(
						{ url: 'https://mirror', clientId: 'i', clientSecret: 's' },
						fetchImpl
					),
					cache: new HashCache(join(work, 'cache.json')),
					dryRun: true,
					confirm: async () => false
				},
				'mirror'
			);
		})()) as { total: number };

		expect(plan.total).toBe(6);
		expect(snapshot(library)).toEqual(before);
	});
});
