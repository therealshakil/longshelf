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

## 2026-11-20: Spec 002 US4 server side: chapter summaries and recaps

- New endpoints:
  - `POST /api/ai/chapter-summary` (idempotent per book and chapter; the text is not stored);
  - `GET /api/ai/chapter-summary/[bookId]` (which chapters already have summaries);
  - `GET /api/ai/recap/[bookId]` (built only from summaries before the current chapter, cached per cut-off).
- First real Workers AI calls:
  - the planned model (`qwen3-30b-a3b`) was deprecated by Cloudflare today, so the defaults moved to `gemma-4-26b-a4b-it` and `bge-m3` (research R4 update);
  - Gemma's default reasoning used up the output budget; it is now switched off per call;
  - an empty chapter got a "Please provide the text" reply, so short sections are skipped and non-summary replies are never stored.
- Result: Moby Dick chapters 1–2 summarised accurately, and the recap stopped at the end of chapter 2. About 86 neurons in total.
- Tests: 109 web unit tests (cut-off and summary sanity).
- **Next:** the reader sends finished chapters (T049); then the Story so far sheet (T051), "Away N days" (T052) and the recap eval (T053).

## 2026-11-20: Spec 002 T049: the reader sends finished chapters

- A chapter is a contents entry, not a file section. Gutenberg EPUBs put many chapters in one file (Moby Dick chapters 8–12+ are all in section 2), so section-level summaries would be far too coarse.
- **How "finished" works:**
  - a chapter counts as finished when the reader moves from contents entry N to N+1; jumps don't count;
  - its text runs from its anchor to the next entry's anchor (foliate `book.resolveHref`);
  - the order number is the entry's position in the flattened contents, which is the recap cut-off.
- **Sending:**
  - chapters under 400 characters aren't sent;
  - offline or paused requests wait in a 12-entry local queue and are sent on the next chapter or reader visit;
  - with AI off they are dropped.
- **Verified in a browser:** paging through Moby Dick chapters 10–12 sent exactly those three chapters, and the stored summaries are accurate.
- **Accessibility gap fixed:** the reader had no keyboard page turning. Arrow keys and Page Up/Down now turn pages, including when focus is inside the book. There's an e2e test for it.
- **Flaky e2e start:** one run had all 13 tests fail because the preview server didn't start, while the dev server on :5199 was also using the local D1 state. The same tests passed on rerun. ASSUMPTION: a state lock; watch for a repeat.

## 2026-11-20: Spec 002 T051–T052: Story so far sheet

- `StorySoFar.svelte` on the Bits UI Sheet: from the right on wide screens and from the bottom on phones.
  - States: ready, writing, unavailable, too early, plus "No recap yet", per `design-mocks/index.html#recap`.
  - The footer stays pinned while the recap scrolls.
  - A catalogue page shows all four states; axe passes in every state in light and dark, at 390 and 1440.
- **Where it opens:**
  - Home: the "Away N days · Story so far" pill on ledger rows (7+ days away);
  - the reader: the footer link, with the cut-off at the current chapter.
  - Not on the book page: the approved book mock has no entry, so it is left for owner review.
- **AI off (FR-016):** the layout loads an AI-on flag, and the entry points hide when AI is off. The e2e ai-off spec checks Home and the reader.
- Recap endpoint:
  - without a chapter number it uses every stored summary; these exist only for chapters you finished, so they are already behind you;
  - "No recap yet" explains that recaps come from chapters finished in Ribbon;
  - the AI note now uses the approved mock copy.
- **Bug fixed:** sheet titles rendered in Inter, not Literata. `cn()` (tailwind-merge) treats `font-reading` and `font-title` as clashing and drops one. TextPanel and ContentsPanel had the same bug; all three now use a `.title-reading` class.
- Tests: 119 web unit tests; e2e ai-off, catalogue, a11y-smoke and home suites pass (14).
- **Open question for the owner:** for a book read mostly on Kobo, Ribbon has summaries only for chapters finished in Ribbon. The recap then covers only those chapters, while the cut-off line still names your place. Options: say how much the recap covers, or summarise the earlier chapters on demand when the recap opens (costs more neurons, still within the free tier).

## 2026-11-21: On-demand recap summaries (DR-0004)

- **Owner decisions:** summarise chapters not read in Ribbon on demand, then keep the cost down.
- **Tested:** five long chapters with full text, head only, head and tail, and spaced slices. Slicing cost 18–29% of full text but lost main plot beats, so chapters are always sent whole.
- **Built:**
  - a recap summarises the newest 40,000 words before your place, in whole chapters;
  - the sheet says what it covers and offers "Include earlier chapters" with its estimated cost;
  - on-demand summaries stop at 3,000 neurons per UTC day, reserved atomically on the server;
  - closing the sheet stops the work, and finished summaries are kept.
- **Cache fix:** the recap key now includes the summary count, so filling an earlier gap rebuilds it.
- **Sample data:** the Moby Dick position now uses a real contents link.
- **Checked:** typecheck, lint, unit tests, and targeted e2e runs for recap backfill (AI stubbed) and the catalogue.
- **Not checked:** a real Workers AI recap through the new flow, or "Include earlier chapters" clicked in a browser. The sample Moby Dick place is inside the 40,000-word window, so it doesn't show the coverage line.

## 2026-11-21: Author bios, photos and notable works (DR-0005)

- **Built:** author pages now show a Wikipedia bio, free-licensed photo with credit and licence, life dates, and Wikidata notable works marked against the library.
- **Coverage (67 sample authors):** 67 bios, 64 photos, 57 with notable works. Boethius, Laozi and Henry Seton Merriman have no photo.
- **Held back:** the full bibliography. About a third of 50 reviewed Open Library entries were wrong, and Wikidata's alternative is untested because its query service was rate-limiting.
- **Data fixes:** implausible Wikidata years are hidden, and Seneca is matched to Seneca the Younger.
- **Checked:** typecheck, targeted unit tests, all 67 author pages loading in a browser with their photos, and no sideways scroll at phone width on the page checked.
- **Long lists:** notable works show 12 entries, always including owned books, with a "Show all" control.
- **Not checked:** the full e2e suite. Real Calibre authors have no lookup yet; this is sample data until the mirror exists (spec 003).

## 2026-11-21: Recap quality check parked (T053)

- **Owner decision:** park recap work; it isn't worth more effort at this point.
- **Built:** `pnpm eval:recaps`, using the shipped window and prompts, with a resumable cache and a 6,000-neuron daily cap.
- **Result:** 10 of 20 recaps built before the cap. SC-004 is not met or judged. Two quality problems are recorded in DR-0004.
- **Hidden:** Story so far no longer appears on Home or in the reader, and the reader no longer sends finished chapters for AI summaries. The code stays behind `RECAPS_ENABLED`.

## 2026-11-21: Spec 002 T054: book profiles and embeddings

- **Built:** a text profile per book (title, author, genres, description), `bge-m3` embeddings in D1, and `POST /api/ai/jobs/embeddings`.
- **Behaviour:** only new or changed books are embedded, books that left the library are removed, and each run does at most 144 books inside the spend guard. Run it again while `remaining` is above 0.
- **Checked:** 10 unit tests, typecheck, lint, and a real Workers AI run with local D1: 96 sample books embedded for about 1 unit, then 0 on the second run.
- **Not checked:** suggestion quality. Only 1 of the 96 sample books has a description and all share one genre, so the vectors mostly reflect titles and authors. Check this on richer data in T055.
- **No UI yet:** the job has no button on the AI settings page.

## 2026-11-21: Spec 002 T055: suggestion engine

- **Built:** Read next and More like this in `suggest.ts`: series, Reading List, author, collection, then similarity, with reasons from templates only. Not yet reachable from an endpoint or the UI (T056, T057).
- **Real-library check:** with the owner's approval, Calibre metadata was read read-only and embedded through Workers AI in the owner's account, about 200 units. Book text was not sent. The data and results stayed in a local scratchpad and are not in this repo.
- **Fixes from that check:** a higher similarity cut-off, room for every rule, new authors from similarity, author spelling variants, and repeat records.
- **Limits:** the real library has no reading history yet, so Read next was only tried with simulated history. Some matches are still weak, and about a fifth of books get no More like this, which is better than claiming a weak match.
- **Checked:** 17 unit tests, typecheck and lint.

## 2026-11-22: Spec 002 T056: suggestion endpoints

- **Built:** `GET /api/ai/read-next`, `GET /api/ai/more-like/[bookId]`, and `POST`/`DELETE /api/ai/dismiss`. "Not now" lapses after 30 days, and "Never" lasts until undone. With AI off, the two suggestion reads return `ai_off`.
- **Risk found:** on 631 real books, Read next used about 70 ms of CPU including vector decoding. The Workers Free limit is 10 ms. Fixed in the next entry.
- **Checked:** 31 targeted unit tests, typecheck, ESLint, Prettier on the changed code, and all endpoints against the local dev server with sample data, including dismiss and undo.
- **Not checked:** the full e2e suite, or a deployed Worker. There is no UI yet (T057).

## 2026-11-22: Precomputed suggestion matches

- **Owner decision:** store each book's closest matches instead of paying for Workers or adding Vectorize (research R6).
- **Built:** `pnpm ai:neighbours`, which runs on the operator's machine, calls no AI model and writes only changed rows to the new `book_neighbours` table. Read next and More like this now load only the rows they need.
- **Measured in Node on 631 real books:** ranking fell from about 50 ms to about 2 ms for Read next, and from about 12 ms to under 1 ms for More like this. Results matched an unlimited comparison for all 631 books. Real data stayed in the scratchpad.
- **Checked:** 33 targeted unit tests, typecheck, ESLint, Prettier on the changed code, and both endpoints on the local dev server with sample data.
- **Not checked:** total CPU on a deployed Worker, or the full e2e suite. The script only targets local D1 until a production database exists.
- **Fix:** the script now reads the app's library source, so spec 003's switch reaches it, and it stops without changes if no stored embedding belongs to the current library.

## 2026-11-23: Spec 002 T057: Read next shelf

- **Built:** Read next on Home and More like this on book pages, from the approved design, with a catalogue page. Each book shows its reason and a menu for "Not now" or "Never suggest". The undo line stays until the owner leaves or acts again.
- **Hidden when empty:** with AI off, no suggestions, or no close matches, the section doesn't appear. In the sample data, Middlemarch has no close match, so its page shows none.
- **Test port:** Playwright now picks a free port and never reuses a running server, because a stale preview on port 4173 could have been tested instead of the current code.
- **Checked:** 5 shelf browser tests run twice on a production build, Home and AI-off browser tests on the dev server, typecheck, ESLint, Prettier on changed code, the Impeccable detector, and screenshots at desktop, phone and dark.
- **Not checked:** the full e2e suite, or a deployed Worker.
- **Test fix:** the AI-off browser tests switch AI off for the shared local database, which made two Read next tests fail when run alongside them. They now run alone, after the other browser tests. The shelf, Home and AI-off tests then passed, 15 of 15, on a production build.

## 2026-11-23: Spec 002 T058: genre suggestion job

- **Built:** `POST /api/ai/jobs/genres`. It suggests 1 to 3 genres per book from a fixed list of 41, inside the spend guard, up to 60 books per run. Run it again while `remaining` is above 0.
- **Rules:** removed genres never come back, Calibre tags aren't repeated, promoted genres are kept, and checked books aren't paid for twice. Nothing is written to Calibre.
- **Real model check:** 20 public-domain sample books with Gemma cost about 12.5 estimated neurons. Results went to an in-memory database. Most labels looked right, but *Mrs. Dalloway* was wrongly labelled Drama.
- **Not checked:** quality on the owner's real library, or the full e2e suite. Genres aren't visible until T059 and T060.

## 2026-11-23: Spec 002 T059: genre choices API

- **Built:** `GET` and `POST /api/ai/genres/[bookId]`, to list a book's genres and promote or remove one.
- **Rules:** suggested can be promoted or removed, promoted can be removed, and removed genres stay as tombstones. A genre already in Calibre can't be changed from Ribbon. Promotion only queues the change, and nothing touches Calibre until the CLI in spec 003.
- **Checked:** 14 genre unit tests, typecheck, ESLint, and promote, repeat, remove and a refused move through the real endpoints on local D1, with the test row removed afterwards.
- **Not checked:** the full e2e suite. There is no UI yet (T060).

## 2026-11-23: Spec 002 T060: genre chips and Genres tab

- **Built:** genre chips on the book page, the Genres tab, genre shelves, and a catalogue page, from the approved mocks. Calibre genres are solid. Suggestions are outlined with Promote and Remove, and promoted genres say "Waiting for sync".
- **Added to the approved design:** Undo after removing a genre, because the mock's one-click remove was otherwise permanent. A promoted genre returns as promoted.
- **Limit:** the sample data has no saved genres until the genre job runs, so the screens were checked with stubbed data. Nothing is written to Calibre until spec 003.
- **Checked:** genre unit tests, browser tests for genres, library, Read next and AI off on a production build, typecheck, ESLint, the Impeccable detector, and screenshots at desktop, phone and dark.
- **Not checked:** the full e2e suite.

## 2026-11-23: Ask your library parked

- **Owner decision:** park AI search (T061 to T063), because each question would have to be compared with every book and that is likely over the Workers Free CPU limit. FR-013 is not met while parked.
- **Changed:** the header now says "Search your library", so it doesn't promise a feature that is parked. The search page is still a placeholder.
- **Compared free fuzzy search:** PostgreSQL, SQLite FTS5 in D1, and MiniSearch in the browser, using the owner's metadata locally. Nothing was sent to a service, and no dependency was added to the project. Results are in research R6.

## 2026-11-23: MiniSearch feasibility check

- **Result:** MiniSearch suits Ribbon's library size, including on the owner's iPad. Details and limits are in research R6.
- **Not done:** no dependency was added and search is still parked until the owner approves it.
- **Not tested:** other Apple devices, Firefox results, or iPad service worker and persistent storage, which need HTTPS.

## 2026-11-23: Product name is Longshelf

- **Owner decision:** the product will be called Longshelf. Reasons and alternatives are in DR-0006.
- **Domains:** the owner registered `longshelf.app` for the hosted version and `longshelf.org` for the open-source project. Both sites will be specified separately.
- **Not done:** internal names (packages, database, CLI, repo) still say Ribbon.
- **Not checked:** official trademark registers. This must happen before a public launch.

## 2026-11-23: Longshelf logo and visible name

- **Built:** the Bookend logo (DR-0007), favicon, app and maskable icons, web manifest, theme colours, and the logo in the header. Visible text and page titles now say Longshelf.
- **Header:** tighter spacing on phones, and the logo alone on the narrowest screens, so the longer name fits.
- **Checked:** typecheck, formatting, ESLint, the catalogue test, all icon URLs on a production build, nested-route icon paths, and the header at 320 to 430px wide, light and dark.
- **Known failures:** the token-only test fails on `ReadNextShelf.svelte` and the author page, from styles this change did not touch. The home page also scrolls sideways at 320px because of its content below the header.
- **Not checked:** the full e2e suite, or installing the app on a real device.

