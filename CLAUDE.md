# Ribbon

Private cloud mirror of a Calibre library, with a web reader (installable PWA, offline) and
two-way reading-progress sync. Single user per deployment.

Read `docs/DESIGN.md` before making architectural changes. `docs/PLAN.md` indexes the specs and holds the spike log;
record spike findings there. Per-feature tasks live in `specs/NNN-name/tasks.md`.

## Principles (in priority order)
1. Ease of long-term maintenance: few moving parts, few dependencies, web standards over plugins.
2. Calibre is the source of truth. Never write to `metadata.db` directly; writes go through `calibredb`.
3. The core is device-agnostic. Device specifics (e.g. Kobo) live in config or in an optional adapter.
4. Prefer established, human-maintained libraries. Ask before adding a dependency.
5. TypeScript everywhere. Plain SQL, no ORM.

## Stack
- Cloudflare Worker (SvelteKit + `@sveltejs/adapter-cloudflare`), D1, R2, Cloudflare Access for auth
- Svelte 5, Tailwind v4, shadcn-svelte (Bits UI), Lucide icons
- Dexie (IndexedDB), OPFS for downloaded books, SvelteKit native service worker
- foliate-js as a pinned git submodule in `vendor/`, wrapped by one `Reader.svelte` adapter
- `ribbon` CLI: Node 24, built-in `node:sqlite`; Linux and macOS
- Zod for the API contract (`packages/shared`), Vitest (+ `@cloudflare/vitest-pool-workers`), Playwright

## Layout
```
apps/web/            SvelteKit app + API, wrangler.jsonc, migrations/
packages/sync-cli/   ribbon
packages/shared/     types + Zod schemas
vendor/foliate-js/   submodule
docs/                DESIGN.md, PLAN.md, JOURNAL.md, decisions/ (DR-NNNN)
specs/               Spec Kit features (NNN-name/: spec, plan, tasks)
.specify/            Spec Kit scaffold; memory/constitution.md = AI-Team constitution (copied)
```

Work goes through Spec Kit: `/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`.
The Ribbon principles above are project-specific and sit alongside the constitution.

## Commands
(Fill in as the repo is scaffolded: dev, test, lint, typecheck, deploy, migrate.)
