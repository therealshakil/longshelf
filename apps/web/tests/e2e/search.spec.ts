import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const results = (page: import('@playwright/test').Page) =>
	page.getByRole('list', { name: 'Search results' });

test('the header search finds books, shows why, and opens one', async ({ page }) => {
	await page.goto('/');
	const box = page.getByRole('searchbox', { name: 'Search your library' });
	await box.fill('war');
	await box.press('Enter');
	await expect(page).toHaveURL(/\/search\?q=war$/);
	await expect(page.getByRole('heading', { name: 'Results for “war”', level: 1 })).toBeVisible();
	await expect(page.getByRole('searchbox')).toHaveValue('war');
	const row = results(page).getByRole('link', { name: /War and Peace/ });
	await expect(row).toContainText('Title matches');
	await row.click();
	await expect(page).toHaveURL(/\/book\/leo-tolstoy_war-and-peace/);
});

test('a typo still finds the book', async ({ page }) => {
	await page.goto('/search?q=middlemrch');
	await expect(results(page).getByRole('link', { name: /Middlemarch/ })).toBeVisible();
});

test('no results says so and offers the library', async ({ page }) => {
	await page.goto('/search?q=xylophone');
	await expect(page.getByText('No books in your library match this.')).toBeVisible();
	await expect(page.getByRole('link', { name: 'Browse the library' })).toBeVisible();
});

for (const [name, width] of [
	['phone', 390],
	['desktop', 1440]
] as const)
	for (const colorScheme of ['light', 'dark'] as const)
		test(`no axe violations or sideways scroll (${colorScheme}, ${name})`, async ({ page }) => {
			await page.emulateMedia({ colorScheme });
			await page.setViewportSize({ width, height: 900 });
			await page.goto('/search?q=war');
			await expect(results(page)).toBeVisible();
			const axe = await new AxeBuilder({ page })
				.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
				.analyze();
			expect(axe.violations.map((v) => `${v.id} (${v.nodes.length})`)).toEqual([]);
			expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
				width
			);
		});
