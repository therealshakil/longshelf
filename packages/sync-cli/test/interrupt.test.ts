import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { HashCache } from '../src/hash-cache.ts';
import { runLibrary } from '../src/library.ts';
import { MirrorClient } from '../src/upload.ts';

// Spec 003 FR-007: Ctrl-C while the plan request is in flight must still learn the run id, or the
// server takes the upload lock after the CLI has gone and the re-run is refused for hours.
const FIXTURE = join(import.meta.dirname, 'fixtures/library');
const work = mkdtempSync(join(tmpdir(), 'longshelf-interrupt-'));
afterAll(() => rmSync(work, { recursive: true, force: true }));

describe('Ctrl-C during the plan request', () => {
	it('hands the caller the pending run id before the server answers', async () => {
		let answerPlan!: () => void;
		const planAnswered = new Promise<void>((r) => (answerPlan = r));
		const fetchImpl = (async (url: string) => {
			if (!url.endsWith('/api/ingest/plan')) return Response.json({ ok: true });
			await planAnswered;
			return Response.json({
				runId: 'r1',
				missingBlobs: [],
				changedBooks: [],
				newBooks: [],
				removedBooks: [],
				removalNeedsConfirm: false
			});
		}) as unknown as typeof fetch;

		let pending: Promise<string | null> | null = null;
		const sawPending = new Promise<void>((resolve) => {
			void runLibrary(
				{
					library: FIXTURE,
					client: new MirrorClient(
						{ url: 'https://mirror', clientId: 'i', clientSecret: 's' },
						fetchImpl
					),
					cache: new HashCache(join(work, 'cache.json')),
					dryRun: true,
					confirm: async () => false,
					onRun: (id) => {
						if (id && !pending) {
							pending = id;
							resolve();
						}
					}
				},
				'mirror'
			);
		});

		await sawPending; // the plan request is still unanswered here
		answerPlan();
		await expect(pending).resolves.toBe('r1');
	});
});
