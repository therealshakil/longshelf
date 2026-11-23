import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const JANE = 'charlotte-bronte_jane-eyre';
const EMMA = 'jane-austen_emma';
const WUTHERING = { bookId: 'emily-bronte_wuthering-heights', reason: 'In your Gothic collection' };

/** Stubs the suggestion API, keeping dismissals in memory. */
async function stub(page: Page) {
	const gone = new Set<string>();
	const all = [
		{ bookId: JANE, reason: 'On your Reading List' },
		{ bookId: EMMA, reason: 'Another by Jane Austen' },
		WUTHERING
	];
	await page.route('**/api/ai/usage', (r) =>
		r.fulfill({ json: { today: { neuronsEst: 0, calls: 0, ceiling: 8000 }, enabled: true } })
	);
	const list = (r: Parameters<Parameters<Page['route']>[1]>[0]) =>
		r.fulfill({ json: { items: all.filter((i) => !gone.has(i.bookId)) } });
	await page.route('**/api/ai/read-next', list);
	await page.route('**/api/ai/more-like/*', list);
	await page.route('**/api/ai/dismiss', async (r) => {
		const { bookId } = r.request().postDataJSON();
		if (r.request().method() === 'POST') gone.add(bookId);
		else gone.delete(bookId);
		await r.fulfill({ json: { ok: true } });
	});
}

const shelf = (page: Page, name: string) => page.getByRole('region', { name });

/** Arrive by a link, so the page loads in the browser where the API stubs apply. */
async function goHome(page: Page) {
	await page.goto('/library');
	await page.waitForLoadState('networkidle'); // hydrated, so the link navigates in the browser
	await page.getByRole('link', { name: 'Home' }).first().click();
	await expect(page).toHaveURL(/\/$/);
}

test('Read next shows reasons, hides a book, and undoes it', async ({ page }) => {
	await stub(page);
	await goHome(page);
	const next = shelf(page, 'Read next');
	await expect(next.getByText('On your Reading List')).toBeVisible();
	await next.getByRole('link', { name: 'Jane Eyre' }).hover();
	await next.getByRole('button', { name: 'Options for Jane Eyre' }).click();
	await page.getByRole('menuitem', { name: /Not now/ }).click();

	await expect(next.getByRole('link', { name: 'Jane Eyre' })).toHaveCount(0);
	await expect(next.getByText('Jane Eyre hidden for 30 days.')).toBeVisible();
	await expect(next.getByRole('button', { name: 'Undo' })).toBeFocused();
	await next.getByRole('button', { name: 'Undo' }).click();
	await expect(next.getByRole('link', { name: 'Jane Eyre' })).toBeVisible();
	await expect(next.getByRole('button', { name: 'Undo' })).toHaveCount(0);
});

test('the menu works by keyboard, and a failed dismissal puts the book back', async ({ page }) => {
	await stub(page);
	await page.route('**/api/ai/dismiss', (r) => r.fulfill({ status: 500, body: 'no' }));
	await goHome(page);
	const next = shelf(page, 'Read next');
	await next.getByRole('button', { name: 'Options for Emma' }).focus();
	await page.keyboard.press('Enter');
	await expect(page.getByRole('menuitem', { name: /Never suggest/ })).toBeVisible();
	await page.keyboard.press('ArrowDown');
	await page.keyboard.press('Enter');
	await expect(next.getByText(/Couldn’t hide Emma/)).toBeVisible();
	await expect(next.getByRole('link', { name: 'Emma' })).toBeVisible();
});

test('More like this appears on a book page and passes axe', async ({ page }) => {
	await stub(page);
	await goHome(page);
	await shelf(page, 'Read next').getByRole('link', { name: 'Jane Eyre' }).click();
	await expect(page).toHaveURL(/\/book\/charlotte-bronte_jane-eyre$/);
	const more = shelf(page, 'More like this in your library');
	await expect(more.getByText('Another by Jane Austen')).toBeVisible();
	const results = await new AxeBuilder({ page })
		.include('section[aria-labelledby="book-suggestions-h"]')
		.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
		.analyze();
	expect(results.violations.map((v) => `${v.id} (${v.nodes.length})`)).toEqual([]);
});

test('on a phone the menu stays on screen and the page does not scroll sideways', async ({
	page
}) => {
	await stub(page);
	await page.setViewportSize({ width: 390, height: 844 });
	await goHome(page);
	await shelf(page, 'Read next').getByRole('button', { name: 'Options for Jane Eyre' }).focus();
	await page.keyboard.press('Enter');
	const box = await page.getByRole('menu').boundingBox();
	expect(box!.x).toBeGreaterThanOrEqual(0);
	expect(box!.x + box!.width).toBeLessThanOrEqual(390);
	expect(box!.y + box!.height).toBeLessThanOrEqual(844);
	expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('with no suggestions the section is not shown', async ({ page }) => {
	await stub(page);
	await page.route('**/api/ai/read-next', (r) => r.fulfill({ status: 503, json: {} }));
	await goHome(page);
	await expect(page.getByRole('heading', { name: 'Read next' })).toHaveCount(0);
});
