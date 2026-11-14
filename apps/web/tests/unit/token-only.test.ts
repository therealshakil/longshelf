import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Components and catalogue pages use tokens only (contracts/tokens-and-catalogue.md):
 * no raw colours, no raw px sizes (except 1px hairlines), no transitions or animations.
 * Vendored shadcn-svelte primitives in components/ui are excluded; app.css guards them globally.
 */
const root = join(import.meta.dirname, '../../src');
const scanDirs = ['lib/components', 'lib/catalogue', 'routes'];

function files(dir: string): string[] {
	let out: string[] = [];
	let entries: string[];
	try {
		entries = readdirSync(dir);
	} catch {
		return out;
	}
	for (const e of entries) {
		const p = join(dir, e);
		if (statSync(p).isDirectory()) {
			if (e === 'ui') continue;
			out = out.concat(files(p));
		} else if (p.endsWith('.svelte')) out.push(p);
	}
	return out;
}

const rules: [string, RegExp][] = [
	['raw hex colour', /(?<![\w&])#[0-9a-fA-F]{3,8}\b/],
	['raw colour function', /\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\(/],
	['raw px size (other than 1px)', /(?<![\w.-])(?!1px\b)\d+(?:\.\d+)?px\b/],
	[
		'transition or animation',
		/\b(?:transition(?:-[a-z]+)?|animate-[a-z]+|duration-\d+)\b|@keyframes|\banimation\s*:/
	],
	[
		'Tailwind default palette colour',
		/\b(?:bg|text|border|ring|fill|stroke)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)\b/
	]
];

describe('token-only rule', () => {
	const all = scanDirs.flatMap((d) => files(join(root, d)));

	it('finds files to scan', () => {
		expect(all.length).toBeGreaterThan(0);
	});

	it.each(all.map((f) => relative(root, f)))('%s uses tokens only', (rel) => {
		const lines = readFileSync(join(root, rel), 'utf8').split('\n');
		const problems: string[] = [];
		lines.forEach((line, i) => {
			if (/token-only:\s*allow/.test(line)) return;
			for (const [what, re] of rules)
				if (re.test(line)) problems.push(`${i + 1}: ${what}: ${line.trim()}`);
		});
		expect(problems).toEqual([]);
	});
});
