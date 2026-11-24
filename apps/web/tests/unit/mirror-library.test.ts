import { describe, expect, it, vi } from 'vitest';
import type { MirrorCatalog } from '@longshelf/shared/library/catalog';
import { createSampleLibrary } from '@longshelf/shared/sample';
import {
	fetchMirror,
	fileUrlFor,
	lazyLibrary,
	SignInNeeded
} from '../../src/lib/library/mirror.ts';

const sha = (c: string) => c.repeat(64);
const catalog: MirrorCatalog = {
	version: 1,
	readAt: '2026-11-24T12:00:00.000Z',
	books: [
		{
			id: 'b1',
			title: 'Dracula',
			authors: [{ id: 'a1', name: 'Bram Stoker', sort: 'Stoker, Bram' }],
			tags: [],
			formats: ['PDF', 'KEPUB', 'EPUB'],
			addedAt: '2026-11-20'
		}
	],
	news: [],
	files: {
		b1: [
			{ format: 'PDF', sha256: sha('a'), size: 1 },
			{ format: 'KEPUB', sha256: sha('b'), size: 1 },
			{ format: 'EPUB', sha256: sha('c'), size: 1 }
		]
	}
};

const respond = (res: Response) => vi.fn(async () => res) as unknown as typeof fetch;

describe('mirror library', () => {
	it('opens EPUB first, then KEPUB, and nothing else', () => {
		expect(fileUrlFor(catalog, 'b1')).toBe(`/api/files/${sha('c')}`);
		const kepubOnly = { ...catalog, files: { b1: catalog.files.b1.slice(0, 2) } };
		expect(fileUrlFor(kepubOnly, 'b1')).toBe(`/api/files/${sha('b')}`);
		expect(fileUrlFor({ ...catalog, files: { b1: [catalog.files.b1[0]] } }, 'b1')).toBeNull();
	});

	it('serves the catalogue through the snapshot code, with when it was read', async () => {
		const lib = await fetchMirror(respond(Response.json(catalog)));
		expect((await lib.allBooks()).map((b) => b.title)).toEqual(['Dracula']);
		expect(await lib.syncStatus()).toEqual({ state: 'up-to-date', lastSync: catalog.readAt });
		expect(await lib.bookFileUrl('b1')).toBe(`/api/files/${sha('c')}`);
	});

	it('is empty, needing attention, before the first upload', async () => {
		const lib = await fetchMirror(respond(new Response(null, { status: 404 })));
		expect(await lib.allBooks()).toEqual([]);
		expect((await lib.syncStatus()).state).toBe('attention');
	});

	it('asks to sign in again when Access redirects', async () => {
		await expect(
			fetchMirror(respond(new Response(null, { status: 302, headers: { location: '/x' } })))
		).rejects.toBeInstanceOf(SignInNeeded);
	});

	it('loads once, and retries after a failure', async () => {
		const load = vi
			.fn()
			.mockRejectedValueOnce(new Error('offline'))
			.mockResolvedValue(createSampleLibrary());
		const lib = lazyLibrary(load);
		await expect(lib.allBooks()).rejects.toThrow('offline');
		expect((await lib.allBooks()).length).toBeGreaterThan(0);
		await lib.syncStatus();
		expect(load).toHaveBeenCalledTimes(2);
	});
});
