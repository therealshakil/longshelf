import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Spec 002 US3 (find a book) and US8 (news and magazines).
test.describe('Library', () => {
	test('tabs are in the fixed order and Recently added is first', async ({ page }) => {
		await page.goto('/library');
		await expect(page.getByRole('tab')).toHaveText([
			'Recently added',
			'Authors',
			'Genres',
			'Collections',
			'News & magazines',
			'All Books'
		]);
		await expect(page.getByRole('tab', { name: 'Recently added' })).toHaveAttribute(
			'aria-selected',
			'true'
		);
	});

	test('the chosen tab is kept in the address and arrow keys move between tabs', async ({
		page
	}) => {
		await page.goto('/library', { waitUntil: 'networkidle' }); // tabs need the page's script
		await page.getByRole('tab', { name: 'Authors' }).click();
		await expect(page).toHaveURL(/\?tab=authors$/);
		await page.keyboard.press('ArrowRight');
		await expect(page.getByRole('tab', { name: 'Genres' })).toHaveAttribute(
			'aria-selected',
			'true'
		);
		await page.reload();
		await expect(page.getByRole('tab', { name: 'Genres' })).toHaveAttribute(
			'aria-selected',
			'true'
		);
	});

	test('a book is reachable by author, collection and title, and opens its page', async ({
		page
	}) => {
		await page.goto('/library?tab=authors');
		await page.getByRole('link', { name: /Jane Austen/ }).click();
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Jane Austen');
		await page.getByRole('link', { name: 'Pride and Prejudice' }).first().click();
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pride and Prejudice');

		await page.goto('/library?tab=collections');
		await page.getByRole('link', { name: /Poetry & drama/ }).click();
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Poetry & drama');

		await page.goto('/library?tab=all');
		await expect(page.getByRole('navigation', { name: 'Jump to letter' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'M', exact: true })).toBeVisible();
	});

	test('read status reads the same everywhere a book appears', async ({ page }) => {
		const label = async (path: string) => {
			await page.goto(path);
			return page
				.locator('.tile', { has: page.getByRole('link', { name: 'Meditations', exact: true }) })
				.first()
				.locator('.status')
				.textContent();
		};
		expect(await label('/library')).toBe('55% read');
		expect(await label('/library?tab=all')).toBe('55% read');
		expect(await label('/library/shelf/collection/stoics')).toBe('55% read');
	});

	test('news and magazines never appear in Recently added', async ({ page }) => {
		await page.goto('/library');
		await expect(page.getByText('The Evening Courier')).toHaveCount(0);
		await page.waitForLoadState('networkidle'); // the tabs work once the page is interactive
		await page.getByRole('tab', { name: 'News & magazines' }).click();
		await expect(page.getByRole('heading', { name: 'The Evening Courier' })).toBeVisible();
	});

	for (const colorScheme of ['light', 'dark'] as const)
		for (const width of [390, 1440])
			test(`no axe violations on library pages (${colorScheme}, ${width}px)`, async ({ page }) => {
				test.setTimeout(120_000);
				await page.setViewportSize({ width, height: 900 });
				await page.emulateMedia({ colorScheme });
				for (const path of [
					'/library',
					'/library?tab=authors',
					'/library?tab=collections',
					'/library?tab=news',
					'/library?tab=all',
					'/library/authors/jane-austen',
					'/library/shelf/collection/poetry-drama',
					'/book/george-eliot_middlemarch'
				]) {
					await page.goto(path);
					const results = await new AxeBuilder({ page })
						.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
						.analyze();
					expect(results.violations.map((v) => `${path}: ${v.id} (${v.nodes.length})`)).toEqual([]);
				}
			});
});
