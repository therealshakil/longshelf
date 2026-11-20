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

## 2026-11-18: Redesign with Impeccable; full design approved (no app code yet)

- Adopted Impeccable v0.1.24 as a project skill (telemetry off, design hook not wired). `PRODUCT.md` written by `init`.
- A first build went ahead without a preview; the owner rejected it ("muddy and basic") and it was removed. New rule: preview and owner approval before any UI code.
- Five direction rounds on Impeccable's decision page; the owner locked "Bedside Stack" (round 5), which was then reworked into "Now reading".
- Live review, one page at a time, on static mocks in `design-mocks/`, served by Vite on :8411 so changes reload. Approved:
  - Home: current book, Also reading ledger, Read next, Latest news & magazines;
  - Story so far panel;
  - Library: tabs, author page, shelf page;
  - the book page;
  - the reader: tap to hide bars, Night theme.
- Mocks use Standard Ebooks public-domain books and covers, so they can be committed. The owner's Calibre covers were used for the earlier decision rounds only; they stay git-ignored.
- Decisions:
  - DR-0002: the redesign, oxblood accent, calm-ds as guidance;
  - DR-0003: AI features designed, with genres kept in Ribbon first and promoted to Calibre on the owner's say. Implementation and cost are still open.
- **Learning:** Impeccable live mode wires itself into the SvelteKit app when its target sits inside `apps/web`. Static mocks work cleanly from a folder outside the app, with `--target design-mocks/index.html`.
- **Next:** a new spec for the redesign and AI features (`/speckit-specify`), then plan, tasks and the build against the mocks.

## 2026-11-18: Spec 002 (redesigned screens and AI features) specified

- Owner chose one spec for the screens and the AI features together. Mirror, read and device progress are renumbered 003–005 in PLAN.md.
- Screens run on licence-free sample data until the mirror lands (FR-007).
- AI provider: Cloudflare Workers AI only, for now. No Anthropic (owner). Ceiling £5/month, target £0 within the free allowance. Content stays in the owner's account. DR-0003 is updated with the options compared and their prices, read today.
- A Claude subscription cannot power the app: subscription login is for Anthropic's own apps (Claude Code legal page).
- **Next:** `/speckit-plan` for 002.

## 2026-11-18: Spec 002 planned

- `plan.md`, `research.md` (R1–R10), `data-model.md`, `contracts/` (LibrarySource, AI API) and `quickstart.md` written.
- Key calls:
  - screens read through one `LibrarySource`, served by public-domain sample data until the mirror lands;
  - foliate-js rendering and minimal Wrangler config (AI and D1 bindings) are pulled forward from 004 and 003;
  - Story so far is built from per-chapter summaries, so it is spoiler-safe by construction;
  - suggestion reasons come from rules and embeddings, never from a model;
  - a daily spend guard sits at 8,000 neurons (free allowance 10,000);
  - spec 001's US4 component tasks are superseded.
- Owner action needed before the reader tasks: download three Standard Ebooks EPUBs (their robots.txt blocks automated downloads).
- **Next:** `/speckit-tasks` for 002.

## 2026-11-18: Spec 002 tasks generated

- 69 tasks in `specs/002-redesign-and-ai/tasks.md`. The MVP is Home and the reader on sample data (T001–T031).
- **Next:** the owner downloads the three sample EPUBs, then `/speckit-implement` for the MVP.

## 2026-11-18: Spec 002 setup, foundation and US1 (Home) built

- Setup:
  - foliate-js pinned as a submodule (78914ae, 2026-05-01);
  - shadcn-svelte `sheet` and `dialog` added, which installed Bits UI, tailwind-variants and @internationalized/date (agreed stack);
  - sample covers copied;
  - a README asks the owner to save three EPUBs.
- Tokens:
  - measured from the approved mocks: an oxblood accent (`ACCENT_HUE` 12), a new `ink` (headings) and `action` (primary button);
  - a `night` theme;
  - depth tokens (paper grain, cover and tile shadows);
  - new type steps (`text-xs`, `text-display`, `text-reading`, `leading-reading`, `weight-title`) and radii (`radius-cover`, `radius-pill`);
  - contrast pairs pass in light, dark and night.
  
  Light `control` was darkened to keep 3:1 on surfaces. Night control was darkened from the mock to reach 3:1.
- `LibrarySource` contract, the read-status rule (FR-005) and `SampleLibrary` (Standard Ebooks data, invented progress) are in `packages/shared`, with tests.
- Components:
  - AppHeader, SyncStatus, BookTile, EmptyState, ErrorState, CurrentBook ("Spread"), LedgerRow ("Compact band") and PeriodicalRow;
  - each has a catalogue page.
- Routes: Home is built against the mock; `/read/[id]` is a stub; `/library`, `/book/[id]` and `/search` are placeholders.
- Tests: 90 shared unit, 56 web unit; e2e home (8, including axe in light and dark at 390 and 1440), catalogue and a11y-smoke all pass.
- **Learning:**
  - SvelteKit 3 renders relative hrefs during SSR, so the catalogue e2e tests had matched no links: the a11y smoke test was scanning zero pages. The tests now resolve hrefs to pathnames; all 16 catalogue pages pass axe in light and dark.
  - A stale `wrangler dev` preview on :4173 from 14 Nov had been serving old builds to the e2e run (`reuseExistingServer`). It was killed.
- **Next:** US2, the reader. Blocked until the owner saves the three EPUBs in `apps/web/static/sample/books/`.

## 2026-11-18: Spec 002 US2 (reader) built: MVP ready for owner review

- **Reader:**
  - `Reader.svelte` wraps foliate-js and injects book typography from the tokens: Literata at reading size, ragged right, no hyphenation, old-style figures, first-line indents. It sets the book frame's `color-scheme` to match the page, so dark and night don't paint a white canvas.
  - ReaderChrome: thin bars; a tap in the middle toggles them; they slide only without reduced motion, using the new `duration-reveal` token and the `.reveal` class.
  - KoboNotice is a pill in the top bar.
  - TextPanel and ContentsPanel are Bits UI sheets.
  - Settings (one versioned localStorage key) and this device's place persist.
- **Sample books:** Middlemarch and Moby Dick from Project Gutenberg's official mirror (gutenberg.pglaf.org); Dracula, The King in Yellow and Paradise Lost are Gutenberg editions from the owner's machine (no personal Calibre data inside). Anna Karenina and Meditations have no file and show the "not on this device" state.
- **Robots.txt:** Standard Ebooks' robots.txt disallows `/ebooks/*/downloads/*` and `/ebooks/*/text*` for AI agents, so no Standard Ebooks file is fetched. Disclosure: earlier today, before I read the robots.txt, one Standard Ebooks chapter page (Middlemarch ch. 40) was fetched for the reader mock. The text is public domain.
- **Tests:**
  - reader e2e (11), including axe on the chrome in light, dark and night at 390 and 1440;
  - unit tests: 90 shared, 74 web.
- **Learning:**
  - Cloudflare's worker types override the DOM `Element.append` signature in this project, so `appendChild` is used instead.
  - `pkill -f <pattern>` killed the very shell running it; use the port's pid instead.
- **Next:** owner review of Home and the reader against the mocks (the MVP checkpoint), then US3 (library).

## 2026-11-20: Spec 002 US3 (library) and US8 (news) built

- **Library page:**
  - six tabs in a fixed order (ARIA tabs, state in `?tab=`);
  - Recently added grouped This week / Earlier;
  - Authors list, Collections stacks, an empty Genres tab until AI lands;
  - News & magazines by publication;
  - All Books by title with the scrubbable letter rail.
- **Other pages:**
  - author page: portrait, sourced bio, books, and a bibliography marking owned and not-owned books;
  - shelf page: Title / Author / Recently added sort;
  - book page: header, progress, Continue reading, Download toggle, More menu, description, details.
- News issues open in the reader; with no file they show the "not on this device" state.
- **Accessibility:** axe found the letter rail's letters below the 24px target size. They are now 24px tall, and the dimmed letters hide on short screens.
- **Tests:**
  - e2e library spec (9), including axe on 8 library pages in light and dark at 390 and 1440;
  - all 32 e2e pass;
  - unit tests: 90 shared, 100 web.
  
  The catalogue test now has a 4-minute limit (33 pages), and the Playwright web server a 180-second start limit.
- **Learning:**
  - SvelteKit 3's `goto` options are now `replace` and `reset` (`noScroll`/`keepFocus` are gone).
  - A component that renders an `h1` needs a heading-level prop if it also appears on catalogue pages.
- **Next:** AI groundwork (Phase 7). It needs the owner to run `wrangler login` and `wrangler d1 create ribbon`.

## 2026-11-20: Spec 002 AI groundwork (Phase 7) built

- `wrangler.jsonc`:
  - Workers AI binding `AI` (remote) and D1 binding `DB`;
  - the database is local only, with a placeholder id; spec 003 creates the real one at deploy;
  - no cloud resource created.
- `migrations/0001_ai.sql`: the data-model tables plus `ai_setting` (off switch and ceiling), applied locally. `preview` and `dev:remote` apply migrations first.
- Zod schemas for every `/api/ai/*` shape are in `packages/shared/src/ai`.
- Spend guard: 8,000 neurons/day by default, the UTC day resets it, and switching AI off blocks every AI call. It is unit-tested with an in-memory store.
- `MODELS` (model ids as config) with a neuron estimate per call.
- Operator page `/settings/ai`: on/off switch, today's use, and where content goes. `GET /api/ai/usage` and `PUT /api/ai/enabled`.
- Tests: e2e ai-off spec (every route opens with AI off; operator page passes axe); 104 web unit tests.
- **Learning:**
  - SvelteKit 3 exposes Cloudflare bindings through `import { env } from 'cloudflare:workers'`, emulated in `vite dev`. `event.platform.env` is not populated.
  - Running Prettier from `apps/web` on `packages/shared` without `--config` reformatted shared files in Prettier's default style. Shared has no Prettier config or lint script, so pass apps/web's config explicitly.
- **Next:** US4 Story so far (chapter summaries on Workers AI, recap assembly, eval).
