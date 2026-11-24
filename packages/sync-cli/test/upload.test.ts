import { describe, expect, it } from 'vitest';
import { PART_SIZE, SINGLE_PUT_MAX } from '@longshelf/shared/ingest';
import { EXIT, RunError } from '../src/report.ts';
import { MirrorClient, partStarts, uploadAll, type BlobSource } from '../src/upload.ts';

const creds = { url: 'https://library.example', clientId: 'id.access', clientSecret: 'secret' };
type Call = { url: string; method: string; size: number; headers: Record<string, string> };

/** A fake mirror that records calls and answers each with `answer`. */
function fakeFetch(answer: (url: string, method: string) => Response = () => Response.json({})) {
	const calls: Call[] = [];
	const impl = (async (input: string, init: RequestInit = {}) => {
		const body = init.body as Uint8Array | string | undefined;
		calls.push({
			url: input,
			method: init.method ?? 'GET',
			size: typeof body === 'string' ? body.length : (body?.byteLength ?? 0),
			headers: init.headers as Record<string, string>
		});
		if (input.includes('/multipart?')) return Response.json({ uploadId: 'u1' });
		if (/\/multipart\/u1\/\d+\?/.test(input) && init.method === 'PUT')
			return Response.json({ part: Number(input.match(/\/(\d+)\?/)![1]), etag: 'e' });
		return answer(input, init.method ?? 'GET');
	}) as unknown as typeof fetch;
	return { impl, calls };
}

const memory = (size: number, kind: BlobSource['kind'] = 'file'): BlobSource => ({
	sha256: 'a'.repeat(64),
	size,
	kind,
	bytes: new Uint8Array(size)
});

describe('MirrorClient', () => {
	it('sends the Access service token on every call', async () => {
		const { impl, calls } = fakeFetch();
		await new MirrorClient(creds, impl).abort('run');
		expect(calls[0].headers['CF-Access-Client-Id']).toBe('id.access');
		expect(calls[0].headers['CF-Access-Client-Secret']).toBe('secret');
	});

	it('puts a file up to 95 MB in one request', async () => {
		const { impl, calls } = fakeFetch();
		await new MirrorClient(creds, impl).putBlob('run', memory(SINGLE_PUT_MAX));
		expect(calls).toHaveLength(1);
		expect(calls[0]).toMatchObject({ method: 'PUT', size: SINGLE_PUT_MAX });
	});

	it('splits a larger file into 50 MB parts, the last one short', async () => {
		const size = SINGLE_PUT_MAX + 1;
		expect(partStarts(size)).toEqual([0, PART_SIZE]);
		const { impl, calls } = fakeFetch();
		await new MirrorClient(creds, impl).putBlob('run', memory(size));
		const parts = calls.filter((c) => /\/multipart\/u1\/\d+\?/.test(c.url));
		expect(parts.map((p) => p.size)).toEqual([PART_SIZE, size - PART_SIZE]);
		expect(calls.at(-1)!.url).toContain('/complete?');
	});

	it('maps a refused key or an Access redirect to exit 2 with the next step', async () => {
		for (const status of [403, 302]) {
			const { impl } = fakeFetch(() => new Response(null, { status }));
			const err = await new MirrorClient(creds, impl).abort('run').catch((e) => e);
			expect(err).toBeInstanceOf(RunError);
			expect(err.code).toBe(EXIT.notConfigured);
			expect(err.message).toMatch(/longshelf config set client-id/);
		}
	});

	it('maps a held lock on plan to exit 3', async () => {
		const { impl } = fakeFetch(() =>
			Response.json(
				{ error: 'Another upload is running.', detail: 'expires soon' },
				{ status: 409 }
			)
		);
		const err = await new MirrorClient(creds, impl).plan({ books: [] }).catch((e) => e);
		expect(err.code).toBe(EXIT.locked);
	});
});

describe('uploadAll', () => {
	it('uploads largest first, two at a time', async () => {
		const order: number[] = [];
		let inFlight = 0;
		let most = 0;
		const client = {
			putBlob: async (_run: string, b: BlobSource) => {
				inFlight++;
				most = Math.max(most, inFlight);
				await new Promise((r) => setTimeout(r, 5));
				order.push(b.size);
				inFlight--;
			}
		} as unknown as MirrorClient;
		await uploadAll(
			client,
			'run',
			[1, 5, 3, 4].map((size) => memory(size))
		);
		expect(most).toBe(2);
		expect(order.slice(0, 2).sort()).toEqual([4, 5]);
	});
});
