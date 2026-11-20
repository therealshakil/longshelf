import { describe, expect, it } from 'vitest';
import { beforeCutoff } from './story.ts';

describe('recap cut-off (FR-011, SC-004)', () => {
	it('uses only chapters strictly before the current one, in order', () => {
		const rows = [3, 0, 5, 1, 4].map((o) => ({
			ordinal: o,
			chapter_label: `C${o}`,
			summary: `S${o}`
		}));
		expect(beforeCutoff(rows, 4).map((r) => r.ordinal)).toEqual([0, 1, 3]);
	});
	it('uses nothing when the reader is in the first chapter', () => {
		expect(beforeCutoff([{ ordinal: 0, chapter_label: 'C0', summary: 'S0' }], 0)).toEqual([]);
	});
});

describe('summary sanity (seen 2026-11-20)', async () => {
	const { looksLikeSummary } = await import('./story.ts');
	it('rejects replies that ask for the text instead of summarising it', () => {
		expect(
			looksLikeSummary('Please provide the text of the chapter you would like me to summarize.')
		).toBe(false);
		expect(looksLikeSummary('I’m sorry, I can’t help with that.')).toBe(false);
		expect(looksLikeSummary('')).toBe(false);
	});
	it('accepts an ordinary summary', () => {
		expect(
			looksLikeSummary(
				'Ishmael explained that he went to sea whenever he felt low, and set off for Nantucket.'
			)
		).toBe(true);
	});
});
