/**
 * Captures each page beside its approved mock (spec 002 T064). It is an on-demand review tool and
 * is never part of build, test, push or deploy.
 *
 *   pnpm design:compare
 *   pnpm design:compare --only home,book --widths 390 --themes dark
 *   pnpm design:compare --url http://localhost:5173   (reuse a running dev server)
 *
 * Open `test-results/design-compare/index.html` to review the pairs.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { createServer as createNetServer } from 'node:net';
import { dirname, extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { chromium, type Browser, type Page } from '@playwright/test';

const WEB = join(dirname(fileURLToPath(import.meta.url)), '..');
const MOCKS = join(WEB, '..', '..', 'design-mocks');
const OUT = join(WEB, 'test-results', 'design-compare');
const READER_SETTINGS_KEY = 'longshelf.reader.v1';
const WIDTHS = [390, 820, 1440];
const HEIGHTS: Record<number, number> = { 390: 844, 820: 1180, 1440: 900 };
const THEMES = ['light', 'dark', 'night'] as const;
const MAX_CAPTURE_HEIGHT = 2400;
const CONCURRENCY = 4;

type Theme = (typeof THEMES)[number];
/**
 * `download`: a book page whose Download button is pressed first, so the page has something stored.
 * `ready`: text that shows once the page has read what's on this device.
 */
type Target = { id: string; route: string; mock: string; download?: string; ready?: string };
type Job = { target: Target; width: number; theme: Theme };

const TARGETS: Target[] = [
	{ id: 'home', route: '/', mock: 'index.html' },
	{ id: 'library', route: '/library', mock: 'library.html' },
	{ id: 'book', route: '/book/george-eliot_middlemarch', mock: 'book.html' },
	// Middlemarch has no close match in the sample, so this shows More like this filled in.
	{ id: 'book-similar', route: '/book/charlotte-bronte_jane-eyre', mock: 'book.html' },
	{ id: 'author', route: '/library/authors/jane-austen', mock: 'author.html' },
	{ id: 'shelf', route: '/library/shelf/collection/poetry-drama', mock: 'shelf.html' },
	{ id: 'reader', route: '/read/george-eliot_middlemarch', mock: 'reader.html' },
	{
		id: 'storage',
		route: '/settings/storage',
		mock: 'storage.html',
		download: '/book/bram-stoker_dracula',
		ready: 'Dracula'
	}
];

const TYPES: Record<string, string> = {
	'.html': 'text/html; charset=utf-8',
	'.css': 'text/css',
	'.js': 'text/javascript',
	'.json': 'application/json',
	'.jpg': 'image/jpeg',
	'.png': 'image/png',
	'.svg': 'image/svg+xml'
};

const list = (value: string | undefined) => value?.split(',').map((s) => s.trim());

function freePort(): Promise<number> {
	return new Promise((done, fail) => {
		const server = createNetServer();
		server.once('error', fail);
		server.listen(0, '127.0.0.1', () => {
			const { port } = server.address() as { port: number };
			server.close(() => done(port));
		});
	});
}

/** Serves the mocks read-only, from their own folder. */
async function serveMocks(): Promise<{ server: Server; url: string }> {
	const server = createServer((request, response) => {
		const path = decodeURIComponent(new URL(request.url ?? '/', 'http://x').pathname);
		const file = normalize(join(MOCKS, path === '/' ? 'index.html' : path));
		if (!file.startsWith(MOCKS + sep) || !statSync(file, { throwIfNoEntry: false })?.isFile()) {
			response.writeHead(404).end();
			return;
		}
		response.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
		response.end(readFileSync(file));
	});
	const port = await freePort();
	await new Promise<void>((done) => server.listen(port, '127.0.0.1', done));
	return { server, url: `http://127.0.0.1:${port}` };
}

async function startApp(): Promise<{ child: ChildProcess; url: string }> {
	const port = await freePort();
	const url = `http://127.0.0.1:${port}`;
	const child = spawn(
		'pnpm',
		['exec', 'vite', 'dev', '--port', String(port), '--strictPort', '--host', '127.0.0.1'],
		{ cwd: WEB, detached: true, stdio: 'ignore' }
	);
	for (let i = 0; i < 240; i++) {
		try {
			if ((await fetch(`${url}/library`, { signal: AbortSignal.timeout(5000) })).ok)
				return { child, url };
		} catch {
			// not up yet
		}
		await new Promise((r) => setTimeout(r, 250));
	}
	stopApp(child);
	throw new Error('The dev server did not start.');
}

function stopApp(child: ChildProcess) {
	try {
		if (child.pid) process.kill(-child.pid);
	} catch {
		// already stopped
	}
}

/** Lets fonts and lazy images settle so a capture shows the finished page. */
async function settle(page: Page) {
	await page.evaluate(async () => {
		document.querySelectorAll('img').forEach((img) => (img.loading = 'eager'));
		const images = [...document.images].map((img) => img.decode().catch(() => undefined));
		const wait = new Promise((done) => setTimeout(done, 2500));
		await Promise.race([Promise.all([document.fonts.ready, ...images]), wait]);
	});
}

async function capture(page: Page, width: number, path: string, fixedScreen = false) {
	// The reader's controls are fixed to the screen, so a taller capture would misplace them.
	if (fixedScreen) {
		await page.screenshot({ path, animations: 'disabled' });
		return;
	}
	const height = await page.evaluate(() => document.documentElement.scrollHeight);
	await page.screenshot({
		path,
		fullPage: true,
		animations: 'disabled',
		clip: { x: 0, y: 0, width, height: Math.min(height, MAX_CAPTURE_HEIGHT) }
	});
}

async function runJob(browser: Browser, job: Job, appUrl: string, mockUrl: string) {
	const { target, width, theme } = job;
	const context = await browser.newContext({
		viewport: { width, height: HEIGHTS[width] },
		colorScheme: theme === 'light' ? 'light' : 'dark',
		reducedMotion: 'reduce'
	});
	const name = `${target.id}-${width}-${theme}`;
	// A failed retake must not leave an old capture looking current.
	for (const side of ['app', 'mock']) rmSync(join(OUT, `${name}-${side}.png`), { force: true });
	try {
		const app = await context.newPage();
		if (theme === 'night')
			await app.addInitScript(
				([key]) => localStorage.setItem(key, JSON.stringify({ theme: 'night' })),
				[READER_SETTINGS_KEY]
			);
		if (target.download) {
			await app.goto(appUrl + target.download, { waitUntil: 'load' });
			await app.getByRole('button', { name: /^Download/ }).click();
			await app.getByText(/^On this device/).waitFor({ timeout: 15000 });
		}
		await app.goto(appUrl + target.route, { waitUntil: 'load' });
		if (target.ready) await app.getByText(target.ready).first().waitFor({ timeout: 15000 });
		if (target.id === 'reader') {
			await app.waitForSelector('foliate-view', { state: 'attached', timeout: 15000 });
			await app.waitForTimeout(1500); // the book renders inside foliate's own frame
		}
		await settle(app);
		await capture(app, width, join(OUT, `${name}-app.png`), target.id === 'reader');

		const mock = await context.newPage();
		await mock.goto(`${mockUrl}/${target.mock}#${theme === 'night' ? 'light' : theme}`, {
			waitUntil: 'load'
		});
		await mock.addStyleTag({ content: '.mockswitch2{display:none!important}' });
		if (theme === 'night')
			await mock.evaluate(() => (document.documentElement.dataset.theme = 'night'));
		await settle(mock);
		await capture(mock, width, join(OUT, `${name}-mock.png`), target.id === 'reader');
		return name;
	} finally {
		await context.close();
	}
}

/** Lists every pair on disk, so retaking one page keeps the others in the review. */
function writeReview(failed: string[]) {
	const sections = TARGETS.flatMap((target) => {
		const rows = WIDTHS.flatMap((width) =>
			THEMES.map((theme) => ({
				name: `${target.id}-${width}-${theme}`,
				job: { target, width, theme }
			}))
		).filter(({ name }) =>
			['app', 'mock'].every((side) => existsSync(join(OUT, `${name}-${side}.png`)))
		);
		if (!rows.length) return [];
		const pairs = rows
			.map(
				({ name, job }) => `<section><h3>${job.width} px, ${job.theme}</h3><div class="pair">
<figure><figcaption>Built</figcaption><a href="${name}-app.png"><img loading="lazy" src="${name}-app.png" alt="Built ${target.id} page, ${job.width} pixels, ${job.theme}"></a></figure>
<figure><figcaption>Approved mock</figcaption><a href="${name}-mock.png"><img loading="lazy" src="${name}-mock.png" alt="Approved ${target.id} mock, ${job.width} pixels, ${job.theme}"></a></figure>
</div></section>`
			)
			.join('\n');
		return [`<h2 id="${target.id}">${target.id}</h2>${pairs}`];
	});
	const problems = failed.length ? `<p class="bad">Not captured: ${failed.join(', ')}</p>` : '';
	writeFileSync(
		join(OUT, 'index.html'),
		`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Design compare</title><style>
body{margin:0 auto;max-width:90rem;padding:1.5rem;font:16px/1.5 system-ui,sans-serif;background:#F7F7F5;color:#33312D}
h1,h2{font-family:Georgia,serif;color:#1A1918}h2{margin-top:2.5rem;border-bottom:1px solid #DEDCD6;text-transform:capitalize}h3{font-size:1rem}
.pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}figure{margin:0}figcaption{font-size:.875rem;color:#64605A}
img{display:block;width:100%;border:1px solid #DEDCD6}.bad{font-weight:700;color:#7A2E3A}
</style></head><body><h1>Design compare</h1>${problems}${sections.join('\n')}</body></html>`
	);
}

async function main() {
	const { values } = parseArgs({
		options: {
			only: { type: 'string' },
			widths: { type: 'string' },
			themes: { type: 'string' },
			url: { type: 'string' }
		}
	});
	const only = list(values.only);
	const widths = list(values.widths)?.map(Number) ?? WIDTHS;
	const themes = (list(values.themes) ?? THEMES) as Theme[];
	const unknown = [
		...(only ?? []).filter((id) => !TARGETS.some((t) => t.id === id)),
		...widths.filter((w) => !WIDTHS.includes(w)),
		...themes.filter((t) => !THEMES.includes(t))
	];
	if (unknown.length) throw new Error(`Unknown option: ${unknown.join(', ')}`);

	const jobs = TARGETS.filter((t) => !only || only.includes(t.id)).flatMap((target) =>
		widths.flatMap((width) =>
			themes
				// Night is a reader setting, so only the reader has it.
				.filter((theme) => theme !== 'night' || target.id === 'reader')
				.map((theme) => ({ target, width, theme }))
		)
	);
	if (!jobs.length) throw new Error('Nothing to capture.');

	const started = performance.now();
	mkdirSync(OUT, { recursive: true });
	const mocks = await serveMocks();
	const app = values.url ? null : await startApp();
	const appUrl = values.url?.replace(/\/$/, '') ?? app!.url;
	const browser = await chromium.launch();
	const done: string[] = [];
	const failed: string[] = [];
	try {
		// One warm-up load, so parallel pages don't all wait on the dev server's first compile.
		const warm = await browser.newPage();
		await warm.goto(appUrl + jobs[0].target.route, { waitUntil: 'load' });
		await warm.close();
		let next = 0;
		await Promise.all(
			Array.from({ length: CONCURRENCY }, async () => {
				while (next < jobs.length) {
					const job = jobs[next++];
					try {
						done.push(await runJob(browser, job, appUrl, mocks.url));
					} catch (e) {
						const name = `${job.target.id}-${job.width}-${job.theme}`;
						failed.push(name);
						console.error(`${name}: ${e instanceof Error ? e.message.split('\n')[0] : e}`);
					}
				}
			})
		);
	} finally {
		await browser.close();
		mocks.server.close();
		if (app) stopApp(app.child);
	}
	writeReview(failed);
	const seconds = ((performance.now() - started) / 1000).toFixed(0);
	console.log(`${done.length} of ${jobs.length} pairs captured in ${seconds} s.`);
	console.log(`Review: ${join(OUT, 'index.html')}`);
	if (failed.length) process.exitCode = 1;
}

await main();
