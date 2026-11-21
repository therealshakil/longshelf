---
description: "Tasks for 002 redesigned screens and AI features"
---

# Tasks: Redesigned screens and AI features

**Input**: `specs/002-redesign-and-ai/` (plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md)

**Tests**: included. The success criteria need automated checks:
- SC-003: axe across themes;
- SC-004: the recap eval;
- SC-005: reasons on every suggestion;
- SC-006: the app works with AI off.

**Rules for every task**:
- **Match the approved mock** for the screen: `design-mocks/<page>.html` plus `design-mocks/styles.css`. Also follow
  the direction contract in `apps/web/.impeccable/surfaces/`. Read
  `.claude/skills/impeccable/reference/craft-floor.md` before the first UI edit of a session. The
  dashed "Mock state" switches in the mocks are review chrome; do not build them.
- **Styling:** tokens only (the `token-only.test.ts` lint). Copy is in plain words. No new
  dependencies beyond plan.md without asking the owner.
- **Data:** screens read data only through `LibrarySource` (contracts/library-source.md).
  Read-status text comes only from the shared formatter (FR-005).
- **Catalogue:** every new component gets a catalogue page under `apps/web/src/routes/design/`
  (DR-0001), so the completeness test keeps passing.
- **Definition of done:** each phase checkpoint is committed with a `docs/JOURNAL.md` entry and
  pushed (owner: auto push), with tasks ticked here in the same commit.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [X] T001 Add foliate-js as a pinned git submodule at `vendor/foliate-js` (CLAUDE.md stack). Record the pinned commit in `docs/JOURNAL.md`.
- [X] T002 [P] Copy the sample covers from `design-mocks/se-covers/` to `apps/web/static/sample/covers/`. Create `apps/web/static/sample/books/README.md`. It asks the owner to download the Middlemarch, Moby Dick and Meditations EPUBs from standardebooks.org into that folder, cites CC0 (https://standardebooks.org/about), and says robots.txt blocks automated downloads (research R2).
- [X] T003 Add the shadcn-svelte `sheet` and `dialog` components with the shadcn-svelte CLI (`components.json` is already set up). This installs Bits UI, an agreed-stack dependency. Restyle the generated files in `apps/web/src/lib/components/ui/` to tokens only. Also add `pnpm design:compare` (`apps/web/scripts/design-compare.ts`) and `pnpm eval:recaps` (`apps/web/scripts/eval-recaps.ts`) script stubs to `apps/web/package.json`, filled in during later phases.

---

## Phase 2: Foundational (blocks every story)

- [X] T004 Update colour tokens in `packages/shared/src/tokens/color.ts`, measured from the approved mocks (research R8):
  - accent light `#7A2E3A` = oklch(0.413 0.106 13.4); dark `#E29AA3` = oklch(0.759 0.087 11.1);
  - neutrals to match `design-mocks/styles.css` `:root` and dark;
  - `ACCENT_HUE = 12`;
  - rationale updated to cite DR-0002.
- [X] T005 Add the `night` theme to `packages/shared/src/tokens` (values from `:root[data-theme=night]` in `design-mocks/styles.css`; accent `#C98A92` = oklch(0.698 0.078 10.9)). Extend `THEMES`, `pairs.ts` and `contrast.test.ts` so every pair passes in light, dark and night, with body text at 9–13:1.
- [X] T006 [P] Add a paper-grain token (the SVG noise from `design-mocks/styles.css`, light and dark alpha; none for night). Apply grain, `::selection`, caret and scrollbar colours in `apps/web/src/app.css`.
- [X] T007 Define Zod schemas and types for Book, ReadingPosition, ReadStatus, Author (with bio, portrait, bibliography), Shelf and PeriodicalIssue in `packages/shared/src/library/types.ts`, per data-model.md. Validation: "`percent` is 0–100" and "`furthestPercent` ≥ `percent` for the same source".
- [X] T008 Define the `LibrarySource` interface in `packages/shared/src/library/source.ts`, exactly as in contracts/library-source.md, including "`alsoReading` returns at most 5".
- [X] T009 [P] Write the read-status formatter `packages/shared/src/library/status.ts`: no label when unread, "N% read" in progress, "Finished" when finished. Unit test in `packages/shared/src/library/status.test.ts`.
- [X] T010 Build `SampleLibrary` in `packages/shared/src/sample/`:
  - books and covers from `design-mocks/se-books.json`;
  - collections, positions (including Kobo), dates and periodicals invented as in the mocks: current book Middlemarch at 38% (Kobo 41%); Also reading Anna Karenina 71% (Kobo 64%), Moby Dick 12% (away 12 days), Meditations 55% (Kobo 55%);
  - the seven invented periodicals.
  
  Unit tests in `packages/shared/src/sample/sample.test.ts`: no periodical in `recentlyAdded`; `alsoReading` at most 5; title sort ignores The/A/An.
- [X] T011 Wire the sample source into the app in `apps/web/src/lib/library/index.ts`. It is the one place that picks the implementation, swappable in spec 003.
- [X] T012 [P] Build `apps/web/src/lib/components/AppHeader.svelte`:
  - "Ribbon." wordmark with an oxblood full stop, and "Ribbon, home" as its accessible name;
  - a Home · Library switch with `aria-current`;
  - a "Search, or ask your library" field;
  - a `SyncStatus` slot in the header (FR-006).
  
  Catalogue page `apps/web/src/routes/design/app-header/`.
- [X] T013 [P] Build `apps/web/src/lib/components/SyncStatus.svelte` (up to date, syncing, offline, attention; icon plus text; never floats). Catalogue page `apps/web/src/routes/design/sync-status/`.
- [X] T014 [P] Build `apps/web/src/lib/components/BookTile.svelte`:
  - cover with a fixed 2:3 ratio, so nothing shifts while it loads;
  - title clamped to 2 lines, and author ("Unknown author" if none);
  - a status label from T009, plus an optional reason line;
  - a plain binding with the title when there is no cover.
  
  Catalogue page `apps/web/src/routes/design/book-tile/`.
- [X] T015 [P] Build `EmptyState.svelte` and `ErrorState.svelte` in `apps/web/src/lib/components/`. They state what happened, whether anything was lost, and the one next step. Catalogue pages under `apps/web/src/routes/design/`.
- [X] T016 Add the root layout `apps/web/src/routes/+layout.svelte`, with AppHeader on every page except `/read/*`.

**Checkpoint:** tokens pass in three themes; the sample source and formatter are tested.

---

## Phase 3: User Story 1 - Pick up where I left off (P1) 🎯 MVP

**Goal**: Home shows the current book, the Also reading ledger, Read next (placeholder until US5), "Browse the library" and Latest news & magazines, matching `design-mocks/index.html`.

**Independent Test**: on sample data, resume the current book and one ledger book; each opens `/read/[id]`.

- [X] T017 [P] [US1] Build `apps/web/src/lib/components/CurrentBook.svelte` ("Spread"):
  - a 15rem cover;
  - a large Literata title and author;
  - a rule, then a labelled table: Progress (% + chapter + bar), Elsewhere ("Kobo is at 41%"), Last read;
  - "Continue reading" aligned to the cover's bottom;
  - a 7rem cover beside the text on phones.
  
  Catalogue page.
- [X] T018 [P] [US1] Build `apps/web/src/lib/components/LedgerRow.svelte` ("Compact band"):
  - the title link is stretched over the whole row (one link per book, FR-008);
  - % and chapter on the right, a full-width bar, and a grey Kobo bar when present;
  - the "Away N days · Story so far" pill sits above the stretched link;
  - a round resume cue (decorative, `aria-hidden`);
  - hover tint and whole-row focus ring;
  - on phones, the % moves under the author and the cue is hidden.
  
  Catalogue page.
- [X] T019 [P] [US1] Build `apps/web/src/lib/components/PeriodicalRow.svelte` (plain issue bindings, newest first, "New" mark, horizontal scroll). Catalogue page.
- [X] T020 [US1] Build the Home route `apps/web/src/routes/+page.svelte`, in the FR-002 order:
  - current book (skipped with no gap when nothing is in progress);
  - Also reading (at most 5);
  - a Read next slot that hides itself until US5;
  - "Browse the library →";
  - Latest news & magazines.
  
  All data comes through `LibrarySource`.
- [X] T021 [US1] Add a stub `apps/web/src/routes/read/[id]/+page.svelte` that opens at the stored position, so Continue reading works before US2 completes.
- [X] T022 [P] [US1] Write the e2e test `apps/web/tests/e2e/home.spec.ts`:
  - acceptance scenarios 1–4 from spec US1;
  - axe at 390 and 1440 in light and dark;
  - at 390, all books in progress are visible without horizontal scroll.

**Checkpoint:** the owner reviews Home against the mock (`pnpm design:compare` for `/`).

---

## Phase 4: User Story 2 - Read comfortably (P1) 🎯 MVP

**Goal**: the reader matches `design-mocks/reader.html` on real EPUB text.

**Independent Test**: open a sample book, hide and show the bars, change every setting, use Night and Contents, act on the Kobo notice.

**Prerequisite**: the owner has saved the three EPUBs (T002).

- [X] T023 [US2] Build `apps/web/src/lib/reader/Reader.svelte`, wrapping `vendor/foliate-js`:
  - open a Blob from `LibrarySource.bookFile`;
  - scroll or paginate;
  - emit position (href, fraction, percent, chapter label) and chapter-finished events (used by US4);
  - expose the TOC.
- [X] T024 [US2] Build the reader typography stylesheet injected into foliate's content (built as `apps/web/src/lib/reader/reader-styles.ts`, because foliate's frames don't inherit page tokens):
  - Literata 1.25rem (1.125rem on phones), line height 1.7, about 65ch;
  - ragged right, `hyphens: manual` (FR-009), old-style figures;
  - first-line indent 1.4em with no paragraph gaps, and no indent after headings and epigraphs;
  - chapter-opening styles: small-caps label, large numeral, muted italic epigraph with verse indents.
- [X] T025 [P] [US2] Build the reader settings store `apps/web/src/lib/reader/settings.ts`: one versioned `localStorage` key holding size, font (Literata or Atkinson Hyperlegible), spacing, margins, scroll or pages, and theme (system, paper or night). It applies to every book; reads are wrapped in try/catch. Unit test it.
- [X] T026 [P] [US2] Build `apps/web/src/lib/components/ReaderChrome.svelte`:
  - top bar: back, title and chapter, Contents, Aa, Bookmark;
  - bottom bar: a full-width bar with a Kobo tick, %, "N min left in chapter", and Story so far;
  - a tap in the middle third toggles both bars (edges reserved); slide only without reduced motion.
  
  Catalogue page.
- [X] T027 [P] [US2] Build `apps/web/src/lib/components/KoboNotice.svelte`: a compact pill in the top bar ("Kobo is further on · Chapter 41, 41%", Go there, Stay); on phones it takes its own row; nothing floats over the text. Catalogue page.
- [X] T028 [P] [US2] Build `apps/web/src/lib/components/TextPanel.svelte` on the Bits UI Sheet (`ui/sheet`, right side; focus trap, Escape and focus return come from Bits UI): size slider, font, line spacing, margins, page mode and theme, as segmented controls. Catalogue page.
- [X] T029 [P] [US2] Build `apps/web/src/lib/components/ContentsPanel.svelte` on the Bits UI Sheet (left side): grouped by book or part, current chapter marked by text and background. Catalogue page.
- [X] T030 [US2] Build the reader route `apps/web/src/routes/read/[id]/+page.svelte`, replacing the T021 stub:
  - compose Reader, ReaderChrome, KoboNotice, TextPanel and ContentsPanel;
  - Bookmark toggles a local bookmark;
  - "Go there" jumps to the Kobo position;
  - save this device's position locally on every change (data-model.md "Device-local state").
- [X] T031 [P] [US2] Write the e2e test `apps/web/tests/e2e/reader.spec.ts`:
  - acceptance scenarios 1–4 from spec US2;
  - settings persist across reload;
  - Night applies;
  - axe in light, dark and night at 390 and 1440.

**Checkpoint (MVP):** the owner can resume and read. Run the finish-style review of `/` and
`/read/[id]` against the mocks; owner sign-off; commit and push.

---

## Phase 5: User Story 3 - Find a book in the library (P2)

**Goal**: Library, author, shelf and book pages matching `design-mocks/library.html`, `author.html`, `shelf.html` and `book.html`.

**Independent Test**: reach one book by each route and open its book page.

- [X] T032 [P] [US3] Build `apps/web/src/lib/components/LibraryTabs.svelte`. The tabs are, in order: Recently added (default), Authors, Genres, Collections, News & magazines, All Books (FR-003). Tab state lives in `?tab=`; keyboard follows the ARIA tabs pattern. Catalogue page.
- [X] T033 [P] [US3] Build `apps/web/src/lib/components/LetterRail.svelte`, a vertical scrubbable A–Z rail:
  - pointer drag maps y to a letter and jumps there;
  - a large oxblood letter bubble while scrubbing;
  - letters with no books are disabled;
  - links work by keyboard and single tap.
  
  Unit-test the y-to-letter mapping in `LetterRail.test.ts`. Catalogue page.
- [X] T034 [P] [US3] Build `AuthorList.svelte` (three-column list of names with "N books", letter headings), `CollectionStack.svelte` (fanned three covers, name, count) and `GenreList.svelte` ("All suggested" or "N in Calibre · M suggested"). All in `apps/web/src/lib/components/`, each with a catalogue page.
- [X] T035 [US3] Build the Library route `apps/web/src/routes/library/+page.svelte`:
  - Recently added grouped "This week" / "Earlier in November", never with periodicals;
  - Authors, Genres and Collections;
  - quiet footnotes at the bottom ("From Calibre's Collection column. Ribbon never changes them." and the genre note);
  - News & magazines (one PeriodicalRow per publication);
  - All Books with the LetterRail.
- [X] T036 [P] [US3] Build the author page `apps/web/src/routes/library/authors/[id]/+page.svelte`:
  - breadcrumb, portrait with credit, life dates;
  - bio with its source link;
  - "N books in your library · M finished" ("M finished" omitted when 0);
  - In your library grid;
  - bibliography with owned books linked and status shown, not-owned books grey with "Not in your library".
  
  Omit any missing data.
- [X] T036a [US3] Author data (DR-0005): Wikipedia bio and free-licensed photo, life dates, and Wikidata notable works for the sample authors. The full bibliography is on hold until a source passes review.
- [X] T037 [P] [US3] Build the shelf page `apps/web/src/routes/library/shelf/[kind]/[id]/+page.svelte`: breadcrumb, name, count, Title / Author / Recently added sort, grid, and the Calibre or AI footnote by kind.
- [X] T038 [US3] Build the book page `apps/web/src/routes/book/[id]/+page.svelte` and `BookHeader.svelte`:
  - cover, title, author link, subtitle, publication line;
  - the CurrentBook progress table;
  - actions: Continue reading, Downloaded/Download toggle (state only until 004), Story so far, and a more menu (Mark as finished);
  - About this book, Details;
  - Genres and More like this slots that hide until US6 and US5;
  - on phones, the cover stacks and Downloaded, Story so far and the menu share one row.
- [X] T039 [P] [US3] Write the e2e test `apps/web/tests/e2e/library.spec.ts`:
  - acceptance scenarios 1–5 from spec US3;
  - the read-status label is identical for one book across Home, every tab, author, shelf and book page;
  - axe at 390 and 1440 in light and dark.

**Checkpoint:** owner review of the library pages against the mocks.

---

## Phase 6: User Story 8 - News and magazines (P3, no AI; done with the library)

- [X] T040 [US8] Add periodical issue opening: an issue opens straight into the reader. In sample data, map one issue to a sample EPUB or mark it unavailable with ErrorState. Assert in `apps/web/tests/e2e/library.spec.ts` that 14 issues fetched on one day never appear in Recently added.

---

## Phase 7: AI groundwork (blocks US4–US7)

- [X] T041 Add the Workers AI binding `AI` and the D1 binding `DB` to `apps/web/wrangler.jsonc` (research R3; deploy and CI stay in 003). Regenerate `worker-configuration.d.ts`. Add `pnpm dev:remote` to `apps/web/package.json`. Wrangler was already logged in. The database stays local (placeholder id) until spec 003 creates the real one at deploy.
- [X] T042 Write D1 migration `apps/web/migrations/0001_ai.sql` with exactly the tables in data-model.md:
  - `genre_suggestion` (states suggested → promoted → in_calibre; suggested → removed; promoted → removed);
  - `chapter_summary`, `recap`, `book_embedding`, `suggestion_dismissal`;
  - `ai_usage(day, neurons_est, calls)`.
- [X] T043 [P] Add Zod schemas for every `/api/ai/*` request and response in `packages/shared/src/ai/schemas.ts`, per contracts/ai-api.md, including `503 { reason: 'ai_paused' | 'ai_off' | 'offline' }`.
- [X] T044 Build `apps/web/src/lib/server/ai/models.ts` (defaults changed 2026-11-20, research R4 update): model IDs as configuration, defaulting to `@cf/qwen/qwen3-30b-a3b-fp8` (text), `@cf/openai/gpt-oss-120b` (recap step-up) and `@cf/google/embeddinggemma-2` (embeddings), with a neuron estimate per call from the pricing table in research R4/R5.
- [X] T045 Build the spend guard `apps/web/src/lib/server/ai/guard.ts`: before each call, check `ai_usage` for the UTC day; refuse with `ai_paused` at the ceiling (default 8,000 neurons, configurable); refuse with `ai_off` when disabled. Unit test the ceiling and the day rollover.
- [X] T046 [P] Build the operator page `apps/web/src/routes/settings/ai/+page.svelte` plus `GET /api/ai/usage` and `PUT /api/ai/enabled`. It shows today's estimate vs ceiling, calls, the on/off switch, a "Suggest genres" job button, and a plain note that content stays in the owner's Cloudflare account (constitution III, XI).
- [X] T047 [P] Add the AI-off e2e test `apps/web/tests/e2e/ai-off.spec.ts`: with AI disabled, every route opens and every non-AI task in US1–3 and US8 completes, while AI areas hide or say they are off (SC-006).

---

## Phase 8: User Story 4 - Recall the story so far (P2)

**Goal**: spoiler-safe recaps built from per-chapter summaries (research R5).

**Independent Test**: read two chapters of Moby Dick and check the recap covers exactly those.

- [X] T048 [US4] Implement `POST /api/ai/chapter-summary` in `apps/web/src/routes/api/ai/chapter-summary/+server.ts`: a 120–200-word summary of that chapter only, stored in `chapter_summary`. The text is not stored. Idempotent per (bookId, href); passes through the guard.
- [X] T049 [US4] Make the reader send finished-chapter text: on Reader's chapter-finished event, call the endpoint (queued locally if offline, sent later) in `apps/web/src/lib/reader/summaries.ts`.
- [X] T050 [US4] Implement `GET /api/ai/recap/[bookId]` in `apps/web/src/routes/api/ai/recap/[bookId]/+server.ts`:
  - assemble 3–5 paragraphs only from summaries up to the furthest position;
  - states: `too_early` below 5%, `writing`, `unavailable`;
  - cache in `recap`, rebuilt when the furthest point moves past `upto_href`.
  
  Unit test that no summary beyond the cut-off is used.
- [X] T051 [US4] Build `apps/web/src/lib/components/StorySoFar.svelte` on the Bits UI Sheet: right side on desktop, bottom on phones. It shows the cut-off line, the recap in Literata, the AI note, Continue reading and Not now, plus the Writing, Unavailable and Too early states, per `design-mocks/index.html#recap`. Open it from LedgerRow, the book page and the reader. Catalogue page with all four states. (Built 2026-11-20: Home and reader only. The approved book mock has no Story so far entry, so the book page waits for owner review.)
- [X] T052 [US4] Show "Away N days · Story so far" on a LedgerRow when the book was last read 7 or more days ago (spec Assumptions).
- [X] T052a [US4] On-demand summaries (DR-0004): whole chapters newest first up to 40,000 words before the place, coverage line, "Include earlier chapters" with its estimated cost, and a 3,000-neuron daily cap.
- [ ] T053 [US4] **Parked by the owner, 2026-11-21 (10 of 20 recaps built; see DR-0004).** Implement `pnpm eval:recaps` in `apps/web/scripts/eval-recaps.ts`. It builds 20 recaps at set cut-offs across the three sample books and writes each next to the following chapter for owner judgement (SC-004, pass = 0 of 20 mention later events). Also check that recaps from the recent window don't confuse characters (DR-0004). If it fails, rerun with the gpt-oss-120b step-up and report to the owner (FR-018: no other provider).

---

## Phase 9: User Story 5 - Suggestions from my own library (P3)

- [ ] T054 [US5] Build book text profiles and embeddings in `apps/web/src/lib/server/ai/embeddings.ts` (title, author, description, genres → `book_embedding`, rebuilt when `profile_hash` changes), run by the operator job.
- [ ] T055 [US5] Implement the suggestion engine in `apps/web/src/lib/server/ai/suggest.ts`:
  - rules in this order: next in series, Reading List, same author as a finished book, same collection as a book in progress;
  - then cosine similarity;
  - exclude in-progress, finished and dismissed books;
  - reasons come from templates only.
  
  Unit tests: every item has a reason; none outside the library; none in progress or finished (SC-005).
- [ ] T056 [US5] Implement `GET /api/ai/read-next` (at most 12), `GET /api/ai/more-like/[bookId]` (at most 5), and `POST`/`DELETE /api/ai/dismiss`. `not_now` lapses after 30 days; `never` lasts until undone.
- [ ] T057 [US5] Build `apps/web/src/lib/components/ReadNextShelf.svelte` (two rows of six smaller covers, reason line, a ⋯ menu with Not now / Never suggest) and fill the Home and book-page slots. Catalogue page.

---

## Phase 10: User Story 6 - Browse and keep genres (P3)

- [ ] T058 [US6] Implement the genre job `POST /api/ai/jobs/genres` and its prompt in `apps/web/src/lib/server/ai/genres.ts`. It suggests 1–3 genres per book from title, author, description and tags; skips removed tombstones; runs inside the guard.
- [ ] T059 [US6] Implement `GET`/`POST /api/ai/genres/[bookId]` (promote or remove) with the data-model state rules. Promotion shows "Waiting for sync"; nothing touches Calibre (applied by the CLI in 003, research R7).
- [ ] T060 [US6] Build `apps/web/src/lib/components/GenreChips.svelte`: solid chips for Calibre genres; dashed chips for suggestions with Promote and a drawn ✕ icon (no glyphs); and the footnote. Fill the book page slot and the Genres tab. Catalogue page.

---

## Phase 11: User Story 7 - Ask the library in plain words (P3)

- [ ] T061 [US7] Design review first. Add a results mock `design-mocks/search.html` in the approved world (exact matches first, a reason per result, a one-line note when AI is off) and get the owner's approval in live review before building (spec Assumptions).
- [ ] T062 [US7] Implement `GET /api/ai/search?q=`: exact title or author match first, then embedding similarity over profiles. Reasons name the matched fields. `mode: 'exact'` plus the note when AI is unavailable (FR-013).
- [ ] T063 [US7] Build the search results route `apps/web/src/routes/search/+page.svelte` from the approved mock, fed by the header search field. E2E test in `apps/web/tests/e2e/search.spec.ts`.

---

## Phase 12: Polish and finish

- [ ] T064 [P] Implement `pnpm design:compare` (`apps/web/scripts/design-compare.ts`). It captures every route and its mock at 390, 820 and 1440 in light and dark (plus Night for the reader) into `test-results/design-compare/`.
- [ ] T065 Extend the axe matrix in `apps/web/tests/e2e/a11y.spec.ts` to every route in light, dark and night at 390 and 1440, with zero violations (SC-003).
- [ ] T066 Run the Impeccable finish review (`impeccable-finish-reviewer` agent) against the direction contracts and mocks, fix the material findings, and get the owner's sign-off (SC-002).
- [ ] T067 Run the `impeccable-documenter` agent to write `apps/web/DESIGN.md` from the shipped build. `docs/DESIGN.md` remains the architecture doc.
- [ ] T068 [P] Mark spec 001 T037–T050 as superseded by 002 in `specs/001-visual-design/tasks.md` (research R10). Update `docs/PLAN.md` status for 002.
- [ ] T069 Retire live-review chrome: remove the Mock state switches from `design-mocks/` or mark the folder as the approved reference. Write the journal entry with efficacy numbers (reworks, AI running cost so far).

---

## Dependencies and order

- Setup (T003 installs Bits UI) → Foundational → **US1 → US2 (MVP)** → US3 → US8.
- AI groundwork (Phase 7) needs Foundational only, so it can run beside US1–US3. It needs the owner's `wrangler login`.
- US4 needs US2 (chapter events) and Phase 7. US5 and US6 need Phase 7 and US3's slots. US7 needs Phase 7 and its design review (T061).
- Polish runs last.

## Parallel examples

- Foundational: T009, T012, T013, T014 and T015 (different files) after T007 and T008.
- US1: T017, T018 and T019 together, then T020.
- US2: T025–T029 together after T023 and T024, then T030.
- US3: T032, T033, T034, T036 and T037 together, then T035 and T038.

## Implementation strategy

1. Build the MVP: Home and the reader on sample data. Stop for owner review against the mocks.
2. Add the Library (US3, US8). Owner review.
3. AI groundwork, then Story so far, which carries the most value and risk, checked by the eval.
4. Suggestions and genres, then plain-language search after its design review.
5. Finish review, documentation, and the efficacy journal.
