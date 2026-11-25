import { describe, expect, it } from 'vitest';
import { PART_SIZE, SINGLE_PUT_MAX } from '@longshelf/shared/ingest';
import { EXIT, RunError } from '../src/report.ts';
import { MirrorClient, partStarts, uploadAll, type BlobSource } from '../src/upload.ts';

const creds = {
	url: 'https://library.example',
	clientId: 'id.access',
	clientSecret: 'secret'
};
type Call = {
	url: string;
	method: string;
	size: number;
	headers: Record<string, string>;
};

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
			return Response.json({
				part: Number(input.match(/\/(\d+)\?/)![1]),
				etag: 'e'
			});
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
		await new MirrorClient(creds, impl, 0).abort('run');
		expect(calls[0].headers['CF-Access-Client-Id']).toBe('id.access');
		expect(calls[0].headers['CF-Access-Client-Secret']).toBe('secret');
	});

	it('puts a file up to 95 MB in one request', async () => {
		const { impl, calls } = fakeFetch();
		await new MirrorClient(creds, impl, 0).putBlob('run', memory(SINGLE_PUT_MAX));
		expect(calls).toHaveLength(1);
		expect(calls[0]).toMatchObject({ method: 'PUT', size: SINGLE_PUT_MAX });
	});

	it('splits a larger file into equal parts, the last one short', async () => {
		const size = SINGLE_PUT_MAX + 1;
		const count = Math.ceil(size / PART_SIZE);
		expect(partStarts(size)).toEqual(Array.from({ length: count }, (_, i) => i * PART_SIZE));
		const { impl, calls } = fakeFetch();
		await new MirrorClient(creds, impl, 0).putBlob('run', memory(size));
		const parts = calls.filter((c) => /\/multipart\/u1\/\d+\?/.test(c.url));
		expect(parts.map((p) => p.size)).toEqual([
			...Array(count - 1).fill(PART_SIZE),
			size - (count - 1) * PART_SIZE
		]);
		expect(calls.at(-1)!.url).toContain('/complete?');
	});

	it('maps a refused key or an Access redirect to exit 2 with the next step', async () => {
		for (const status of [403, 302]) {
			const body = status === 403 ? 'Sign in to Longshelf to continue.' : null;
			const { impl } = fakeFetch(() => new Response(body, { status }));
			const err = await new MirrorClient(creds, impl, 0).abort('run').catch((e) => e);
			expect(err).toBeInstanceOf(RunError);
			expect(err.code).toBe(EXIT.notConfigured);
			expect(err.message).toMatch(/longshelf config set client-id/);
		}
	});

	it('keeps the message of a 403 that is not about the key', async () => {
		const { impl } = fakeFetch(
			() =>
				new Response('Cross-site PUT form submissions are forbidden', {
					status: 403
				})
		);
		const err = await new MirrorClient(creds, impl, 0).abort('run').catch((e) => e);
		expect(err).not.toBeInstanceOf(RunError);
		expect(err.message).toMatch(/Cross-site/);
	});

	it('marks uploads as raw bytes', async () => {
		const { impl, calls } = fakeFetch();
		await new MirrorClient(creds, impl, 0).putBlob('run', memory(10));
		expect(calls[0].headers['content-type']).toBe('application/octet-stream');
	});

	it('maps a held lock on plan to exit 3', async () => {
		const { impl } = fakeFetch(() =>
			Response.json(
				{ error: 'Another upload is running.', detail: 'expires soon' },
				{ status: 409 }
			)
		);
		const err = await new MirrorClient(creds, impl, 0).plan({ books: [] }).catch((e) => e);
		expect(err.code).toBe(EXIT.locked);
	});
});

describe('retries', () => {
	it('retries a dropped connection and a 5xx, then succeeds', async () => {
		let n = 0;
		const impl = (async () => {
			n++;
			if (n === 1) throw new TypeError('fetch failed', { cause: { code: 'ECONNRESET' } });
			if (n === 2) return new Response('busy', { status: 503 });
			return Response.json({ ok: true });
		}) as unknown as typeof fetch;
		await new MirrorClient(creds, impl, 0).abort('run');
		expect(n).toBe(3);
	});

	it('gives up after three tries and names the cause', async () => {
		const impl = (async () => {
			throw new TypeError('fetch failed', {
				cause: { code: 'UND_ERR_HEADERS_TIMEOUT' }
			});
		}) as unknown as typeof fetch;
		const err = await new MirrorClient(creds, impl, 0).abort('run').catch((e) => e);
		expect(err.message).toMatch(/after 3 tries \(UND_ERR_HEADERS_TIMEOUT\)/);
	});

	it('does not retry a refusal', async () => {
		let n = 0;
		const impl = (async () => {
			n++;
			return Response.json({ error: 'Some files were not uploaded yet.' }, { status: 409 });
		}) as unknown as typeof fetch;
		await new MirrorClient(creds, impl, 0).abort('run').catch(() => {});
		expect(n).toBe(1);
	});
});

describe('uploadAll', () => {
	it('uploads largest first, four at a time', async () => {
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
			[1, 5, 3, 4, 2, 6].map((size) => memory(size))
		);
		expect(most).toBe(4);
		expect(order.slice(0, 4).sort()).toEqual([3, 4, 5, 6]);
	});
});
