import { expect, test } from '@playwright/test';

test.describe('design catalogue (US1)', () => {
	test('index lists entries and each page has examples, rationale, sources and checks', async ({
		page
	}) => {
		test.setTimeout(240_000); // visits every catalogue page
		await page.goto('/design/about');
		const nav = page.getByRole('navigation', { name: 'Design catalogue' });
		// SvelteKit renders relative hrefs during SSR, so compare resolved pathnames.
		const links = nav.locator('a[href*="design/"]');
		const hrefs = [
			...new Set(
				await links.evaluateAll((as) =>
					as.map((a) => new URL((a as HTMLAnchorElement).href).pathname)
				)
			)
		];
		expect(hrefs.length).toBeGreaterThan(0);

		for (const href of hrefs) {
			await page.goto(href);
			await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
			await expect(page.getByRole('region', { name: 'Examples' })).toBeVisible();
			await expect(page.getByRole('heading', { name: 'Why it looks like this' })).toBeVisible();
			await expect(page.getByRole('heading', { name: 'Sources' })).toBeVisible();
			await expect(page.getByRole('heading', { name: 'calm-ds Checks' })).toBeVisible();
			expect(
				await page
					.locator('a[aria-current="page"]')
					.first()
					.evaluate((a) => new URL((a as HTMLAnchorElement).href).pathname)
			).toBe(href);
			// Nothing moves (calm-ds I).
			expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
		}
	});

	test('returning to /design opens the last page visited', async ({ page }) => {
		await page.goto('/design');
		await expect(page).toHaveURL(/\/design\/about$/);
		const other = page
			.getByRole('navigation', { name: 'Design catalogue' })
			.locator('a[href^="/design/"]:not([href="/design/about"])')
			.first();
		if ((await other.count()) === 0) test.skip(true, 'only one entry so far');
		const href = await other.getAttribute('href');
		await page.goto(href!);
		// The page records itself once hydrated; wait for that before leaving.
		await page.waitForFunction((h) => localStorage.getItem('longshelf.design.last') === h, href);
		await page.goto('/');
		await page.goto('/design');
		await expect(page).toHaveURL(new RegExp(`${href}$`));
	});
});
