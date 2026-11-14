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

## 2026-11-14: Spec 001 Phase 2 (tokens) done

- Tokens live in `packages/shared/src/tokens`: 11 colours (light and dark, OKLCH), 12 type, 8 space, 2 radius, motion (0ms), 2 focus, 1 target size. Each has a rationale and sources, or is marked ASSUMPTION.
- Source registry: `packages/shared/src/design/sources.ts`, taken from research.md.
- Contrast is measured, not eyeballed. A dependency-free OKLCH → sRGB → WCAG ratio function is checked against reference values. Measured results:
  - body text 11.5:1 (light) and 11.8:1 (dark), inside the 9–12 calm band;
  - every one of the 19 pairs meets AA in both themes;
  - the light focus colour was out of gamut at first; its chroma was reduced to 0.075.
- `tokens.css` is generated before `dev`, `build`, `test` and `typecheck`, and is gitignored. Tailwind's default colour palette is removed, and the shadcn names point at the tokens.
- Global rules: no transitions or animations; bold for emphasis instead of italics; a 66ch measure on prose; a 3px focus ring.
- The token-only lint test is in place.
- **Next:** US1, the catalogue shell.

## 2026-11-14: Spec 001 US1 (catalogue shell) done

- `/design` built:
  - an index in the same place on every page (a sidebar on wide screens, a collapsed list on narrow ones), with the current page marked by a bar, weight and `aria-current`;
  - `EntryPage` wraps each page as Examples, then Why, then Sources, then calm-ds Checks;
  - `StatesGrid` shows every state at once, with no controls;
  - `/design` opens the last page you visited (stored in localStorage; falls back silently).
- The About page is the first entry. A "guide" kind was added to `CatalogueMeta` for pages that aren't tokens or components.
- Tests: catalogue completeness (schema, 7 checks, a page per entry, a page per component, ASSUMPTION under 20%) and an e2e test (every page has all its blocks and no animations).
- Toolchain fixes:
  - SvelteKit 3's lint rule requires `resolve()` for internal links; external source links are exempted inline;
  - `wrangler types` output depends on whether a build exists, so `worker-configuration.d.ts` is now generated on demand and gitignored, and `checkJs` is off (Ribbon is TypeScript-only).
- **Next:** US2, the token pages.

## 2026-11-14: Spec 001 US2 (token pages) done; MVP ready for owner review

- Seven token pages: Colour (both themes side by side, with a live contrast table), Type, Space, Corners, Motion, Focus (static ring plus measured contrast), Target size.
- Shared catalogue pieces: `TokenTable`, plus `meta-helpers` (calm-ds VII defaults to "deferred"; sources are de-duplicated).
- SC-001 is now measured per decision, as the spec words it (analysis F3): 6 of 38 token decisions rest only on ASSUMPTION (type steps, heading leading, both radii), which is 16%.
- An interim axe check (`a11y-smoke.spec.ts`) covers every page in light and dark: zero violations. The full matrix is T052.
- Tests: 47 shared unit, 28 web unit, 4 e2e, all passing. Typecheck and lint are clean.
- **Learning:** axe found links distinguished only by colour. Tailwind's preflight removes link underlines, and Lightning CSS then dropped our longhand `text-decoration-line: underline` from the merged `a {}` rule. The `text-decoration: underline` shorthand survives. Check the built CSS, not only the source, when a base style seems to have no effect.
- **Efficacy so far:** 0 reworks after implementation; running cost £0.
- **Next:** owner review of the defaults (colours, type, spacing) before US4 components.
