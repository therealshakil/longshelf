import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Interim accessibility check for the MVP pages; replaced by the full matrix in T052.
for (const colorScheme of ['light', 'dark'] as const) {
	test(`catalogue pages have no axe violations (${colorScheme})`, async ({ page }) => {
		await page.emulateMedia({ colorScheme });
		await page.goto('/design/about');
		const hrefs = await page
			.getByRole('navigation', { name: 'Design catalogue' })
			.locator('a[href^="/design/"]')
			.evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute('href')!))]);
		for (const href of hrefs) {
			await page.goto(href);
			const results = await new AxeBuilder({ page })
				.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
				.analyze();
			expect(results.violations.map((v) => `${href}: ${v.id} (${v.nodes.length})`)).toEqual([]);
		}
	});
}
