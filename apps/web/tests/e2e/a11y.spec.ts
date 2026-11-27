import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * The full accessibility matrix (spec 002 SC-003). It runs only through `pnpm test:a11y`, before a
 * release, so everyday tests stay fast. Each feature's own spec keeps a quick axe check.
 */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const READER = '/read/george-eliot_middlemarch';
const ROUTES = [
	'/',
	'/library',
	'/library?tab=authors',
	'/library?tab=genres',
	'/library?tab=collections',
	'/library?tab=news',
	'/library?tab=all',
	'/library/authors/jane-austen',
	'/library/shelf/collection/poetry-drama',
	'/book/george-eliot_middlemarch',
	'/book/no-such-book',
	'/search',
	'/search?q=war',
	'/search?q=xylophone',
	'/settings/ai',
	'/settings/storage',
	READER
];
// Spec 004: the book page and Storage once a book is on this device.
const DOWNLOAD = '/book/bram-stoker_dracula';
const WIDTHS = [
	[390, 844],
	[1440, 900]
] as const;
type Theme = 'light' | 'dark' | 'night';

async function violations(page: Page, route: string) {
	const axe = new AxeBuilder({ page }).withTags(TAGS);
	// The book's own text is publisher content inside foliate's frame.
	if (route === READER) axe.exclude('foliate-view');
	const { violations } = await axe.analyze();
	return violations.map(
		(v) => `${route}: ${v.id} (${v.nodes.length}) ${v.nodes[0]?.target.join(' ')}`
	);
}

for (const [width, height] of WIDTHS)
	for (const theme of ['light', 'dark', 'night'] as Theme[])
		// Night is a reader setting, so only the reader has it.
		for (const route of theme === 'night' ? [READER] : ROUTES)
			test(`${route} at ${width} px, ${theme}`, async ({ page }) => {
				await page.setViewportSize({ width, height });
				await page.emulateMedia({
					colorScheme: theme === 'light' ? 'light' : 'dark',
					reducedMotion: 'reduce'
				});
				if (theme === 'night')
					await page.addInitScript(() =>
						localStorage.setItem('longshelf.reader.v1', JSON.stringify({ theme: 'night' }))
					);
				await page.goto(route);
				if (route === READER) {
					await page.waitForSelector('foliate-view', { state: 'attached' });
					await page.waitForTimeout(1000);
				}
				await expect(page.locator('main, [role="main"], foliate-view').first()).toBeAttached();
				expect(await violations(page, route)).toEqual([]);
			});

for (const [width, height] of WIDTHS)
	for (const theme of ['light', 'dark'] as const)
		test(`downloaded book and storage at ${width} px, ${theme}`, async ({ page }) => {
			await page.setViewportSize({ width, height });
			await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
			await page.goto(DOWNLOAD);
			await page.getByRole('button', { name: /^Download/ }).click();
			await expect(page.getByText(/^On this device/)).toBeVisible({ timeout: 15_000 });
			const found = await violations(page, DOWNLOAD);
			await page.goto('/settings/storage');
			await expect(page.getByText('Dracula').first()).toBeVisible();
			found.push(...(await violations(page, '/settings/storage')));
			expect(found).toEqual([]);
		});

for (const theme of ['light', 'dark'] as const)
	test(`catalogue pages, ${theme}`, async ({ page }) => {
		test.setTimeout(240_000); // one scan per catalogue page
		await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
		await page.goto('/design/about');
		const hrefs = await page
			.getByRole('navigation', { name: 'Design catalogue' })
			.locator('a[href*="design/"]')
			.evaluateAll((links) => [
				...new Set(links.map((a) => new URL((a as HTMLAnchorElement).href).pathname))
			]);
		expect(hrefs.length).toBeGreaterThan(20);
		const found: string[] = [];
		for (const href of hrefs) {
			await page.goto(href);
			found.push(...(await violations(page, href)));
		}
		expect(found).toEqual([]);
	});
