/**
 * A real local D1 and R2 for mirror tests (miniflare through wrangler's getPlatformProxy), with
 * the migrations applied. Nothing persists and nothing remote is used.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getPlatformProxy } from 'wrangler';
import type { Store } from '../../src/lib/server/mirror/blobs.ts';

const MIGRATIONS = join(import.meta.dirname, '../../migrations');

const statements = (sql: string) =>
	sql
		.replace(/--.*$/gm, '')
		.split(';')
		.map((s) => s.trim())
		.filter(Boolean);

export async function mirrorEnv() {
	const proxy = await getPlatformProxy<Env>({
		configPath: join(import.meta.dirname, '../../wrangler.jsonc'),
		persist: false,
		remoteBindings: false
	});
	const db = proxy.env.DB;
	for (const file of readdirSync(MIGRATIONS).sort())
		await db.batch(
			statements(readFileSync(join(MIGRATIONS, file), 'utf8')).map((s) => db.prepare(s))
		);
	const store: Store = { db, bucket: proxy.env.BUCKET };
	const reset = async () => {
		await db.batch(
			['book_file', 'book', 'blob', 'catalog', 'ingest_run', 'reading_place'].map((t) =>
				db.prepare(`DELETE FROM ${t}`)
			)
		);
		const listed = await store.bucket.list();
		if (listed.objects.length) await store.bucket.delete(listed.objects.map((o) => o.key));
	};
	return { store, reset, dispose: () => proxy.dispose() };
}

export async function sha256Hex(bytes: Uint8Array | string) {
	const data = typeof bytes === 'string' ? new TextEncoder().encode(bytes) : bytes;
	const digest = await crypto.subtle.digest('SHA-256', data);
	return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
