import { createServer } from 'node:net';
import { defineConfig } from '@playwright/test';
import { accessEnv } from '@longshelf/sync-cli/config';

/** A free port for this run, so tests can never reuse a stale server. */
const freePort = () =>
	new Promise<number>((done, fail) => {
		const server = createServer();
		server.once('error', fail);
		server.listen(0, '127.0.0.1', () => {
			const { port } = server.address() as { port: number };
			server.close(() => done(port));
		});
	});

// Playwright loads this file again in each worker, which must use the same port.
process.env.E2E_PORT ??= String(await freePort());
const port = Number(process.env.E2E_PORT);

// `pnpm test:e2e:mirror` (spec 003 T029, on demand): a mirror build seeded by the longshelf CLI
// with the test library. Everyday `pnpm test:e2e` uses the sample build.
const mirror = process.env.E2E_MIRROR === '1';

export default defineConfig({
	testDir: 'tests/e2e',
	// Playwright empties this folder on each run, so it must not hold design-compare captures.
	outputDir: 'test-results/playwright',
	projects: mirror
		? [{ name: 'mirror', testMatch: '**/mirror.spec.ts' }]
		: [
				{
					name: 'main',
					testMatch: '**/*.spec.ts',
					testIgnore: ['**/ai-off.spec.ts', '**/a11y.spec.ts', '**/mirror.spec.ts'],
					teardown: 'ai-off'
				},
				// Switches AI off for the shared local database, so it runs alone, after everything else.
				{ name: 'ai-off', testMatch: '**/ai-off.spec.ts', fullyParallel: false },
				// The full accessibility matrix runs only through `pnpm test:a11y`, so everyday runs stay fast.
				...(process.env.A11Y
					? [{ name: 'a11y', testMatch: '**/a11y.spec.ts', fullyParallel: true }]
					: [])
			],
	webServer: {
		command: `${mirror ? 'LONGSHELF_LIBRARY=mirror ' : ''}pnpm build && wrangler d1 migrations apply longshelf --local && wrangler dev .svelte-kit/cloudflare/_worker.js --port ${port} --local-upstream localhost --var LONGSHELF_DEV_IDENTITY:1`,
		port,
		reuseExistingServer: false,
		// The Workers AI binding is remote and sits behind Cloudflare Access (spec 003).
		env: { ...(process.env as Record<string, string>), ...accessEnv() },
		timeout: 180_000 // the build plus wrangler start can exceed the 60s default
	},
	use: { baseURL: `http://localhost:${port}` }
});
