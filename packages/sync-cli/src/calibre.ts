/**
 * Reads a Calibre library read-only (DR-0009, spec 003). Shared by `pnpm dev:calibre` and the
 * longshelf CLI so both read Calibre the same way. `metadata.db` is opened read-only and never
 * written (Longshelf principle 2).
 */
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { Book } from "@longshelf/shared/library";
import type { LibrarySnapshot } from "@longshelf/shared/library/snapshot";

export interface CalibreFiles {
	/** Book uuid to its cover.jpg path. */
	cover: Map<string, string>;
	/** Book uuid to its EPUB path (local mode's reader). */
	epub: Map<string, string>;
	/** Book uuid to every format's path, e.g. EPUB, PDF, CBZ (spec 003 FR-004). */
	byFormat: Map<string, { format: string; path: string }[]>;
}

const ENTITIES: Record<string, string> = {
	amp: "&",
	lt: "<",
	gt: ">",
	quot: '"',
	apos: "'",
	nbsp: " ",
	mdash: "—",
	ndash: "–",
	hellip: "…",
	lsquo: "‘",
	rsquo: "’",
	ldquo: "“",
	rdquo: "”",
};

/** Calibre stores descriptions as HTML; screens show plain paragraphs. */
export function htmlToText(html: string): string {
	return html
		.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, "")
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, "\n\n")
		.replace(/<[^>]*>/g, "")
		.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code: string) => {
			if (code[0] !== "#") return ENTITIES[code.toLowerCase()] ?? whole;
			const n =
				code[1].toLowerCase() === "x"
					? parseInt(code.slice(2), 16)
					: Number(code.slice(1));
			return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : "";
		})
		.replace(/[ \t]+/g, " ")
		.replace(/ ?\n ?/g, "\n")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

/** Calibre uses year 101 for "no date". */
const yearOf = (date: string | null) => {
	const y = date?.slice(0, 4);
	return y && Number(y) >= 1000 ? y : undefined;
};

type Row = Record<string, string | number | null>;

/** Calibre stores 0 to 10 (half stars); screens use 0 to 5. No rating or 0 means unrated. */
const ratingOf = (n: number | undefined) =>
	n && n > 0 ? Math.min(n, 10) / 2 : undefined;

/** `dbPath` lets dev read a copy of `metadata.db`; file paths still resolve under `root`. */
export function readCalibreSnapshot(
	root: string,
	dbPath = join(root, "metadata.db"),
): {
	snapshot: LibrarySnapshot;
	files: CalibreFiles;
} {
	const db = new DatabaseSync(dbPath, {
		readOnly: true,
		timeout: 5000,
	});
	try {
		db.exec("BEGIN");
		const all = (sql: string) => db.prepare(sql).all() as unknown as Row[];
		const group = <T>(rows: Row[], value: (r: Row) => T) => {
			const out = new Map<number, T[]>();
			for (const r of rows) {
				const k = Number(r.book);
				out.set(k, [...(out.get(k) ?? []), value(r)]);
			}
			return out;
		};
		const single = <T>(rows: Row[], value: (r: Row) => T) =>
			new Map(rows.map((r) => [Number(r.book), value(r)]));

		const authors = group(
			all(`SELECT l.book, a.id, a.name, a.sort FROM books_authors_link l
				JOIN authors a ON a.id = l.author ORDER BY l.book, l.id`),
			(r) => ({
				id: String(r.id),
				name: String(r.name),
				sort: String(r.sort || r.name),
			}),
		);
		const tags = group(
			all(`SELECT l.book, t.name FROM books_tags_link l JOIN tags t ON t.id = l.tag
				ORDER BY l.book, t.name`),
			(r) => String(r.name),
		);
		const formats = group(
			all(`SELECT book, format, name FROM data ORDER BY book, format`),
			(r) => ({
				format: String(r.format),
				name: String(r.name),
			}),
		);
		const comments = single(all(`SELECT book, text FROM comments`), (r) =>
			String(r.text ?? ""),
		);
		const publishers = single(
			all(`SELECT l.book, p.name FROM books_publishers_link l
				JOIN publishers p ON p.id = l.publisher`),
			(r) => String(r.name),
		);
		const series = single(
			all(
				`SELECT l.book, s.name FROM books_series_link l JOIN series s ON s.id = l.series`,
			),
			(r) => String(r.name),
		);
		const column = all(`SELECT id FROM custom_columns
			WHERE label = 'collection' AND datatype = 'text' AND is_multiple = 0`)[0];
		const columnId = column ? Number(column.id) : null;
		const ratings = single(
			all(
				`SELECT l.book, r.rating FROM books_ratings_link l JOIN ratings r ON r.id = l.rating`,
			),
			(r) => Number(r.rating),
		);
		const collections =
			columnId === null
				? new Map<number, string>()
				: single(
						all(`SELECT l.book, c.value FROM books_custom_column_${columnId}_link l
							JOIN custom_column_${columnId} c ON c.id = l.value`),
						(r) => String(r.value),
					);

		const files: CalibreFiles = {
			cover: new Map(),
			epub: new Map(),
			byFormat: new Map(),
		};
		const books: Book[] = [];
		const news: Book[] = [];
		for (const r of all(`SELECT id, uuid, title, sort, series_index, timestamp, pubdate, path,
			has_cover FROM books`)) {
			const id = Number(r.id);
			const uuid = String(r.uuid);
			const dir = join(root, String(r.path));
			const bookFormats = formats.get(id) ?? [];
			const epub = bookFormats.find((f) => f.format === "EPUB");
			if (epub) files.epub.set(uuid, join(dir, `${epub.name}.epub`));
			files.byFormat.set(
				uuid,
				bookFormats.map((f) => ({
					format: f.format,
					path: join(dir, `${f.name}.${f.format.toLowerCase()}`),
				})),
			);
			if (r.has_cover) files.cover.set(uuid, join(dir, "cover.jpg"));
			const seriesName = series.get(id);
			const description = htmlToText(comments.get(id) ?? "");
			const bookTags = tags.get(id) ?? [];
			const book: Book = {
				id: uuid,
				title: String(r.title),
				authors: authors.get(id) ?? [],
				cover: r.has_cover
					? { url: `/__calibre/cover/${uuid}.jpg`, alt: `Cover of ${r.title}` }
					: undefined,
				description: description || undefined,
				series: seriesName
					? { name: seriesName, index: Number(r.series_index) }
					: undefined,
				collection: collections.get(id),
				tags: bookTags,
				formats: bookFormats.map((f) => f.format),
				addedAt: String(r.timestamp).slice(0, 10),
				pubYear: yearOf(r.pubdate === null ? null : String(r.pubdate)),
				publisher: publishers.get(id),
				sort: r.sort && r.sort !== r.title ? String(r.sort) : undefined,
				rating: ratingOf(ratings.get(id)),
			};
			(bookTags.some((t) => t.toLowerCase() === "news") ? news : books).push(
				book,
			);
		}
		db.exec("COMMIT");
		return {
			snapshot: { readAt: new Date().toISOString(), books, news },
			files,
		};
	} finally {
		db.close();
	}
}

/** The library named by the environment, or the one Calibre itself is set to. */
export function calibreLibraryPath(
	env: NodeJS.ProcessEnv = process.env,
): string {
	if (env.LONGSHELF_CALIBRE_LIBRARY)
		return resolve(env.LONGSHELF_CALIBRE_LIBRARY);
	const config =
		process.platform === "darwin"
			? join(homedir(), "Library/Preferences/calibre/global.py.json")
			: join(
					env.XDG_CONFIG_HOME || join(homedir(), ".config"),
					"calibre/global.py.json",
				);
	const path = existsSync(config)
		? (JSON.parse(readFileSync(config, "utf8")) as { library_path?: string })
				.library_path
		: undefined;
	if (!path)
		throw new Error(
			"No Calibre library found. Set LONGSHELF_CALIBRE_LIBRARY to its folder.",
		);
	return path;
}
