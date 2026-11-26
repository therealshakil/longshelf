/**
 * Dev-only: run the app against a local Calibre library (DR-0009). At startup `metadata.db` is
 * copied with SQLite's backup API to a cache folder outside the repo, and the app reads the copy,
 * so dev never holds the live database open. Covers and EPUBs are still served read-only from the
 * library. Nothing here reaches a production build, where the virtual module is null.
 */
import { createReadStream, existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { backup, DatabaseSync } from 'node:sqlite';
import type { Plugin } from 'vite';
import {
	calibreLibraryPath,
	readCalibreSnapshot,
	type CalibreFiles
} from '@longshelf/sync-cli/calibre';

export { htmlToText, readCalibreSnapshot } from '@longshelf/sync-cli/calibre';

const VIRTUAL_ID = 'virtual:longshelf/calibre';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/** Copies the library's `metadata.db` to `dest`, consistent even while Calibre is open. */
export async function copyCalibreDb(
	root: string,
	dest = join(process.env.XDG_CACHE_HOME || join(homedir(), '.cache'), 'longshelf/dev/metadata.db')
): Promise<string> {
	mkdirSync(join(dest, '..'), { recursive: true });
	const source = new DatabaseSync(join(root, 'metadata.db'), { readOnly: true, timeout: 5000 });
	try {
		await backup(source, dest);
	} finally {
		source.close();
	}
	return dest;
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
		async config(_, { command }) {
			if (command !== 'serve' || process.env.LONGSHELF_LOCAL_CALIBRE !== '1') return;
			root = calibreLibraryPath();
			data = readCalibreSnapshot(root, await copyCalibreDb(root));
			console.log(
				`\n  Local Calibre: ${data.snapshot.books.length} books, ${data.snapshot.news.length} news issues (from a copy, read-only, AI off)\n`
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
