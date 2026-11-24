import { describe, expect, it } from 'vitest';
import { EXIT, formatBytes, report } from '../src/report.ts';

const base = {
	total: 670,
	mirror: 'library.example',
	added: 0,
	updated: 0,
	removed: 0,
	bytesUploaded: 0,
	seconds: 4,
	problems: []
};

describe('report', () => {
	it('says nothing changed', () => {
		const r = report(base);
		expect(r.text).toBe(
			'Longshelf: 670 books in Calibre, mirror at library.example\nNothing changed. Mirror is up to date (checked 670 books in 4 s).'
		);
		expect(r.code).toBe(EXIT.ok);
	});

	it('reports changes', () => {
		const r = report({
			...base,
			added: 3,
			updated: 2,
			removed: 1,
			bytesUploaded: 41 * 1024 * 1024
		});
		expect(r.text).toContain('Uploaded 3 books (41 MB), updated 2, removed 1. 0 problems.');
	});

	it('lists problems by title and exits 1', () => {
		const r = report({
			...base,
			added: 1,
			problems: [{ title: 'Dracula', message: 'file missing on disk (EPUB).' }]
		});
		expect(r.text).toContain('  "Dracula": file missing on disk (EPUB).');
		expect(r.text).toContain('Mirror updated for everything else.');
		expect(r.code).toBe(EXIT.problems);
	});

	it('formats sizes', () => {
		expect(formatBytes(512)).toBe('512 B');
		expect(formatBytes(1.5 * 1024 * 1024)).toBe('1.5 MB');
		expect(formatBytes(3.3 * 1024 ** 3)).toBe('3.3 GB');
	});
});
