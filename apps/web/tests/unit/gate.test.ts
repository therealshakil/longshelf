import { describe, expect, it } from 'vitest';
import { allowed, refusal } from '../../src/lib/server/mirror/gate.ts';

const owner = { kind: 'owner', email: 'owner@example.com' } as const;
const cli = { kind: 'cli' } as const;

describe('gate', () => {
	it('refuses everything without an identity (FR-015)', () => {
		for (const path of [
			'/',
			'/library',
			'/api/catalog',
			'/api/files/x',
			'/api/progress',
			'/api/ingest/plan'
		])
			expect(allowed(path, null, false)).toBe(false);
	});

	it('lets the owner browse but not ingest, and the CLI ingest but not browse (FR-017)', () => {
		expect(allowed('/library', owner, false)).toBe(true);
		expect(allowed('/api/ingest/plan', owner, false)).toBe(false);
		expect(allowed('/api/ingest/plan', cli, false)).toBe(true);
		expect(allowed('/api/catalog', cli, false)).toBe(false);
		expect(allowed('/api/progress', owner, false)).toBe(true);
		expect(allowed('/api/progress', cli, false)).toBe(false);
	});

	it('allows anything in a local run', () => {
		expect(allowed('/api/ingest/plan', null, true)).toBe(true);
	});

	it('refuses with plain text and noindex (FR-018)', async () => {
		const r = refusal();
		expect(r.status).toBe(403);
		expect(r.headers.get('x-robots-tag')).toBe('noindex, nofollow');
		expect(await r.text()).not.toMatch(/[{}]/);
	});
});
