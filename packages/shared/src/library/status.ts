import type { ReadingPosition, ReadStatus } from './types.ts';

/** Finished counts from this percentage up (rounding from the reader's end-of-book position). */
const FINISHED_AT = 99.5;

/** Read status from all known positions of a book: the furthest source wins. */
export function statusFrom(positions: ReadingPosition[], finished = false): ReadStatus {
	if (finished) return { kind: 'finished' };
	const furthest = Math.max(0, ...positions.map((p) => p.furthestPercent));
	if (furthest >= FINISHED_AT) return { kind: 'finished' };
	if (furthest <= 0) return { kind: 'unread' };
	return { kind: 'in-progress', percent: Math.round(furthest) };
}

/**
 * The one read-status label (FR-005): no label when unread, "N% read" in progress,
 * "Finished" when finished.
 */
export function statusLabel(status: ReadStatus): string | null {
	switch (status.kind) {
		case 'unread':
			return null;
		case 'in-progress':
			return `${status.percent}% read`;
		case 'finished':
			return 'Finished';
	}
}

/** Sort key for titles: ignores a leading "The", "A" or "An". */
export function titleSortKey(title: string): string {
	return title.replace(/^(the|a|an)\s+/i, '').toLocaleLowerCase('en');
}
