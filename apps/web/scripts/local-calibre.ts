/**
 * Dev-only: run the app against a local Calibre library (DR-0009). `metadata.db` is opened
 * read-only. Nothing here reaches a production build, where the virtual module is null.
 */
import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { Plugin } from 'vite';
import type { Book } from '@longshelf/shared/library';
import type { LibrarySnapshot } from '@longshelf/shared/library/snapshot';

const VIRTUAL_ID = 'virtual:longshelf/calibre';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export interface CalibreFiles {
	cover: Map<string, string>;
	epub: Map<string, string>;
}

const ENTITIES: Record<string, string> = {
	amp: '&',
	lt: '<',
	gt: '>',
	quot: '"',
	apos: "'",
	nbsp: ' ',
	mdash: '—',
	ndash: '–',
	hellip: '…',
	lsquo: '‘',
	rsquo: '’',
	ldquo: '“',
	rdquo: '”'
};

/** Calibre stores descriptions as HTML; screens show plain paragraphs. */
export function htmlToText(html: string): string {
	return html
		.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '')
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, '\n\n')
		.replace(/<[^>]*>/g, '')
		.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code: string) => {
			if (code[0] !== '#') return ENTITIES[code.toLowerCase()] ?? whole;
			const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : Number(code.slice(1));
			return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '';
		})
		.replace(/[ \t]+/g, ' ')
		.replace(/ ?\n ?/g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

/** Calibre uses year 101 for "no date". */
const yearOf = (date: string | null) => {
	const y = date?.slice(0, 4);
	return y && Number(y) >= 1000 ? y : undefined;
};

type Row = Record<string, string | number | null>;

export function readCalibreSnapshot(root: string): {
	snapshot: LibrarySnapshot;
	files: CalibreFiles;
} {
	const db = new DatabaseSync(join(root, 'metadata.db'), { readOnly: true, timeout: 5000 });
	try {
		db.exec('BEGIN');
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
			(r) => ({ id: String(r.id), name: String(r.name), sort: String(r.sort || r.name) })
		);
		const tags = group(
			all(`SELECT l.book, t.name FROM books_tags_link l JOIN tags t ON t.id = l.tag
				ORDER BY l.book, t.name`),
			(r) => String(r.name)
		);
		const formats = group(
			all(`SELECT book, format, name FROM data ORDER BY book, format`),
			(r) => ({
				format: String(r.format),
				name: String(r.name)
			})
		);
		const comments = single(all(`SELECT book, text FROM comments`), (r) => String(r.text ?? ''));
		const publishers = single(
			all(`SELECT l.book, p.name FROM books_publishers_link l
				JOIN publishers p ON p.id = l.publisher`),
			(r) => String(r.name)
		);
		const series = single(
			all(`SELECT l.book, s.name FROM books_series_link l JOIN series s ON s.id = l.series`),
			(r) => String(r.name)
		);
		const column = all(`SELECT id FROM custom_columns
			WHERE label = 'collection' AND datatype = 'text' AND is_multiple = 0`)[0];
		const columnId = column ? Number(column.id) : null;
		const collections =
			columnId === null
				? new Map<number, string>()
				: single(
						all(`SELECT l.book, c.value FROM books_custom_column_${columnId}_link l
							JOIN custom_column_${columnId} c ON c.id = l.value`),
						(r) => String(r.value)
					);

		const files: CalibreFiles = { cover: new Map(), epub: new Map() };
		const books: Book[] = [];
		const news: Book[] = [];
		for (const r of all(`SELECT id, uuid, title, series_index, timestamp, pubdate, path, has_cover
			FROM books`)) {
			const id = Number(r.id);
			const uuid = String(r.uuid);
			const dir = join(root, String(r.path));
			const bookFormats = formats.get(id) ?? [];
			const epub = bookFormats.find((f) => f.format === 'EPUB');
			if (epub) files.epub.set(uuid, join(dir, `${epub.name}.epub`));
			if (r.has_cover) files.cover.set(uuid, join(dir, 'cover.jpg'));
			const seriesName = series.get(id);
			const description = htmlToText(comments.get(id) ?? '');
			const bookTags = tags.get(id) ?? [];
			const book: Book = {
				id: uuid,
				title: String(r.title),
				authors: authors.get(id) ?? [],
				cover: r.has_cover
					? { url: `/__calibre/cover/${uuid}.jpg`, alt: `Cover of ${r.title}` }
					: undefined,
				description: description || undefined,
				series: seriesName ? { name: seriesName, index: Number(r.series_index) } : undefined,
				collection: collections.get(id),
				tags: bookTags,
				formats: bookFormats.map((f) => f.format),
				addedAt: String(r.timestamp).slice(0, 10),
				pubYear: yearOf(r.pubdate === null ? null : String(r.pubdate)),
				publisher: publishers.get(id)
			};
			(bookTags.some((t) => t.toLowerCase() === 'news') ? news : books).push(book);
		}
		db.exec('COMMIT');
		return { snapshot: { readAt: new Date().toISOString(), books, news }, files };
	} finally {
		db.close();
	}
}

/** The library named by the environment, or the one Calibre itself is set to. */
export function calibreLibraryPath(env: NodeJS.ProcessEnv = process.env): string {
	if (env.LONGSHELF_CALIBRE_LIBRARY) return resolve(env.LONGSHELF_CALIBRE_LIBRARY);
	const config =
		process.platform === 'darwin'
			? join(homedir(), 'Library/Preferences/calibre/global.py.json')
			: join(env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'calibre/global.py.json');
	const path = existsSync(config)
		? (JSON.parse(readFileSync(config, 'utf8')) as { library_path?: string }).library_path
		: undefined;
	if (!path)
		throw new Error('No Calibre library found. Set LONGSHELF_CALIBRE_LIBRARY to its folder.');
	return path;
}

/** Only a file inside the library, for a book that exists, is ever served. */
export function fileForRequest(url: string, root: string, files: CalibreFiles) {
	const m = /^\/(cover|book)\/([0-9a-f-]{36})\.(jpg|epub)$/.exec(url.split('?')[0]);
	if (!m || (m[1] === 'cover') !== (m[3] === 'jpg')) return null;
	const path = (m[1] === 'cover' ? files.cover : files.epub).get(m[2]);
	if (!path || !resolve(path).startsWith(resolve(root) + sep) || !existsSync(path)) return null;
	return { path, type: m[1] === 'cover' ? 'image/jpeg' : 'application/epub+zip' };
}

export function localCalibre(): Plugin {
	let root = '';
	let data: ReturnType<typeof readCalibreSnapshot> | null = null;
	return {
		name: 'longshelf-local-calibre',
		config(_, { command }) {
			if (command !== 'serve' || process.env.LONGSHELF_LOCAL_CALIBRE !== '1') return;
			root = calibreLibraryPath();
			data = readCalibreSnapshot(root);
			console.log(
				`\n  Local Calibre: ${data.snapshot.books.length} books, ${data.snapshot.news.length} news issues (read-only, AI off)\n`
			);
		},
		resolveId: (id) => (id === VIRTUAL_ID ? RESOLVED_ID : undefined),
		load(id) {
			if (id !== RESOLVED_ID) return;
			return `export default ${JSON.stringify(data?.snapshot ?? null)};`;
		},
		configureServer(server) {
			if (!data) return;
			const { files } = data;
			server.middlewares.use('/__calibre', (req, res) => {
				const host = (req.headers.host ?? '').replace(/:\d+$/, '');
				const file =
					req.method === 'GET' && LOCAL_HOSTS.has(host)
						? fileForRequest(req.url ?? '', root, files)
						: null;
				if (!file) {
					res.statusCode = 404;
					res.end('Not found');
					return;
				}
				res.setHeader('Content-Type', file.type);
				res.setHeader('Cache-Control', 'private, max-age=3600');
				createReadStream(file.path).pipe(res);
			});
		}
	};
}
