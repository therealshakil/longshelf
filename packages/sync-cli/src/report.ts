/**
 * What `longshelf library` prints and the exit code it ends with
 * (specs/003-library-mirror/contracts/cli.md, FR-008).
 */

export const EXIT = {
	ok: 0,
	problems: 1,
	notConfigured: 2,
	locked: 3,
	declined: 4
} as const;

export interface Problem {
	title: string;
	message: string;
}

export interface RunSummary {
	total: number;
	mirror: string;
	added: number;
	updated: number;
	removed: number;
	bytesUploaded: number;
	seconds: number;
	problems: Problem[];
	dryRun?: boolean;
}

export function formatBytes(n: number): string {
	if (n < 1024) return `${n} B`;
	const units = ['KB', 'MB', 'GB'];
	let v = n / 1024;
	let i = 0;
	while (v >= 1024 && i < units.length - 1) {
		v /= 1024;
		i++;
	}
	return `${v < 10 ? v.toFixed(1) : Math.round(v)} ${units[i]}`;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function report(s: RunSummary): { text: string; code: number } {
	const head = `Longshelf: ${plural(s.total, 'book')} in Calibre, mirror at ${s.mirror}`;
	const changed = s.added + s.updated + s.removed > 0;
	const lines = [head];
	if (s.dryRun)
		lines.push(
			`Dry run: would upload ${plural(s.added, 'book')} (${formatBytes(s.bytesUploaded)}), update ${s.updated}, remove ${s.removed}. Nothing was changed.`
		);
	else if (!changed && !s.problems.length)
		lines.push(
			`Nothing changed. Mirror is up to date (checked ${plural(s.total, 'book')} in ${Math.round(s.seconds)} s).`
		);
	else
		lines.push(
			`Uploaded ${plural(s.added, 'book')} (${formatBytes(s.bytesUploaded)}), updated ${s.updated}, removed ${s.removed}. ${plural(s.problems.length, 'problem')}.`
		);
	if (s.problems.length) {
		lines.push(`${plural(s.problems.length, 'problem')}:`);
		for (const p of s.problems) lines.push(`  "${p.title}": ${p.message}`);
		if (!s.dryRun) lines.push('Mirror updated for everything else.');
	}
	return {
		text: lines.join('\n'),
		code: s.problems.length ? EXIT.problems : EXIT.ok
	};
}

/** A failure that ends the run, with the exit code and the next action in plain words. */
export class RunError extends Error {
	readonly code: (typeof EXIT)[keyof typeof EXIT];
	constructor(code: (typeof EXIT)[keyof typeof EXIT], message: string) {
		super(message);
		this.code = code;
	}
}
