---
description: "Tasks for 001 visual design system and design catalogue"
---

# Tasks: Visual design system and design catalogue

**Input**: `specs/001-visual-design/` (plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md)

**Tests**: included. The spec requires automated verification (SC-001 completeness, SC-003 contrast
and axe, SC-007 persistence).

**Rules for every task**:
- Components use tokens only: no raw colours, sizes or durations (contracts/tokens-and-catalogue.md).
- Copy follows calm-ds VI: literal labels, buttons that say what happens.
- Sample content is realistic: no lorem ipsum.
- Do not add any dependency beyond those named in plan.md without asking the owner.
- **Definition of done (constitution):** every phase checkpoint is committed together with a
  `docs/JOURNAL.md` entry (what landed, what's next) and any spec, DR or research update it
  needs. Tick the tasks here in the same commit.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

**Purpose**: the workspace scaffold (moved here from spec 002). No Wrangler config and no deploy.

- [X] T001 Create the pnpm workspace: `pnpm-workspace.yaml` (`apps/*`, `packages/*`), root `package.json` (scripts: `dev`, `test`, `test:e2e`, `lint`, `typecheck` that delegate with `--filter`), `.nvmrc` (24), `.gitignore`, `.editorconfig`.
- [X] T002 Scaffold the SvelteKit app (Svelte 5, TypeScript) in `apps/web/` with `npx sv create`. Use `@sveltejs/adapter-cloudflare` as the adapter, but add no Wrangler config yet.
- [X] T003 [P] Create `packages/shared/` (TypeScript, `zod` dependency, `src/index.ts`) and reference it from `apps/web`.
- [X] T004 [P] Add Tailwind v4 to `apps/web` with `npx sv add tailwindcss`. Initialise shadcn-svelte (`npx shadcn-svelte@latest init`) into `apps/web/src/lib/components/ui/`. Add `@lucide/svelte`.
- [X] T005 [P] Configure ESLint and Prettier (via `sv add`), `svelte-check` for `typecheck`, Vitest for unit tests in `apps/web` and `packages/shared`, and Playwright plus `@axe-core/playwright` (owner-approved) in `apps/web/tests/e2e/`.
- [X] T006 [P] Download the woff2 files for Atkinson Hyperlegible Next (variable) and Literata (variable). Use official sources only: the googlefonts GitHub repos or Google Fonts. Put them in `apps/web/static/fonts/` with their `OFL.txt` licence files, and declare `@font-face` with `font-display: swap` in `apps/web/src/app.css`.
- [X] T007 Fill in the `## Commands` section of `CLAUDE.md` with the real commands (dev, test, test:e2e, lint, typecheck).

**Checkpoint**: `pnpm dev` serves the default page; `pnpm test`, `pnpm lint` and `pnpm typecheck` all pass.

---

## Phase 2: Foundational (blocks every story)

**Purpose**: the token source, the CSS generated from it, and the metadata types. Every story
builds on these. *(Scope change 2026-11-14: defaults only. Light and dark come from the system
setting; there is no preference store.)*

- [ ] T008 Define the metadata types in `packages/shared/src/design/meta.ts`:
  - `Source = { title, publisher?, url?, checked: date } | { assumption: true, note }`.
  - `CheckResult = { principle: 'I'…'VII', result: 'pass' | 'n/a' | 'deferred', reason }`. calm-ds VII is `deferred` while US3 is deferred.
  - `CatalogueMeta = { id, title, kind: 'token' | 'component', order, rationale, sources: Source[], checks: CheckResult[7] }`.
  - Add the matching Zod schemas.
- [ ] T009 Define the tokens in `packages/shared/src/tokens/`, one file per group: `color.ts`, `type.ts`, `space.ts`, `radius.ts`, `motion.ts`, `focus.ts`, `size.ts`.
  - Every token: `{ name (kebab-case, grouped), group, value, rationale, sources }`, with "≥1 source, or `assumption: true`" (data-model.md).
  - Colour values are OKLCH, given per theme (light, dark).
  - Take the starting values from research.md:
    - off-white background, never `#fff`; dark grey, not black, for dark mode;
    - exactly one accent hue (a muted blue-green), with lightness variants only; no saturated red or yellow areas (FR-005);
    - body text about 9–12:1;
    - type: Atkinson Hyperlegible Next for the interface, ≥16 px, in `rem`; line height 1.5; reading measure 66ch;
    - motion 0 ms;
    - focus outline 3 px solid with an offset, ≥3:1;
    - target size 44 px.
- [ ] T010 Define the contrast pairs `{ fg, bg, minRatio }` in `packages/shared/src/tokens/pairs.ts`, covering every text-on-background and interface-on-background combination: 4.5 for text, 3 for large text and interface parts. Add a WCAG relative-luminance contrast function (OKLCH → sRGB → ratio) in `packages/shared/src/tokens/contrast.ts`, with no dependency.
- [ ] T011 [P] Write a unit test, `packages/shared/src/tokens/contrast.test.ts`, that checks the contrast function against known WCAG reference pairs, and checks every pair in both themes against its `minRatio` (FR-004, SC-003). Also assert that all accent tokens share one hue, within ±5° OKLCH (FR-005). Together with the token-only lint (T017), this guarantees one accent per view.
- [ ] T012 Write the token-to-CSS generator, `packages/shared/src/tokens/to-css.ts`, and a build script, `apps/web/scripts/gen-tokens.ts`, run before `dev`, `build` and `test`. It emits `apps/web/src/lib/styles/tokens.css`:
  - custom properties for light under `:root`, and for dark under `@media (prefers-color-scheme: dark)`;
  - a `[data-theme="light"|"dark"]` override, used only by the catalogue to show both themes side by side;
  - all durations `0ms`, and a global `prefers-reduced-motion` rule as a safety net;
  - a Tailwind v4 `@theme` block that maps utilities to the tokens.

  Import it in `apps/web/src/app.css`.
- [ ] T013 *(deferred with US3)* Preference schema: see contracts/preferences.md.
- [ ] T014 *(deferred with US3)* Preference precedence tests.
- [ ] T015 *(deferred with US3)* Head script that applies preferences before first paint.
- [ ] T016 Add the base styles and `@font-face` rules in `apps/web/src/app.css`:
  - body uses the token background and text colours and the interface font;
  - a global `:focus-visible` rule using the focus tokens;
  - `max-inline-size` for prose;
  - restyle the shadcn-svelte theme variables so they point at Ribbon tokens.
- [ ] T017 [P] Add a token-only lint test, `apps/web/tests/unit/token-only.test.ts`. It scans `apps/web/src/lib/components/**/*.svelte` and fails on raw colour literals (`#`, `rgb(`, `oklch(`), raw px sizes outside the token files, and non-token `transition`/`animation` durations.

**Checkpoint**: the tokens generate CSS; the contrast test passes; the page follows the system's
light or dark setting.

---

## Phase 3: User Story 1 - Browse the design catalogue (P1) 🎯 MVP

**Goal**: an index plus one page per element, showing its states, rationale, sources and calm-ds
Checks.

**Independent Test**: open `/design`, pick an element, and confirm every block is present and
nothing moves. Reload, and confirm you return to the same page.

- [ ] T018 [P] [US1] Build `apps/web/src/lib/catalogue/StatesGrid.svelte`. It takes `states: { name, props, sampleContent }[]` and a component, and renders each state labelled, side by side, wrapping into one column at narrow widths. It has no interactive controls (DR-0001 scope cap).
- [ ] T019 [P] [US1] Build `apps/web/src/lib/catalogue/MetaBlock.svelte`. It renders the rationale, the source list (a link plus the title kept as text; ASSUMPTION shown as a plain label, not a colour alone), and a table of the 7 calm-ds Check results.
- [ ] T020 [US1] Build `apps/web/src/routes/design/+layout.svelte` and `+layout.ts`. They:
  - collect `meta.ts` from every element folder with `import.meta.glob`;
  - show a short index grouped "Tokens" then "Components", ordered by `order`;
  - keep the index in the same place on every page (calm-ds II).
- [ ] T021 [US1] Make the catalogue remember the last page visited: store it in `localStorage["ribbon.design.last"]` inside try/catch, and redirect `/design` there when it is set (US1 scenario 3).
- [ ] T022 [US1] Add `apps/web/src/routes/design/about/+page.svelte` plus `meta.ts`. It explains how to read a page and links DR-0001, research.md and the calm-ds Checks (covers US5's surface).
- [ ] T023 [P] [US1] Write a unit test, `apps/web/tests/unit/catalogue-complete.test.ts`. Every `meta.ts` must pass the `CatalogueMeta` schema. Every source list must be non-empty or be an assumption. Every entry needs exactly 7 checks. Every component in `apps/web/src/lib/components/*.svelte` must have a catalogue folder. ASSUMPTION sources must be under 20% across all entries (SC-001).
- [ ] T024 [P] [US1] Write an e2e test, `apps/web/tests/e2e/catalogue.spec.ts`:
  - the index lists every entry;
  - each page shows the states, rationale, sources and checks;
  - the last page is restored after a reload;
  - no element has a running animation (`document.getAnimations().length === 0`).

**Checkpoint**: the catalogue shell works, with the About page as its first entry.

---

## Phase 4: User Story 2 - Tokens grounded in research (P1)

**Goal**: one catalogue page per token group, showing its values, evidence and measured results.

**Independent Test**: each token page shows the values for both themes and both contrast settings,
the measured contrast for each pair, and the sources; every pair passes.

- [ ] T025 [P] [US2] Add `apps/web/src/routes/design/color/+page.svelte` plus `meta.ts`. It shows the swatches for both themes side by side (using the `data-theme` override) and a table of every pair from `pairs.ts` with its live ratio and the minimum it needs. Ratios are shown as text and pass/fail as a word, not only a colour.
- [ ] T026 [P] [US2] Add `apps/web/src/routes/design/type/+page.svelte` plus `meta.ts`. It shows the type scale, a 66ch measure sample using realistic prose, and the line height. It cites the dyslexia-font studies and Atkinson Hyperlegible (research R2, R6).
- [ ] T027 [P] [US2] Add `apps/web/src/routes/design/space/+page.svelte` plus `meta.ts`, covering the spacing steps.
- [ ] T028 [P] [US2] Add `apps/web/src/routes/design/radius/+page.svelte` plus `meta.ts`.
- [ ] T029 [P] [US2] Add `apps/web/src/routes/design/motion/+page.svelte` plus `meta.ts`. It states that Ribbon uses no motion, and why (research R7). It has no demo animations.
- [ ] T030 [P] [US2] Add `apps/web/src/routes/design/focus/+page.svelte` plus `meta.ts`. It shows the focus ring on each type of control, with the measured contrast of the ring (SC 2.4.13).
- [ ] T031 [P] [US2] Add `apps/web/src/routes/design/size/+page.svelte` plus `meta.ts`, showing the 44 px target size (SC 2.5.5).

**Checkpoint**: all seven token pages are catalogued and the contrast test is green.

---

## Phase 5: User Story 3 - The person holds the dial (P2): DEFERRED (scope change 2026-11-14)

T032–T036 are kept as the design for a later spec. Do not implement them in 001.

**Goal**: one Settings page that changes the appearance everywhere, live and persistently.

**Independent Test**: change each setting, reload, and confirm it persisted and that the catalogue
reflects it. "Restore default appearance" resets everything after confirmation.

- [ ] T032 [US3] Build the reactive preference store in `apps/web/src/lib/prefs/prefs.svelte.ts` (Svelte 5 runes). It exposes `prefs` (resolved values), `setPref(key, value)` and `resetPrefs()`. It writes to `localStorage` inside try/catch, updates the `<html>` attributes live, and listens to the system media queries while a key is unset (contracts/preferences.md).
- [ ] T033 [US3] Build `apps/web/src/routes/settings/+page.svelte`:
  - Grouped sections: Appearance (theme, contrast, text size, text spacing, density, motion) and Reading (reader font, size, line spacing, margins, paragraph spacing).
  - Each control is a labelled radio group with literal option names.
  - Changes apply as soon as they're made, with no Save button and nothing moving.
  - A secondary "Restore default appearance" action confirms first ("Reset all appearance settings to the defaults?" with the buttons "Reset settings" and "Keep my settings").
- [ ] T034 [US3] Add a reading preview in Settings, a short realistic passage that reflects the reader settings. How book content is overridden is out of scope (spec 003).
- [ ] T035 [P] [US3] Add `apps/web/src/routes/design/settings/+page.svelte` plus `meta.ts`, which catalogues the Settings controls and the confirm dialog.
- [ ] T036 [P] [US3] Write an e2e test, `apps/web/tests/e2e/prefs.spec.ts`:
  - each setting persists across a reload (SC-007);
  - system dark mode or reduced motion is followed when the key is unset and overridden when it is set;
  - reset requires confirmation;
  - corrupted stored JSON leads to the defaults with no error dialog.

**Checkpoint**: the dial works end to end and the catalogue responds to it.

---

## Phase 6: User Story 4 - Components ready for later specs (P2)

**Goal**: every component that specs 002–004 need, each with a catalogue page covering all its
states.

**Independent Test**: every component listed in FR-013 has a page with every state named below,
and its 7 Checks are recorded.

- [ ] T037 [US4] Create the realistic sample data in `apps/web/src/lib/sample/books.ts`: 700 generated books with varied title, author and series lengths, about 5% with no cover, a few with no author, and one very long title. Generate cover placeholders from tokens (title text on a muted panel), not image files.
- [ ] T038 [P] [US4] Build `apps/web/src/lib/components/AppFrame.svelte` (header, primary navigation in a fixed order, a slot for sync status), with catalogue page `routes/design/app-frame/`.
- [ ] T039 [P] [US4] Build `apps/web/src/lib/components/BookCard.svelte`, with states default, focused, downloaded, not downloaded, missing cover and long title. The cover area has a fixed aspect ratio so nothing shifts while it loads. "Downloaded" is shown as icon plus text. Catalogue page: `routes/design/book-card/`.
- [ ] T040 [US4] Build `apps/web/src/lib/components/LibraryGrid.svelte`: a responsive grid of `BookCard`s with no layout shift and states default, empty and 700 books. Catalogue page: `routes/design/library-grid/`. (Depends on T039.)
- [ ] T041 [P] [US4] Build `apps/web/src/lib/components/SearchField.svelte` and `SearchResults.svelte`: results update without moving focus or changing context. States: empty query, results, no results (with plain words and a next step). Catalogue page: `routes/design/search/`.
- [ ] T042 [P] [US4] Build `apps/web/src/lib/components/BookDetail.svelte`: one primary action (Read), with Download as secondary; the description is collapsed until asked for (calm-ds III). States: full metadata, minimal metadata, downloaded. Catalogue page: `routes/design/book-detail/`.
- [ ] T043 [P] [US4] Build `apps/web/src/lib/components/ReaderChrome.svelte`: top and bottom bars, a progress readout as text ("42% · Chapter 7"), and the bars hidden until asked for. States: hidden, shown, loading. Catalogue page: `routes/design/reader-chrome/`.
- [ ] T044 [P] [US4] Build `apps/web/src/lib/components/TableOfContents.svelte`, with nested chapters and the current chapter marked by both text and shape. Catalogue page: `routes/design/toc/`.
- [ ] T045 *(deferred with US3)* [US4] Build `apps/web/src/lib/components/ReadingControls.svelte`, the in-reader quick access to the reader preferences, reusing the T032 store. Catalogue page: `routes/design/reading-controls/`.
- [ ] T046 [P] [US4] Build `apps/web/src/lib/components/SyncStatus.svelte`: peripheral, icon plus text, never animated. States: up to date, syncing, offline, needs attention (FR-017). Catalogue page: `routes/design/sync-status/`.
- [ ] T047 [P] [US4] Build `apps/web/src/lib/components/EmptyState.svelte`, which states what is empty and the one next step. Examples: empty library, nothing downloaded, no search results. Catalogue page: `routes/design/empty-state/`.
- [ ] T048 [P] [US4] Build `apps/web/src/lib/components/ErrorState.svelte`: what happened, whether anything was lost, and the one next step, with no blame and no idioms (FR-016). Examples: offline and the book isn't downloaded; sync failed but progress is saved on this device. Catalogue page: `routes/design/error-state/`.
- [ ] T049 [P] [US4] Build `apps/web/src/lib/components/ConfirmDialog.svelte` and `UndoNotice.svelte`. Buttons name the action. The undo notice is peripheral, has no countdown, and stays until it is dismissed or the next action happens (calm-ds V). Catalogue page: `routes/design/confirm-undo/`.
- [ ] T050 [US4] Fill in `meta.ts` for every component page from T038–T049: the rationale, the sources from research.md (or ASSUMPTION), and all 7 Checks, each with a one-line reason.

**Checkpoint**: the component set is complete; the catalogue-complete test (T023) is green.

---

## Phase 7: User Story 5 - Catalogue tool chosen on evidence (P3)

**Goal**: the decision record exists and can be reached.

- [ ] T051 [US5] Confirm `docs/decisions/DR-0001-design-catalogue.md` (accepted) is linked from the catalogue About page (T022) and from `specs/001-visual-design/plan.md`. No other work is needed: the DR was completed during planning.

---

## Phase 8: Polish and verification

- [ ] T052 Add an axe matrix e2e test in `apps/web/tests/e2e/a11y.spec.ts`. For every `/design/*` page, run `@axe-core/playwright` (tags wcag2a, wcag2aa, wcag21aa, wcag22aa) in both the light and dark system colour schemes (Playwright `colorScheme`), at 1280 px and 320 px widths. Expect zero violations (SC-003).
- [ ] T053 Add a reflow e2e test in `apps/web/tests/e2e/reflow.spec.ts`. At 320 px width and at 200% text size (root font size doubled), and with the WCAG 1.4.12 text-spacing overrides applied, no page scrolls horizontally (`scrollWidth <= clientWidth`) and no state overlaps another (SC-004, SC 1.4.10, 1.4.12). Also, on the library-grid catalogue page with 700 books and covers loading, the measured cumulative layout shift (PerformanceObserver `layout-shift`) is 0 (FR-015).
- [ ] T054 Run quickstart.md steps 1–6 and record the results (pass/fail, with output for any failure) in `specs/001-visual-design/quickstart.md` under a "Results" heading.
- [ ] T055 Owner review (SC-006): the owner spends 30 minutes in the catalogue with the defaults, in both light and dark. Record their findings in `specs/001-visual-design/review.md`; fix any of them before marking 001 done. The review includes:
  - **(a)** a timed check: from the index, find 5 named elements, each in under 10 seconds (SC-005);
  - **(b)** the owner spot-checks the calm-ds Check results of at least 3 components; any disagreement is a finding (SC-002).
- [ ] T056 Bring the docs up to date:
  - `docs/PLAN.md`: set the 001 status to done;
  - `docs/JOURNAL.md`: add an entry with what shipped, what's still ASSUMPTION, and the next step (spec 002), plus the efficacy baseline the constitution asks for: idea-to-ship time (spec created 2026-11-14 to done), the number of post-implementation reworks (findings from T055), and running cost (£0; nothing deployed);
  - `docs/DESIGN.md`: add a short "Visual design" section that points to the catalogue and the tokens.
- [ ] T057 Write `specs/001-visual-design/calm-ds-notes.md`, recording what this spec learned for calm-ds: which tokens could be promoted to calm-ds's first token set, and any Checks that were hard to apply. Do not edit the calm-ds repo; that's the owner's call.

---

## Dependencies and execution order

- **Setup (T001–T007)** → **Foundational (T008–T017)** → stories.
- **US1 (T018–T024)** comes first because every other story's pages live inside its catalogue.
- **US2 (T025–T031)** comes after US1. US3 (T032–T036) is deferred.
- **US4 (T037–T050)** needs US1. T040 needs T039. T045 is deferred.
- **US5 (T051)** needs T022.
- **Polish (T052–T057)** comes after all the stories. T055 (the owner review) is the final gate.

## Parallel examples

- **Setup**: T003, T004, T005 and T006 together, after T002.
- **Foundational**: T011 and T017 alongside their source tasks once T010 and T016 exist.
- **US2**: T025–T031 all at once, since each is a separate route folder.
- **US4**: T038, T039 and T041–T049 at once. T040 waits for T039, and T050 comes last.

## Implementation strategy

1. **MVP:** Setup → Foundational → US1 → US2. You can review the catalogue with the real tokens and
   change them while they're still cheap to change.
2. Owner check of the defaults (colours, type, spacing) before building components.
3. Then US4 (components), US5 (the DR link), and Polish. Spec 001 is done when the owner review
   (T055) passes.
