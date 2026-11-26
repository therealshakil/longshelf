/**
 * Reading places on the mirror (specs/004-reading/contracts/progress-api.md): one row per book
 * and device in `reading_place`, and an upsert that only ever moves a row forward in time
 * (FR-011). Owner-only through the gate, like every browser route.
 */
import {
	clampReadAt,
	ProgressPutSchema,
	type Place,
	type PlaceKey,
	type ProgressPutResult
} from '@longshelf/shared/progress';
import { body } from './http.ts';
import { ROBOTS } from './gate.ts';

interface Row {
	book_id: string;
	device_id: string;
	device_name: string;
	percent: number;
	chapter_label: string;
	href: string;
	fraction: number;
	cfi: string | null;
	file_sha256: string | null;
	furthest_percent: number;
	furthest_href: string;
	read_at: string;
}

const toPlace = (r: Row): Place => ({
	bookId: r.book_id,
	deviceId: r.device_id,
	deviceName: r.device_name,
	percent: r.percent,
	chapterLabel: r.chapter_label,
	href: r.href,
	fraction: r.fraction,
	...(r.cfi ? { cfi: r.cfi } : {}),
	...(r.file_sha256 ? { fileSha256: r.file_sha256 } : {}),
	furthestPercent: r.furthest_percent,
	furthestHref: r.furthest_href,
	readAt: r.read_at
});

const HEADERS = {
	'content-type': 'application/json; charset=utf-8',
	'cache-control': 'private, no-cache',
	'x-robots-tag': ROBOTS
};

/** Every place, with a weak ETag from the newest arrival and the row count. */
export async function getProgress(db: D1Database, request: Request): Promise<Response> {
	const meta = await db
		.prepare('SELECT max(received_at) AS newest, count(*) AS n FROM reading_place')
		.first<{ newest: string | null; n: number }>();
	const etag = `W/"${meta?.newest ?? '0'}-${meta?.n ?? 0}"`;
	if (request.headers.get('if-none-match') === etag)
		return new Response(null, { status: 304, headers: { ...HEADERS, etag } });
	const { results } = await db.prepare('SELECT * FROM reading_place').all<Row>();
	return new Response(JSON.stringify({ places: results.map(toPlace) }), {
		headers: { ...HEADERS, etag }
	});
}

const UPSERT = `INSERT INTO reading_place (book_id, device_id, device_name, percent, chapter_label,
	href, fraction, cfi, file_sha256, furthest_percent, furthest_href, read_at, received_at)
	VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	ON CONFLICT (book_id, device_id) DO UPDATE SET
		device_name = excluded.device_name, percent = excluded.percent,
		chapter_label = excluded.chapter_label, href = excluded.href, fraction = excluded.fraction,
		cfi = excluded.cfi, file_sha256 = excluded.file_sha256,
		furthest_percent = excluded.furthest_percent, furthest_href = excluded.furthest_href,
		read_at = excluded.read_at, received_at = excluded.received_at
	WHERE excluded.read_at > reading_place.read_at`;

/**
 * Stores the places in one batch, each only if it is newer than the stored row. A place that
 * ends up as the stored row is accepted; one older than the stored row is stale. The browser
 * treats both as sent.
 */
export async function putProgress(
	db: D1Database,
	request: Request,
	now = Date.now()
): Promise<Response> {
	const { places } = await body(request, ProgressPutSchema);
	const received = new Date(now).toISOString();
	// One place per book and device: the newest, if a body repeats one.
	const latest = new Map<string, Place>();
	for (const p of places) {
		const place = { ...p, readAt: clampReadAt(p.readAt, now) };
		const key = `${p.bookId}\u0000${p.deviceId}`;
		const seen = latest.get(key);
		if (!seen || place.readAt > seen.readAt) latest.set(key, place);
	}
	const list = [...latest.values()];
	await db.batch(
		list.map((p) =>
			db
				.prepare(UPSERT)
				.bind(
					p.bookId,
					p.deviceId,
					p.deviceName,
					p.percent,
					p.chapterLabel,
					p.href,
					p.fraction,
					p.cfi ?? null,
					p.fileSha256 ?? null,
					p.furthestPercent,
					p.furthestHref,
					p.readAt,
					received
				)
		)
	);
	const stored = await db.batch<{ read_at: string }>(
		list.map((p) =>
			db
				.prepare('SELECT read_at FROM reading_place WHERE book_id = ? AND device_id = ?')
				.bind(p.bookId, p.deviceId)
		)
	);
	const result: ProgressPutResult = { accepted: [], stale: [] };
	list.forEach((p, i) => {
		const key: PlaceKey = { bookId: p.bookId, deviceId: p.deviceId, readAt: p.readAt };
		(stored[i].results[0]?.read_at === p.readAt ? result.accepted : result.stale).push(key);
	});
	return new Response(JSON.stringify(result), { headers: HEADERS });
}
