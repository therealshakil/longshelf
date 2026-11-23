import { describe, expect, it } from 'vitest';
import { createSampleLibrary } from './index.ts';
import { titleSortKey } from '../library/status.ts';

const lib = createSampleLibrary({ now: new Date('2026-11-18T12:00:00Z') });

describe('SampleLibrary (FR-007)', () => {
	it('leads with Middlemarch and lists the other books in progress, newest first', async () => {
		const current = await lib.current();
		expect(current?.book.title).toBe('Middlemarch');
		const also = await lib.alsoReading(5);
		expect(also.map((b) => b.book.title)).toEqual(['Anna Karenina', 'Meditations', 'Moby Dick']);
	});

	it('alsoReading returns at most 5', async () => {
		expect((await lib.alsoReading(50)).length).toBeLessThanOrEqual(5);
	});

	it('keeps the Kobo position alongside this device', async () => {
		const current = await lib.current();
		expect(current?.positions.find((p) => p.source === 'kobo')?.percent).toBe(49);
	});

	it('never lists periodicals in Recently added', async () => {
		const { thisWeek, earlier } = await lib.recentlyAdded();
		const titles = [...thisWeek, ...earlier].map((b) => b.title);
		const pubs = (await lib.periodicals()).map((p) => p.publication);
		for (const p of pubs) expect(titles).not.toContain(p);
	});

	it('sorts all books by title ignoring The, A and An', async () => {
		const keys = (await lib.allBooks()).map((b) => titleSortKey(b.title));
		expect(keys).toEqual([...keys].sort((a, b) => a.localeCompare(b)));
	});

	it('has an author page with bio and bibliography for Jane Austen', async () => {
		const page = await lib.author('jane-austen');
		expect(page?.books.length).toBe(4);
		expect(page?.finishedCount).toBe(1);
		const works = page?.author.bibliography ?? [];
		expect(works.map((w) => w.title)).toContain('Mansfield Park');
		expect(works.find((w) => w.title === 'Emma')?.ownedBookId).toBe('jane-austen_emma');
		expect(works.find((w) => w.title === 'Mansfield Park')?.ownedBookId).toBeUndefined();
	});
});
