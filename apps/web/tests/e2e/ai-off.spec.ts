import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Spec 002 SC-006 / FR-016: with AI switched off, every screen still opens and every non-AI task
// completes; AI areas hide or say they are off.
test.describe('AI switched off', () => {
	test.beforeEach(async ({ request }) => {
		const r = await request.put('/api/ai/enabled', { data: { enabled: false } });
		expect(r.ok()).toBe(true);
	});
	test.afterEach(async ({ request }) => {
		await request.put('/api/ai/enabled', { data: { enabled: true } });
	});

	test('the operator page says AI is off and offers to switch it on', async ({ page }) => {
		await page.goto('/settings/ai');
		await expect(page.getByText('AI features are off')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Switch AI on' })).toBeVisible();
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
			.analyze();
		expect(results.violations.map((v) => `${v.id} (${v.nodes.length})`)).toEqual([]);
	});

	test('every screen opens and resuming a book still works', async ({ page }) => {
		for (const path of [
			'/',
			'/library',
			'/library?tab=authors',
			'/library?tab=genres',
			'/library?tab=collections',
			'/library?tab=news',
			'/library?tab=all',
			'/library/authors/jane-austen',
			'/library/shelf/collection/gothic',
			'/book/george-eliot_middlemarch'
		]) {
			const res = await page.goto(path);
			expect(res?.status(), path).toBe(200);
		}
		await page.goto('/');
		await page.getByRole('link', { name: /Continue reading/ }).click();
		await expect(page).toHaveURL(/\/read\/george-eliot_middlemarch$/);
	});
});
