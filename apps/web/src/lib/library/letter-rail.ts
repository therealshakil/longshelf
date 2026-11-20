/** A–Z helpers for the All Books rail (spec 002 US3). */
export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/** The letter under a pointer at `y`, given the rail's top and height (clamped to the rail). */
export function letterAt(y: number, top: number, height: number, letters = LETTERS): string {
	const i = Math.floor(((y - top) / height) * letters.length);
	return letters[Math.max(0, Math.min(letters.length - 1, i))];
}

/** The first letter of a sort key, as a heading letter; anything else files under "#". */
export function headingLetter(sortKey: string): string {
	const c = sortKey.normalize('NFD').charAt(0).toUpperCase();
	return /[A-Z]/.test(c) ? c : '#';
}
