import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: 'tests/e2e',
	testMatch: '**/*.spec.ts',
	webServer: {
		command: 'pnpm build && pnpm preview',
		port: 4173,
		reuseExistingServer: true,
		timeout: 180_000 // the build plus wrangler start can exceed the 60s default
	},
	use: { baseURL: 'http://localhost:4173' }
});
