import { expect, test } from '@playwright/test';

// Spec 003 FR-026: with AI on (the default), Settings says plainly what is sent to the AI service.
test('AI settings say that book details and some book text are sent', async ({ page }) => {
	await page.goto('/settings/ai');
	await expect(page.getByRole('heading', { name: 'Where your books go' })).toBeVisible();
	await expect(page.getByText(/book details\s+\(titles, authors, descriptions\)/)).toBeVisible();
});
