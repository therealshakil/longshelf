import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const BOOK = 'charlotte-bronte_jane-eyre';

/** Stubs the genre API with an in-memory copy of the state rules. */
async function stub(page: Page, fail = false) {
	const genres = new Map([
		['Classics', 'in_calibre'],
		['Gothic', 'suggested'],
		['Romance', 'promoted']
	]);
	const list = () =>
		[...genres].filter(([, s]) => s !== 'removed').map(([name, state]) => ({ name, state }));
	await page.route('**/api/ai/genres', (r) =>
		r.fulfill({ json: { items: list().map((g) => ({ bookId: BOOK, ...g })) } })
	);
	await page.route(`**/api/ai/genres/${BOOK}`, async (r) => {
		if (r.request().method() === 'GET') return r.fulfill({ json: { genres: list() } });
		if (fail) return r.fulfill({ status: 500, body: 'no' });
		const { name, action } = r.request().postDataJSON();
		const state = { promote: 'promoted', remove: 'removed', restore: 'suggested' }[
			action as string
		]!;
		genres.set(name, state);
		await r.fulfill({ json: { ok: true, state } });
	});
}

/** Arrive by a link, so the page loads in the browser where the API stubs apply. */
async function openBook(page: Page) {
	await page.goto('/library?tab=all');
	await page.waitForLoadState('networkidle');
	await page.getByRole('link', { name: 'Jane Eyre' }).first().click();
	await expect(page).toHaveURL(new RegExp(`/book/${BOOK}$`));
	await expect(page.getByRole('heading', { name: 'Genres' })).toBeVisible();
}

test('a suggestion can be promoted, and says it is waiting for sync', async ({ page }) => {
	await stub(page);
	await openBook(page);
	const gothic = page.getByRole('listitem').filter({ hasText: 'Gothic' });
	await gothic.getByRole('button', { name: 'Promote Gothic' }).click();
	await expect(gothic.getByText('Waiting for sync')).toBeVisible();
	await expect(gothic.getByRole('button', { name: 'Remove Gothic' })).toBeFocused();
});

test('a removal can be undone, and a promoted genre returns as promoted', async ({ page }) => {
	await stub(page);
	await openBook(page);
	await page.getByRole('button', { name: 'Remove Romance' }).click();
	await expect(page.getByText('Romance removed.')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Undo' })).toBeFocused();
	await page.getByRole('button', { name: 'Undo' }).click();
	const romance = page.getByRole('listitem').filter({ hasText: 'Romance' });
	await expect(romance.getByText('Waiting for sync')).toBeVisible();
});

test('a Calibre genre has no actions, and a failed change says so', async ({ page }) => {
	await stub(page, true);
	await openBook(page);
	await expect(page.getByRole('button', { name: 'Remove Classics' })).toHaveCount(0);
	await page.getByRole('button', { name: 'Promote Gothic' }).click();
	await expect(page.getByText(/Couldn’t promote Gothic/)).toBeVisible();
	const results = await new AxeBuilder({ page })
		.include('aside')
		.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
		.analyze();
	expect(results.violations.map((v) => `${v.id} (${v.nodes.length})`)).toEqual([]);
});

test('the Genres tab lists a genre and opens its shelf', async ({ page }) => {
	await stub(page);
	await page.goto('/');
	await page.waitForLoadState('networkidle');
	await page.getByRole('link', { name: 'Library', exact: true }).first().click();
	await page.getByRole('tab', { name: 'Genres' }).click();
	const link = page.getByRole('link', { name: /Gothic/ });
	await expect(link).toContainText('All suggested');
	await link.click();
	await expect(page).toHaveURL(/\/library\/shelf\/genre\/gothic/);
	await expect(page.getByRole('heading', { name: 'Gothic', level: 1 })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Jane Eyre' }).first()).toBeVisible();
});
