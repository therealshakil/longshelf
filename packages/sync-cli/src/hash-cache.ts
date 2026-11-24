/**
 * SHA-256 of library files, cached by path, size and modification time so a run with nothing
 * changed rehashes nothing (spec 003 SC-002, research R8). The cache lives beside the config.
 */
import { createHash } from 'node:crypto';
import {
	createReadStream,
	existsSync,
	mkdirSync,
	readFileSync,
	statSync,
	writeFileSync
} from 'node:fs';
import { dirname, join } from 'node:path';
import { configDir } from './config.ts';

interface Entry {
	size: number;
	mtimeMs: number;
	sha256: string;
}

export class HashCache {
	readonly path: string;
	private entries: Record<string, Entry>;
	private dirty = false;
	hashed = 0;

	constructor(path = join(configDir(), 'hash-cache.json')) {
		this.path = path;
		try {
			this.entries = existsSync(path)
				? (JSON.parse(readFileSync(path, 'utf8')) as Record<string, Entry>)
				: {};
		} catch {
			this.entries = {}; // a damaged cache only costs a rehash
		}
	}

	/** The file's hash and size; rehashed only if its size or modification time changed. */
	async hash(file: string): Promise<{ sha256: string; size: number }> {
		const { size, mtimeMs } = statSync(file);
		const known = this.entries[file];
		if (known && known.size === size && known.mtimeMs === mtimeMs)
			return { sha256: known.sha256, size };
		const sha256 = await hashFile(file);
		this.entries[file] = { size, mtimeMs, sha256 };
		this.dirty = true;
		this.hashed++;
		return { sha256, size };
	}

	save() {
		if (!this.dirty) return;
		mkdirSync(dirname(this.path), { recursive: true, mode: 0o700 });
		writeFileSync(this.path, JSON.stringify(this.entries), { mode: 0o600 });
		this.dirty = false;
	}
}

export function hashFile(file: string): Promise<string> {
	return new Promise((done, fail) => {
		const h = createHash('sha256');
		createReadStream(file)
			.on('data', (chunk) => h.update(chunk))
			.on('error', fail)
			.on('end', () => done(h.digest('hex')));
	});
}

export const sha256Of = (data: string | Uint8Array) =>
	createHash('sha256').update(data).digest('hex');
