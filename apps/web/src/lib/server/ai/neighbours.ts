/**
 * Precomputed closest matches (spec 002 US5, research R6). Comparing every pair of books is too
 * much CPU for a Worker request, so `pnpm ai:neighbours` does it on the operator's machine and
 * requests read only the rows they need.
 */
import { titleKey } from '@ribbon/shared/library';
import { decodeVector } from './embeddings.ts';
import { MODELS } from './models.ts';
import { MIN_SIMILARITY, SAME_WORK_SIMILARITY, type Neighbour } from './suggest.ts';

/** Enough to survive exclusions (read, dismissed, per-author limits) and still fill a shelf. */
export const NEIGHBOURS_KEPT = 24;
const WRITE_BATCH = 50;

export interface NeighbourEntry {
	id: string;
	title: string;
	vector: Float32Array;
}

export interface NeighbourRow {
	neighbours: Neighbour[];
	copies: string[];
}

function unit(v: Float32Array) {
	let sum = 0;
	for (const n of v) sum += n * n;
	const size = Math.sqrt(sum);
	return size ? v.map((n) => n / size) : null;
}

export function buildNeighbours(
	entries: NeighbourEntry[],
	keep = NEIGHBOURS_KEPT
): Map<string, NeighbourRow> {
	const units = entries.map((e) => unit(e.vector));
	const titles = entries.map((e) => titleKey(e.title));
	const found = entries.map(() => [] as Neighbour[]);
	const copies = entries.map(() => [] as string[]);
	for (let i = 0; i < entries.length; i++) {
		const a = units[i];
		if (!a) continue;
		for (let j = i + 1; j < entries.length; j++) {
			const b = units[j];
			if (!b || a.length !== b.length) continue;
			let score = 0;
			for (let d = 0; d < a.length; d++) score += a[d] * b[d];
			if (score < MIN_SIMILARITY) continue;
			found[i].push({ id: entries[j].id, score });
			found[j].push({ id: entries[i].id, score });
			if (score >= SAME_WORK_SIMILARITY && titles[i] === titles[j]) {
				copies[i].push(entries[j].id);
				copies[j].push(entries[i].id);
			}
		}
	}
	return new Map(
		entries.map((e, i) => [
			e.id,
			{ neighbours: found[i].sort((x, y) => y.score - x.score).slice(0, keep), copies: copies[i] }
		])
	);
}

const encode = (row: NeighbourRow) =>
	JSON.stringify(row.neighbours.map((n) => [n.id, Math.round(n.score * 10000) / 10000]));

export const decodeNeighbours = (json: string): Neighbour[] =>
	(JSON.parse(json) as [string, number][]).map(([id, score]) => ({ id, score }));

/** Rebuild from stored vectors, writing only rows that changed. */
export async function saveNeighbours(
	db: D1Database,
	titles: Map<string, string>,
	model: string = MODELS.embedding
) {
	const { results } = await db
		.prepare('SELECT book_id, vector FROM book_embedding WHERE model = ?')
		.bind(model)
		.all<{ book_id: string; vector: ArrayBuffer | Uint8Array | number[] }>();
	const entries = results.flatMap((r) => {
		const title = titles.get(r.book_id);
		return title ? [{ id: r.book_id, title, vector: decodeVector(r.vector) }] : [];
	});
	const built = buildNeighbours(entries);
	const { results: stored } = await db
		.prepare('SELECT book_id, model, neighbours, copies FROM book_neighbours')
		.all<{ book_id: string; model: string; neighbours: string; copies: string | null }>();
	const old = new Map(stored.map((r) => [r.book_id, r]));

	const put = db.prepare(
		'INSERT OR REPLACE INTO book_neighbours (book_id, model, neighbours, copies) VALUES (?, ?, ?, ?)'
	);
	const remove = db.prepare('DELETE FROM book_neighbours WHERE book_id = ?');
	const writes: D1PreparedStatement[] = [];
	let changed = 0;
	for (const [id, row] of built) {
		const neighbours = encode(row);
		const copies = row.copies.length ? JSON.stringify(row.copies) : null;
		const was = old.get(id);
		if (was?.model === model && was.neighbours === neighbours && was.copies === copies) continue;
		writes.push(put.bind(id, model, neighbours, copies));
		changed++;
	}
	const gone = stored.filter((r) => !built.has(r.book_id));
	for (const r of gone) writes.push(remove.bind(r.book_id));
	for (let i = 0; i < writes.length; i += WRITE_BATCH)
		await db.batch(writes.slice(i, i + WRITE_BATCH));
	return { books: built.size, changed, removed: gone.length };
}
