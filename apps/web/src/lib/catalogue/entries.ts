import { CatalogueMetaSchema, type CatalogueMeta } from '@ribbon/shared/design/meta';

/** Every catalogue entry: one `meta.ts` per folder under routes/design. */
const modules = import.meta.glob<{ meta: CatalogueMeta }>('../../routes/design/*/meta.ts', {
	eager: true
});

export const entries: CatalogueMeta[] = Object.values(modules)
	.map((m) => CatalogueMetaSchema.parse(m.meta))
	.sort((a, b) => a.order - b.order);

export const GROUPS = [
	{ kind: 'guide', label: 'Start here' },
	{ kind: 'token', label: 'Tokens' },
	{ kind: 'component', label: 'Components' }
] as const;

export const LAST_PAGE_KEY = 'ribbon.design.last';
