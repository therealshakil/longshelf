/**
 * Talks to the mirror's ingest API (specs/003-library-mirror/contracts/ingest-api.md) with the
 * Cloudflare Access service token. Files up to 95 MB go up in one request; larger ones in 50 MB
 * parts (research R1). Two uploads at a time, largest first.
 */
import { open } from 'node:fs/promises';
import {
	PART_SIZE,
	SINGLE_PUT_MAX,
	type BlobKind,
	type BooksRequest,
	type CommitRequest,
	type CommitResponse,
	type PlanRequest,
	type PlanResponse
} from '@longshelf/shared/ingest';
import { EXIT, RunError } from './report.ts';

export interface Credentials {
	url: string;
	clientId: string;
	clientSecret: string;
}

export interface BlobSource {
	sha256: string;
	size: number;
	kind: BlobKind;
	/** A file on disk, or bytes already in memory (the catalogue). */
	path?: string;
	bytes?: Uint8Array;
}

/** Raw bytes; without a content type SvelteKit treats a PUT as a cross-site form post. */
const OCTETS = { 'content-type': 'application/octet-stream' };

const REFUSED =
	'The mirror refused the upload key. Set a new one: longshelf config set client-id <id>, then longshelf config set client-secret <secret>.';

export class MirrorClient {
	readonly creds: Credentials;
	private readonly fetchImpl: typeof fetch;
	constructor(creds: Credentials, fetchImpl: typeof fetch = fetch) {
		this.creds = creds;
		this.fetchImpl = fetchImpl;
	}

	private async call(path: string, init: RequestInit = {}): Promise<Response> {
		const res = await this.fetchImpl(`${this.creds.url}${path}`, {
			...init,
			redirect: 'manual',
			headers: {
				'CF-Access-Client-Id': this.creds.clientId,
				'CF-Access-Client-Secret': this.creds.clientSecret,
				...(init.headers ?? {})
			}
		});
		// Access answers a refused token with its sign-in redirect; the Worker's gate with 401/403
		// and its own refusal text. Other 403s (e.g. a framework check) keep their message.
		if (res.status >= 300 && res.status < 400) throw new RunError(EXIT.notConfigured, REFUSED);
		if (res.status === 401 || res.status === 403) {
			const text = await res.text();
			if (res.status === 401 || /sign in|access/i.test(text))
				throw new RunError(EXIT.notConfigured, REFUSED);
			throw new Error(`The mirror refused ${path.split('?')[0]}: ${text.slice(0, 200)}`);
		}
		if (!res.ok) {
			const problem = (await res.json().catch(() => null)) as {
				error?: string;
				detail?: string;
			} | null;
			const message = problem?.error
				? `${problem.error}${problem.detail ? ` (${problem.detail})` : ''}`
				: `The mirror answered ${res.status} for ${path}.`;
			if (res.status === 409 && path === '/api/ingest/plan')
				throw new RunError(EXIT.locked, `${message} Try again after it finishes or expires.`);
			throw new Error(message);
		}
		return res;
	}

	private post = async <T>(path: string, data: unknown): Promise<T> =>
		(await (
			await this.call(path, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(data)
			})
		).json()) as T;

	plan = (req: PlanRequest) => this.post<PlanResponse>('/api/ingest/plan', req);
	books = (req: BooksRequest) => this.post<{ written: number }>('/api/ingest/books', req);
	commit = (req: CommitRequest) => this.post<CommitResponse>('/api/ingest/commit', req);
	abort = (runId: string) => this.post<{ ok: true }>('/api/ingest/abort', { runId });

	/** Uploads one object, in one request or in parts. */
	async putBlob(runId: string, blob: BlobSource) {
		const base = `/api/ingest/blobs/${blob.sha256}`;
		const q = `run=${encodeURIComponent(runId)}&kind=${blob.kind}`;
		if (blob.size <= SINGLE_PUT_MAX) {
			await this.call(`${base}?${q}`, {
				method: 'PUT',
				headers: OCTETS,
				body: await readRange(blob, 0, blob.size)
			});
			return;
		}
		const { uploadId } = await this.post<{ uploadId: string }>(
			`${base}/multipart?${q}&size=${blob.size}`,
			{}
		);
		try {
			const parts: { part: number; etag: string }[] = [];
			for (const [i, start] of partStarts(blob.size).entries()) {
				const end = Math.min(start + PART_SIZE, blob.size);
				const res = await this.call(`${base}/multipart/${uploadId}/${i + 1}?${q}`, {
					method: 'PUT',
					headers: OCTETS,
					body: await readRange(blob, start, end)
				});
				parts.push((await res.json()) as { part: number; etag: string });
			}
			await this.post(`${base}/multipart/${uploadId}/complete?${q}&size=${blob.size}`, { parts });
		} catch (err) {
			await this.call(`${base}/multipart/${uploadId}?${q}`, { method: 'DELETE' }).catch(() => {});
			throw err;
		}
	}
}

/** Where each 50 MB part starts. */
export const partStarts = (size: number) =>
	Array.from({ length: Math.max(1, Math.ceil(size / PART_SIZE)) }, (_, i) => i * PART_SIZE);

async function readRange(blob: BlobSource, start: number, end: number): Promise<Uint8Array> {
	if (blob.bytes) return blob.bytes.subarray(start, end);
	const handle = await open(blob.path!, 'r');
	try {
		const buffer = new Uint8Array(end - start);
		let read = 0;
		while (read < buffer.length) {
			const { bytesRead } = await handle.read(buffer, read, buffer.length - read, start + read);
			if (!bytesRead) throw new Error(`${blob.path} is shorter than expected.`);
			read += bytesRead;
		}
		return buffer;
	} finally {
		await handle.close();
	}
}

/** Largest first, `concurrency` at a time; calls `onDone` after each. Stops at the first error. */
export async function uploadAll(
	client: MirrorClient,
	runId: string,
	blobs: BlobSource[],
	onDone: (blob: BlobSource) => void = () => {},
	concurrency = 2
) {
	const queue = [...blobs].sort((a, b) => b.size - a.size);
	const worker = async () => {
		for (let blob = queue.shift(); blob; blob = queue.shift()) {
			await client.putBlob(runId, blob);
			onDone(blob);
		}
	};
	await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker));
}
