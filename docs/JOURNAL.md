# Journal

## 2026-11-14: Spec Kit adopted; spec 001 (visual design) planned

- Adopted Spec Kit (AI-Team constitution, as in navarraluxe). PLAN.md is now the spec index plus spike log.
- Added spec 001, visual design, ahead of the mirror: calm, ND-friendly design built on calm-ds
  v0.1.0, with one catalogue page per element.
- Planned 001: research.md covers typefaces, polarity, contrast, colour, line length, motion,
  focus, preferences and testing. Every value is sourced or marked ASSUMPTION.
- DR-0001: custom catalogue route over Storybook. Histoire and Kitbook lack Svelte 5
  support (npm, 2026-11-14).
- The workspace scaffold (pnpm, SvelteKit, shared) moves from 002 into 001. Deploy stays in 002.
- Owner accepted DR-0001 (build our own catalogue).
- Owner approved `@axe-core/playwright` (dev dependency).
- Tasks generated: 57 (specs/001-visual-design/tasks.md).
- **Next:** `/speckit-implement` for 001, MVP = Setup → Foundational → US1 → US2.

## 2026-11-14: Spec 001 Phase 1 (setup) done; scope narrowed to defaults

- Workspace scaffolded:
  - pnpm 12 (via corepack); build scripts allow-listed in `pnpm-workspace.yaml` (esbuild, workerd);
  - `apps/web`: SvelteKit 3, Svelte 5.57, Tailwind 4.3, Vite 8, adapter-cloudflare;
  - `packages/shared`: Zod.
- shadcn-svelte initialised (vega preset, Lucide), but its theme CSS was not applied, because Ribbon's tokens replace it.
- Dependencies added: `cn` (shadcn's class merger, approved by the owner) and `@axe-core/playwright` (approved).
- Fonts are self-hosted from the googlefonts repos (variable woff2, OFL): Atkinson Hyperlegible Next and Literata.
- Deviation from T002: the adapter generated a minimal `wrangler.jsonc` (no bindings), and the build and typecheck scripts depend on it. It is kept; deploy is still spec 002.
- Scope change (owner): good defaults first. User-adjustable appearance (US3, FR-009–011, SC-007) is deferred. The app follows the system light/dark and reduced-motion settings, and calm-ds VII is marked "deferred". Spec, plan, tasks, data model and contract are amended.
- `CLAUDE.md` Commands section filled in.
- **Next:** Phase 2 (tokens, contrast test, CSS generation, base styles).
