/**
 * Builds only when the build's inputs changed since the last build (spec 003 T043): e2e runs
 * reuse an identical build instead of spending ~50 s rebuilding it. Inputs: app source, static
 * files, config, the shared package, the lockfile and the library mode. When in doubt, it builds.
 */
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const APP = join(import.meta.dirname, '..');
const ROOT = join(APP, '../..');
const STAMP = join(APP, '.svelte-kit/cloudflare/.build-inputs');
const INPUTS = [
	join(APP, 'src'),
	join(APP, 'static'),
	join(APP, 'package.json'),
	join(APP, 'vite.config.ts'),
	join(APP, 'svelte.config.js'),
	join(APP, 'wrangler.jsonc'),
	join(APP, 'tsconfig.json'),
	join(ROOT, 'packages/shared/src'),
	join(ROOT, 'pnpm-lock.yaml')
];

function files(path: string): string[] {
	if (!existsSync(path)) return [];
	if (!statSync(path).isDirectory()) return [path];
	return readdirSync(path, { withFileTypes: true }).flatMap((e) =>
		e.name === 'node_modules' ? [] : files(join(path, e.name))
	);
}

const hash = createHash('sha256').update(`mode=${process.env.LONGSHELF_LIBRARY ?? 'sample'}\n`);
for (const file of INPUTS.flatMap(files).sort())
	hash.update(relative(ROOT, file)).update('\0').update(readFileSync(file)).update('\0');
const digest = hash.digest('hex');

if (existsSync(STAMP) && readFileSync(STAMP, 'utf8') === digest) {
	console.log('Build is up to date; reusing it.');
} else {
	execSync('pnpm build', { cwd: APP, stdio: 'inherit' });
	writeFileSync(STAMP, digest);
}
