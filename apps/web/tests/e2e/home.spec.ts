import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Spec 002 US1: pick up where I left off.
test.describe('Home', () => {
	test('leads with the current book, its progress and one Continue reading action', async ({
		page
	}) => {
		await page.goto('/');
		const current = page.getByRole('article', { name: 'Middlemarch' });
		await expect(current).toBeVisible();
		await expect(current.getByText('38%')).toBeVisible();
		await expect(current.getByText('Kobo is at 41%')).toBeVisible();
		await current.getByRole('link', { name: /Continue reading/ }).click();
		await expect(page).toHaveURL(/\/read\/george-eliot_middlemarch$/);
	});

	test('each Also reading row is one link that opens its book', async ({ page }) => {
		await page.goto('/');
		const rows = page.locator('ol.ledger > li');
		await expect(rows).toHaveCount(3);
		for (const row of await rows.all()) await expect(row.getByRole('link')).toHaveCount(1);
		await rows.filter({ hasText: 'Anna Karenina' }).getByRole('link').click();
		await expect(page).toHaveURL(/\/read\/leo-tolstoy_anna-karenina/);
	});

	test('order: current book, Also reading, library link, latest news', async ({ page }) => {
		await page.goto('/');
		const order = await page
			.locator('main')
			.evaluate((m) =>
				[...m.querySelectorAll('#current-title, .also-h, .more, #latest-h')].map((e) =>
					e.textContent?.trim()
				)
			);
		expect(order).toEqual([
			'Middlemarch',
			'Also reading',
			'Browse the library',
			'Latest news & magazines'
		]);
	});

	test('on a phone, every book in progress shows without sideways scrolling', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/');
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
			390
		);
		for (const title of ['Middlemarch', 'Anna Karenina', 'Meditations', 'Moby Dick'])
			await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
	});

	for (const colorScheme of ['light', 'dark'] as const)
		for (const width of [390, 1440])
			test(`no axe violations (${colorScheme}, ${width}px)`, async ({ page }) => {
				await page.setViewportSize({ width, height: 900 });
				await page.emulateMedia({ colorScheme });
				await page.goto('/');
				const results = await new AxeBuilder({ page })
					.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
					.analyze();
				expect(results.violations.map((v) => `${v.id} (${v.nodes.length})`)).toEqual([]);
			});
});
