import { expect, test } from '@playwright/test';

/** On-demand summaries (DR-0004), with the AI endpoints stubbed so no neurons are spent. */
test('a recap from Home fills earlier chapters and sends nothing past the place', async ({
	page
}) => {
	const sent: { ordinal: number; chapterLabel: string }[] = [];
	await page.route('**/api/ai/chapter-summary/*', (r) => r.fulfill({ json: { ordinals: [] } }));
	await page.route('**/api/ai/chapter-summary', async (r) => {
		sent.push(r.request().postDataJSON());
		await r.fulfill({ json: { ok: true } });
	});
	let recapUrl = '';
	await page.route('**/api/ai/recap/*', (r) => {
		recapUrl = r.request().url();
		return r.fulfill({
			json: {
				state: 'ready',
				upto: { label: 'x', percent: 20 },
				paragraphs: ['The story so far.'],
				note: 'Written by AI.'
			}
		});
	});
	await page.goto('/');
	await page
		.getByRole('button', { name: /Story so far/ })
		.first()
		.click();
	await expect(page.getByText('The story so far.')).toBeVisible({ timeout: 30_000 });

	const cutoff = Number(new URL(recapUrl).searchParams.get('ordinal'));
	expect(cutoff).toBeGreaterThan(0);
	expect(sent.length).toBeGreaterThan(0);
	expect(Math.max(...sent.map((s) => s.ordinal))).toBeLessThan(cutoff);
	const last = sent.reduce((a, b) => (b.ordinal > a.ordinal ? b : a));
	expect(last.chapterLabel).toMatch(/^CHAPTER 22\./);
});
