import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	CatalogueMetaSchema,
	PRINCIPLES,
	isAssumption,
	type CatalogueMeta
} from '@ribbon/shared/design/meta';
import { tokens } from '@ribbon/shared/tokens';

/** SC-001 / contracts/tokens-and-catalogue.md: every element is catalogued, sourced and checked. */
const modules = import.meta.glob<{ meta: CatalogueMeta }>('../../src/routes/design/*/meta.ts', {
	eager: true
});
const metas = Object.entries(modules).map(([path, m]) => ({ path, meta: m.meta }));

const src = join(import.meta.dirname, '../../src');

describe('catalogue completeness', () => {
	it('has entries', () => {
		expect(metas.length).toBeGreaterThan(0);
	});

	it.each(metas.map((m) => [m.path, m.meta] as const))('%s is a valid entry', (path, meta) => {
		expect(() => CatalogueMetaSchema.parse(meta)).not.toThrow();
		expect(path).toContain(`/design/${meta.id}/meta.ts`);
		expect(meta.checks.map((c) => c.principle).sort()).toEqual([...PRINCIPLES].sort());
		expect(existsSync(join(src, 'routes/design', meta.id, '+page.svelte'))).toBe(true);
	});

	it('ids are unique', () => {
		const ids = metas.map((m) => m.meta.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('every Ribbon component has a catalogue page', () => {
		const dir = join(src, 'lib/components');
		const components = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.svelte')) : [];
		const ids = new Set(metas.map((m) => m.meta.id));
		const kebab = (f: string) =>
			f
				.replace(/\.svelte$/, '')
				.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
				.toLowerCase();
		expect(components.filter((c) => !ids.has(kebab(c)))).toEqual([]);
	});

	it('decisions resting only on ASSUMPTION are under 20% (SC-001)', () => {
		// A decision is a token value or a catalogue entry. It is "assumed" when none of its sources is published.
		const decisions = [
			...tokens.map((t) => t.sources),
			...metas.filter((m) => m.meta.kind === 'component').map((m) => m.meta.sources)
		];
		const assumedOnly = decisions.filter((srcs) => srcs.every(isAssumption)).length;
		expect(assumedOnly / decisions.length).toBeLessThan(0.2);
	});
});
