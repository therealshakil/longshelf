import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: 'tests/e2e',
	testMatch: '**/*.spec.ts',
	webServer: { command: 'pnpm build && pnpm preview', port: 4173, reuseExistingServer: true },
	use: { baseURL: 'http://localhost:4173' }
});
