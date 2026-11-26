/**
 * Live access probe (spec 003 T031, SC-004): proves a deployment gives no library data to anyone
 * without the owner's sign-in or the CLI's service token.
 *   pnpm --filter web test:access https://library.example
 * Reads the service token from the longshelf CLI config; never prints it.
 */
import { loadConfig } from '@longshelf/sync-cli/config';

const url = (process.argv[2] ?? loadConfig().url ?? '').replace(/\/+$/, '');
if (!url) {
	console.error('Usage: pnpm --filter web test:access <https://your-library>');
	process.exit(2);
}
const { clientId, clientSecret } = loadConfig();
const token =
	clientId && clientSecret
		? { 'CF-Access-Client-Id': clientId, 'CF-Access-Client-Secret': clientSecret }
		: null;

const ANY = 'a'.repeat(64);
const BROWSER = [
	'/',
	'/library',
	'/book/x',
	'/api/catalog',
	`/api/covers/${ANY}`,
	`/api/files/${ANY}`,
	'/api/ai/usage',
	'/api/progress'
];
const INGEST = '/api/ingest/abort';

/** Signs of library data in a body: catalogue JSON or book fields. */
const LEAK = /"books"\s*:|"title"\s*:|"authors"\s*:|"metadata"\s*:|"places"\s*:|application\/epub/;

let failures = 0;
const check = (ok: boolean, line: string) => {
	console.log(`${ok ? 'ok  ' : 'FAIL'} ${line}`);
	if (!ok) failures++;
};

async function probe(path: string, headers: Record<string, string>, init: RequestInit = {}) {
	const res = await fetch(url + path, {
		...init,
		headers: { ...headers, ...(init.headers ?? {}) },
		redirect: 'manual'
	});
	const body = await res.text();
	const toLogin =
		res.status >= 300 &&
		res.status < 400 &&
		/cloudflareaccess\.com/.test(res.headers.get('location') ?? '');
	return { status: res.status, body, toLogin, robots: res.headers.get('x-robots-tag') };
}

console.log(`Access probe: ${url}`);
for (const path of [...BROWSER, INGEST]) {
	const r = await probe(path, {}, path === INGEST ? { method: 'POST', body: '{}' } : {});
	check(
		(r.toLogin || r.status === 403 || r.status === 401) && !LEAK.test(r.body),
		`no credentials ${path}: ${r.status}${r.toLogin ? ' → sign-in' : ''}`
	);
}
if (!token) {
	console.log('No service token in the longshelf config: skipped the token checks.');
} else {
	for (const path of BROWSER) {
		const r = await probe(path, token);
		check(
			r.status === 403 && !LEAK.test(r.body),
			`service token ${path}: ${r.status} (browser routes are owner-only)`
		);
	}
	const r = await probe(
		INGEST,
		{ ...token, 'content-type': 'application/json' },
		{
			method: 'POST',
			body: JSON.stringify({ runId: 'access-probe' })
		}
	);
	check(r.status === 200, `service token ${INGEST}: ${r.status}`);
	// On workers.dev preview URLs Cloudflare replaces the Worker's header with plain `noindex`
	// (seen 2026-11-25 on pr-1; same code gives `noindex, nofollow` on the custom domain).
	const preview = new URL(url).hostname.endsWith('.workers.dev');
	check(
		r.robots === 'noindex, nofollow' || (preview && r.robots === 'noindex'),
		`X-Robots-Tag on Worker responses: ${r.robots ?? 'missing'}`
	);
}
console.log(
	failures
		? `${failures} check(s) failed.`
		: 'All checks passed: nothing is readable without signing in.'
);
process.exit(failures ? 1 : 0);
