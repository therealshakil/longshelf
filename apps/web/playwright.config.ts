import { createServer } from 'node:net';
import { defineConfig } from '@playwright/test';

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

export default defineConfig({
	testDir: 'tests/e2e',
	projects: [
		{
			name: 'main',
			testMatch: '**/*.spec.ts',
			testIgnore: '**/ai-off.spec.ts',
			teardown: 'ai-off'
		},
		// Switches AI off for the shared local database, so it runs alone, after everything else.
		{ name: 'ai-off', testMatch: '**/ai-off.spec.ts', fullyParallel: false }
	],
	webServer: {
		command: `pnpm build && wrangler d1 migrations apply ribbon --local && wrangler dev .svelte-kit/cloudflare/_worker.js --port ${port}`,
		port,
		reuseExistingServer: false,
		timeout: 180_000 // the build plus wrangler start can exceed the 60s default
	},
	use: { baseURL: `http://localhost:${port}` }
});
