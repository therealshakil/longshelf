import { expect, test, type Page } from '@playwright/test';

// Spec 004 FR-016, research R8: download a book, go offline, reopen the app, and read it.
const BOOK = '/book/bram-stoker_dracula';

async function bookText(page: Page) {
	// The book renders inside foliate's frame; wait until some text has loaded.
	await expect
		.poll(
			async () => {
				for (const f of page.frames())
					if (
						f !== page.mainFrame() &&
						(await f.evaluate(() => document.body?.innerText.length ?? 0).catch(() => 0)) > 200
					)
						return true;
				return false;
			},
			{ timeout: 15_000 }
		)
		.toBe(true);
}

const place = (page: Page) =>
	page.evaluate(() => localStorage.getItem('longshelf.reader.place.bram-stoker_dracula') ?? '');

const library = (page: Page) =>
	page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Library' }).click();

test('a downloaded book opens and reads with no connection', async ({ page, context }) => {
	// The service worker's first install precaches the app shell: slower under the full parallel run.
	test.setTimeout(90_000);
	await page.goto(BOOK);
	// The service worker controls the page from the next load (R8).
	await page.evaluate(() => navigator.serviceWorker.ready);
	await page.reload();
	await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

	await page.getByRole('button', { name: /^Download/ }).click();
	await expect(page.getByText(/^On this device/)).toBeVisible({ timeout: 15_000 });

	await context.setOffline(true);

	// Like reopening the installed app from the home screen: it starts at Home (start_url), and
	// pages after that load inside the app. (Offline, a full load of a deeper address gets the
	// cached start page; spec 003 behaviour.)
	await page.goto('/');
	await library(page);
	await expect(page.getByRole('status').filter({ hasText: 'Offline.' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Dracula (on this device)' }).first()).toBeVisible();

	await page.getByRole('link', { name: 'Dracula (on this device)' }).first().click();
	await page.getByRole('link', { name: /Continue reading|Start reading/ }).click();
	await bookText(page);
	await expect.poll(() => place(page)).not.toBe('');
	const before = await place(page);
	// The sample library has Dracula finished, so it opens at the end: turn back.
	for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowLeft');
	await expect.poll(() => place(page)).not.toBe(before);

	// A book that isn't downloaded says so calmly, without an error page. Moby Dick is on Home's
	// "Also reading" shelf in the sample library.
	await page.goto('/');
	await page.getByRole('link', { name: 'Moby Dick' }).first().click(); // straight to the reader
	await expect(page.getByRole('heading', { name: /isn’t on this device/ })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Back to the library' })).toBeVisible();
});
