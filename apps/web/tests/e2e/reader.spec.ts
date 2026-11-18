import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Spec 002 US2: read comfortably.
const MIDDLEMARCH = '/read/george-eliot_middlemarch';

async function openBook(page: Page, path = MIDDLEMARCH) {
	await page.goto(path);
	// The book renders inside foliate's frame; wait until some text has loaded.
	await expect
		.poll(
			async () => {
				for (const f of page.frames())
					if (
						f !== page.mainFrame() &&
						(await f.evaluate(() => document.body?.innerText.length ?? 0)) > 200
					)
						return true;
				return false;
			},
			{ timeout: 15_000 }
		)
		.toBe(true);
}

async function tapMiddle(page: Page) {
	const vp = page.viewportSize()!;
	await page.mouse.click(vp.width / 2, vp.height / 2);
}

test.describe('Reader', () => {
	test('a tap in the middle hides the bars and a second tap shows them', async ({ page }) => {
		await openBook(page);
		const top = page.locator('header.top');
		await expect(top).not.toHaveClass(/\boff\b/);
		await tapMiddle(page);
		await expect(top).toHaveClass(/\boff\b/);
		await tapMiddle(page);
		await expect(top).not.toHaveClass(/\boff\b/);
	});

	test('text settings apply at once and persist for every book', async ({ page }) => {
		await openBook(page);
		await page.getByRole('button', { name: 'Text settings' }).click();
		await page.getByText('Loose', { exact: true }).click();
		await page.getByText('Night', { exact: true }).click();
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'night');
		await page.keyboard.press('Escape');
		await openBook(page, '/read/herman-melville_moby-dick');
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'night');
		const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('ribbon.reader.v1')!));
		expect(saved).toMatchObject({ spacing: 'loose', theme: 'night' });
	});

	test('the Kobo notice sits in the top bar and Go there dismisses it', async ({ page }) => {
		await openBook(page);
		const notice = page.locator('header.top').getByRole('status');
		await expect(notice).toContainText('Kobo is further on');
		await notice.getByRole('button', { name: 'Go there' }).click();
		await expect(notice).toHaveCount(0);
	});

	test('Contents lists chapters and marks where you are', async ({ page }) => {
		await openBook(page);
		await page.getByRole('button', { name: 'Contents' }).click();
		const nav = page.getByRole('navigation', { name: 'Chapters' });
		await expect(nav.getByRole('button').first()).toBeVisible();
		await expect(nav.locator('[aria-current="location"]')).toHaveCount(1);
	});

	test('a book without a file says so plainly', async ({ page }) => {
		await page.goto('/read/leo-tolstoy_anna-karenina_constance-garnett');
		await expect(page.getByText('This book isn’t on this device yet.')).toBeVisible();
	});

	for (const [scheme, theme] of [
		['light', null],
		['dark', null],
		['dark', 'night']
	] as const)
		for (const width of [390, 1440])
			test(`no axe violations in the reader chrome (${theme ?? scheme}, ${width}px)`, async ({
				page
			}) => {
				await page.setViewportSize({ width, height: 900 });
				await page.emulateMedia({ colorScheme: scheme });
				if (theme)
					await page.addInitScript(() =>
						localStorage.setItem('ribbon.reader.v1', JSON.stringify({ theme: 'night' }))
					);
				await openBook(page);
				// The book's own markup (Project Gutenberg) is out of scope; Ribbon's chrome is in.
				const results = await new AxeBuilder({ page })
					.exclude('foliate-view')
					.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
					.analyze();
				expect(results.violations.map((v) => `${v.id} (${v.nodes.length})`)).toEqual([]);
			});
});
