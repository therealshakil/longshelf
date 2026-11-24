/**
 * Reading the mirror (specs/003-library-mirror/contracts/mirror-api.md): the current catalogue
 * with an ETag, covers (thumbnail first), and book files with Range support and a download name.
 * Everything streams from R2, so the Worker spends almost no CPU (research R2).
 */
import { Sha256Schema } from '@longshelf/shared/ingest';
import { keyOf, type Store } from './blobs.ts';

const IMMUTABLE = 'private, max-age=31536000, immutable';

const notFound = () => new Response('Not found', { status: 404 });
const badHash = () => new Response('Not a SHA-256', { status: 400 });

async function hasBlob(db: D1Database, sha256: string, kind: 'file' | 'cover') {
	return Boolean(
		await db.prepare('SELECT 1 FROM blob WHERE sha256 = ? AND kind = ?').bind(sha256, kind).first()
	);
}

export async function serveCatalog(store: Store, request: Request): Promise<Response> {
	const current = await store.db
		.prepare('SELECT sha256 FROM catalog WHERE id = 1')
		.first<{ sha256: string }>();
	if (!current) return notFound();
	const etag = `"${current.sha256}"`;
	const headers = { etag, 'cache-control': 'private, no-cache' };
	if (request.headers.get('if-none-match') === etag)
		return new Response(null, { status: 304, headers });
	const object = await store.bucket.get(keyOf('catalog', current.sha256));
	if (!object) return notFound();
	return new Response(object.body, {
		headers: { ...headers, 'content-type': 'application/json; charset=utf-8' }
	});
}

export async function serveCover(store: Store, sha256: string, full: boolean): Promise<Response> {
	if (!Sha256Schema.safeParse(sha256).success) return badHash();
	if (!(await hasBlob(store.db, sha256, 'cover'))) return notFound();
	const thumb = full ? null : await store.bucket.get(keyOf('thumb', sha256));
	const object = thumb ?? (await store.bucket.get(keyOf('cover', sha256)));
	if (!object) return notFound();
	return new Response(object.body, {
		headers: {
			'content-type': thumb ? 'image/webp' : 'image/jpeg',
			'cache-control': IMMUTABLE,
			etag: `"${sha256}${thumb ? '-t' : ''}"`
		}
	});
}

const TYPES: Record<string, string> = {
	epub: 'application/epub+zip',
	kepub: 'application/epub+zip',
	pdf: 'application/pdf',
	mobi: 'application/x-mobipocket-ebook',
	azw3: 'application/vnd.amazon.ebook',
	cbz: 'application/vnd.comicbook+zip',
	cbr: 'application/vnd.comicbook-rar'
};

/** A download name safe on every OS: no path or reserved characters, at most 120 characters. */
export function safeFilename(name: string): string {
	const cleaned = name
		.replace(/[/\\:*?"<>|]/g, '')
		.replace(/\p{Cc}/gu, '')
		.replace(/\s+/g, ' ')
		.trim();
	const dot = cleaned.lastIndexOf('.');
	const ext = dot > 0 ? cleaned.slice(dot) : '';
	const stem = (dot > 0 ? cleaned.slice(0, dot) : cleaned).slice(0, 120 - ext.length).trim();
	return (stem || 'book') + ext;
}

/** RFC 6266 / 5987: an ASCII fallback plus the UTF-8 name. */
export function contentDisposition(name: string): string {
	const safe = safeFilename(name);
	const ascii = safe.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
	return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(safe)}`;
}

function parseRange(
	header: string | null,
	size: number
): { offset: number; length: number } | null {
	const m = header && /^bytes=(\d*)-(\d*)$/.exec(header.trim());
	if (!m || (!m[1] && !m[2])) return null;
	if (!m[1]) {
		const length = Math.min(Number(m[2]), size);
		return { offset: size - length, length };
	}
	const offset = Number(m[1]);
	const end = m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
	return offset <= end ? { offset, length: end - offset + 1 } : null;
}

export async function serveFile(
	store: Store,
	sha256: string,
	request: Request,
	download: string | null
): Promise<Response> {
	if (!Sha256Schema.safeParse(sha256).success) return badHash();
	if (!(await hasBlob(store.db, sha256, 'file'))) return notFound();
	const key = keyOf('file', sha256);
	const head = await store.bucket.head(key);
	if (!head) return notFound();
	const ext = download?.split('.').pop()?.toLowerCase() ?? '';
	const headers: Record<string, string> = {
		'content-type': TYPES[ext] ?? 'application/octet-stream',
		'cache-control': IMMUTABLE,
		'accept-ranges': 'bytes',
		etag: `"${sha256}"`
	};
	if (download) headers['content-disposition'] = contentDisposition(download);
	const range = parseRange(request.headers.get('range'), head.size);
	if (range) {
		const object = await store.bucket.get(key, { range });
		if (!object) return notFound();
		return new Response(object.body, {
			status: 206,
			headers: {
				...headers,
				'content-length': String(range.length),
				'content-range': `bytes ${range.offset}-${range.offset + range.length - 1}/${head.size}`
			}
		});
	}
	const object = await store.bucket.get(key);
	if (!object) return notFound();
	return new Response(object.body, {
		headers: { ...headers, 'content-length': String(head.size) }
	});
}
