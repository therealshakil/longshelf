/**
 * Book text profiles and their embeddings (spec 002 US5, research R6). The operator job embeds
 * only new or changed books, in small batches inside the spend guard, and can be run again to
 * continue. Vectors stay in the owner's D1 database.
 */
import { error } from '@sveltejs/kit';
import type { EmbeddingJobResult } from '@ribbon/shared/ai';
import type { Book } from '@ribbon/shared/library';
import { check, record, type GuardStore } from './guard.ts';
import { estimateNeurons, MODELS, tokensOf } from './models.ts';

const MAX_DESCRIPTION_CHARS = 2000;
const BATCH_SIZE = 24;
/** One request does a bounded amount, so it stays inside Worker request limits. */
const MAX_BATCHES = 6;

type StopReason = NonNullable<EmbeddingJobResult['stopped']>;

const ENTITIES: Record<string, string> = {
	amp: '&',
	lt: '<',
	gt: '>',
	quot: '"',
	apos: "'",
	nbsp: ' '
};

/** Calibre descriptions are often HTML. */
const plainText = (html: string) =>
	html
		.replace(/<[^>]*>/g, ' ')
		.replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, e: string) => ENTITIES[e])
		.replace(/\s+/g, ' ')
		.trim();

/** The text that represents a book: title, author, genres and description. */
export function bookProfile(book: Book): string {
	const title = book.subtitle ? `${book.title}: ${book.subtitle}` : book.title;
	const description = plainText(book.description ?? '').slice(0, MAX_DESCRIPTION_CHARS);
	return [
		`Title: ${title}`,
		book.authors.length ? `Author: ${book.authors.map((a) => a.name).join(', ')}` : '',
		book.tags.length ? `Genres: ${book.tags.join(', ')}` : '',
		description ? `Description: ${description}` : ''
	]
		.filter(Boolean)
		.join('\n');
}

/** Changes when the profile or the model changes, so either causes a rebuild. */
export async function profileHash(profile: string, model: string = MODELS.embedding) {
	const bytes = new TextEncoder().encode(`${model}\n${profile}`);
	const digest = await crypto.subtle.digest('SHA-256', bytes);
	return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const encodeVector = (vector: number[]): ArrayBuffer =>
	new Float32Array(vector).buffer as ArrayBuffer;

/** D1 can return a BLOB as an ArrayBuffer, bytes or an array of numbers. */
export function decodeVector(blob: ArrayBuffer | Uint8Array | number[]): Float32Array {
	const bytes =
		blob instanceof ArrayBuffer
			? new Uint8Array(blob)
			: Array.isArray(blob)
				? Uint8Array.from(blob)
				: blob;
	return new Float32Array(bytes.slice().buffer);
}

function vectorsFrom(out: unknown, count: number): number[][] | null {
	const data = (out as { data?: unknown })?.data;
	if (!Array.isArray(data) || data.length !== count) return null;
	const size = (data[0] as unknown[] | undefined)?.length;
	const valid = data.every(
		(v) =>
			Array.isArray(v) &&
			v.length === size &&
			v.length > 0 &&
			v.every((n) => typeof n === 'number' && Number.isFinite(n))
	);
	return valid ? (data as number[][]) : null;
}

export async function embedLibrary(o: {
	ai: Ai | null;
	db: D1Database;
	store: GuardStore;
	books: Book[];
	now?: Date;
}): Promise<EmbeddingJobResult> {
	const { ai, db, store, books } = o;
	const model = MODELS.embedding;
	const { results: stored } = await db
		.prepare('SELECT book_id, profile_hash FROM book_embedding')
		.all<{ book_id: string; profile_hash: string }>();
	const hashes = new Map(stored.map((r) => [r.book_id, r.profile_hash]));

	const inLibrary = new Set(books.map((b) => b.id));
	const gone = stored.filter((r) => !inLibrary.has(r.book_id));
	if (gone.length) {
		const remove = db.prepare('DELETE FROM book_embedding WHERE book_id = ?');
		await db.batch(gone.map((r) => remove.bind(r.book_id)));
	}

	const profiles = await Promise.all(
		books.map(async (book) => {
			const text = bookProfile(book);
			return { id: book.id, text, hash: await profileHash(text, model) };
		})
	);
	const todo = profiles.filter((p) => hashes.get(p.id) !== p.hash);
	let embedded = 0;
	const result = (stopped?: StopReason): EmbeddingJobResult => ({
		total: books.length,
		embedded,
		unchanged: books.length - todo.length,
		removed: gone.length,
		remaining: todo.length - embedded,
		...(stopped ? { stopped } : {})
	});
	const stop = (reason: StopReason) => {
		if (!embedded) error(503, JSON.stringify({ reason }));
		return result(reason);
	};

	for (let i = 0; i < MAX_BATCHES && embedded < todo.length; i++) {
		const batch = todo.slice(embedded, embedded + BATCH_SIZE);
		const texts = batch.map((p) => p.text);
		const tokens = tokensOf(texts.join('\n'));
		const cost = estimateNeurons(model, tokens, 0);
		if (!ai) return stop('offline');
		const guard = await check(store, cost);
		if (!guard.ok) return stop(guard.reason);
		let vectors: number[][] | null;
		try {
			const out = await (ai.run as (m: string, i: unknown) => Promise<unknown>)(model, {
				text: texts
			});
			vectors = vectorsFrom(out, batch.length);
		} catch (e) {
			console.error('Workers AI call failed:', model, e instanceof Error ? e.message : e);
			return stop('offline');
		}
		if (!vectors) {
			console.error('Workers AI returned unusable embeddings:', model);
			return stop('offline');
		}
		await record(store, cost);
		const at = (o.now ?? new Date()).toISOString();
		const save = db.prepare(
			`INSERT OR REPLACE INTO book_embedding (book_id, profile_hash, vector, model, created_at)
			 VALUES (?, ?, ?, ?, ?)`
		);
		const saved = vectors;
		await db.batch(batch.map((p, j) => save.bind(p.id, p.hash, encodeVector(saved[j]), model, at)));
		embedded += batch.length;
	}
	return result();
}
