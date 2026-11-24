---
description: "Tasks for spec 003, the library mirror"
---

# Tasks: Library mirror

**Input**: `specs/003-library-mirror/` (plan.md, spec.md, research.md, data-model.md,
contracts/, quickstart.md). Decisions: DR-0010.

**Tests**: included, because plan.md lists them (Vitest, pool-workers, Playwright, the live
access probe).

**Rules for every task**:
- Calibre is never written.
- No new npm dependencies without asking the owner.
- Use `#lib/...` imports.
- Any test fixture is licence-free (Standard Ebooks).
- A task is done when its code, any doc it changes, and its `docs/JOURNAL.md` line land together.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: US1 to US5 from spec.md

---

## Phase 1: Setup and spike

**Purpose**: prove the three risky assumptions on a real deployment before building on them
(plan "Delivery order" step 1).

- [X] T001 Rename the Worker to `longshelf` in `apps/web/wrangler.jsonc`. Add an `r2_buckets` binding `BUCKET` (bucket `longshelf`) and an `images` binding `IMAGES`. Keep the D1 placeholder id for local runs and document where the real id goes. Run `pnpm --filter web gen` so `worker-configuration.d.ts` includes the bindings.
- [X] T002 Add a root `deploy` script to `package.json` and an `apps/web` `deploy` script to `apps/web/package.json`: build, then `wrangler d1 migrations apply longshelf --remote`, then `wrangler deploy`. Invoke it as `pnpm run deploy`, because `pnpm deploy` is a pnpm built-in (research R7). Update the "Commands" section of `CLAUDE.md`, replacing "Deploy and migrate: added in spec 002".
- [ ] T003 **Spike, done by the owner and the agent together.** Before anything is created on the owner's Cloudflare account, show the owner the exact commands and the expected $0 cost (FR-025), and get a yes. Then create the D1 database and R2 bucket, deploy a temporary route `apps/web/src/routes/api/spike/+server.ts`, and enable Access on workers.dev (quickstart step 3). Record in the spike log in `docs/PLAN.md`:
  - (a) whether `platform.ctx.access` (or the `Cf-Access-Jwt-Assertion` header) identifies the owner's email and the service token;
  - (b) whether `env.IMAGES` resizes a cover on workers.dev;
  - (c) the CPU time (`wrangler tail`) of parsing a 1.3 MB catalogue and of `readNext` over 670 books, using a synthetic catalogue of 670 Standard Ebooks-shaped records.

  Delete the spike route afterwards. If (c) is over 10 ms, stop and ask the owner: move the work out of the request, or pay for Workers Paid at $5 a month (research R9).

**Checkpoint**: the spike log answers (a), (b) and (c). The R4 and R5 fallbacks are chosen if needed.

---

## Phase 2: Foundational (blocks every story)

- [ ] T004 [P] Add optional `sort: z.string().optional()` and `rating: z.number().min(0).max(5).optional()` to `BookSchema` in `packages/shared/src/library/types.ts`. Title ordering in `packages/shared/src/library/status.ts` (`titleSortKey`) uses `sort` when present. Add a test in `status.test.ts`.
- [ ] T005 [P] Create `packages/shared/src/library/catalog.ts`: the `MirrorCatalog` type (`LibrarySnapshot` & `{ version: 1; files: Record<string, { format: string; sha256: string; size: number }[]> }`), its Zod schema, and `canonicalJson(value)` (sorted keys, no whitespace), used for `metadataHash`. Export it from `packages/shared/src/library/index.ts`. Add unit tests for canonical ordering.
- [ ] T006 [P] Create `packages/shared/src/ingest.ts` with the Zod schemas from `contracts/ingest-api.md`: plan request and response, commit request and response, multipart responses, and errors. sha256 is `/^[0-9a-f]{64}$/`. Add the `./ingest` export to `packages/shared/package.json`.
- [ ] T007 Create the `packages/sync-cli` package: `package.json` (`name: @longshelf/sync-cli`, `type: module`, `bin: { longshelf: ./src/main.ts }`, Node 24 engines, depends on `@longshelf/shared`), `tsconfig.json`, and a vitest config. Add it to `pnpm-workspace.yaml` if it isn't already matched.
- [ ] T008 Move `readCalibreSnapshot`, `htmlToText`, `calibreLibraryPath` and `CalibreFiles` from `apps/web/scripts/local-calibre.ts` to `packages/sync-cli/src/calibre.ts`. Extend them to:
  - read `books.sort` and `ratings` into `sort` and `rating`;
  - collect every format's path in `files.byFormat` (`Map<uuid, {format, path}[]>`), not only EPUB.

  `apps/web/scripts/local-calibre.ts` imports from `@longshelf/sync-cli/calibre`. `pnpm dev:calibre` must behave exactly as before (check it starts and shows the library). Move the existing `htmlToText` tests, if any, and add tests for the format paths using a fixture.
- [ ] T009 Build the fixture library `packages/sync-cli/test/fixtures/library/`. Use Calibre (`calibredb add`) on 6 Standard Ebooks titles from `apps/web/static/sample/`, including one with a PDF added as a second format, one without a cover, and one tagged `News` titled `The Evening Courier [Sat, 14 Nov 2026]`. Commit `metadata.db` and the files. Total under 10 MB. Add a `README.md` with the sources and CC0 note.
- [ ] T010 Create `apps/web/migrations/0004_mirror.sql` exactly as in `data-model.md` (tables `book`, `book_file`, `blob`, `catalog` (with `previous_sha256`) and `ingest_run`; `blob.kind` CHECK in `('file','cover','thumb','catalog')`; `catalog.id` and `ingest_run.id` CHECK `= 1`; index `book_file_sha`). Additive only.
- [ ] T011 Create `apps/web/src/lib/server/mirror/access.ts`:
  - `identity(event)` returns `{ kind: 'owner', email } | { kind: 'cli' } | null`, using the mechanism the T003 spike confirmed (`platform.ctx.access`, or `Cf-Access-Jwt-Assertion` verified with WebCrypto against `https://<team>.cloudflareaccess.com/cdn-cgi/access/certs`, cached).
  - The owner email and team come from Worker vars `OWNER_EMAIL` and `ACCESS_TEAM`.
  - Under `vite dev` and in tests, a dev identity applies only when `dev` is true and the host is local.

  Add unit tests: missing header gives null, a wrong audience gives null, and a service token gives `cli`.
- [ ] T012 Update `apps/web/src/hooks.server.ts` to:
  - refuse with 403 (plain text, no library data) any request with no identity, outside local dev;
  - allow `/api/ingest/*` only for `cli`, and everything else only for `owner`;
  - add `X-Robots-Tag: noindex, nofollow` to every response;
  - keep the existing rule that turns AI off in local Calibre mode.

  Replace `apps/web/static/robots.txt` with `User-agent: *` / `Disallow: /`. Add tests in `apps/web/tests/unit/hooks.test.ts` (FR-015, FR-018).

**Checkpoint**: shared types, the CLI package with the moved reader, the migration and the access guard are done. `pnpm test`, `pnpm typecheck` and `pnpm lint` pass, and `pnpm dev:calibre` still works.

---

## Phase 3: User Story 1, put my library online (P1) 🎯 MVP

**Goal**: `longshelf library` mirrors the library and reports in plain words. A run with no changes transfers nothing.

**Independent test**: quickstart step 5 on the fixture library, against `wrangler dev` locally, then against the deployment.

### Tests for US1

- [ ] T013 [P] [US1] Ingest handler tests in `apps/web/tests/unit/ingest.test.ts` (`@cloudflare/vitest-pool-workers`, miniflare D1 and R2, migrations applied). Cover:
  - plan with an empty mirror lists every blob;
  - a second identical plan lists nothing;
  - the lock gives 409 to a second plan, and an expired lock is taken over;
  - a blob PUT with a wrong hash gives 400;
  - a repeated PUT gives 200;
  - commit with a missing blob gives 409 and writes nothing;
  - commit removing more than 10% without `confirmRemovals` is rejected;
  - after commit, unreferenced blobs are deleted while the previous catalogue is kept;
  - multipart create, parts and complete gives a `blob` row, and a size mismatch is rejected.
- [ ] T014 [P] [US1] CLI tests in `packages/sync-cli/test/`:
  - `hash-cache.test.ts`: unchanged path, size and mtime aren't rehashed; a changed mtime is;
  - `plan.test.ts`: building the plan request from a snapshot, and `metadataHash` is stable;
  - `upload.test.ts`: multipart splitting into 50 MB parts with a short last part, files at or under 95 MB go as a single PUT, and largest-first ordering with two in flight;
  - `report.test.ts`: the three output shapes and exit codes from `contracts/cli.md`.

### Implementation for US1

- [ ] T015 [US1] `apps/web/src/lib/server/mirror/blobs.ts`:
  - `hasBlob` and `recordBlob`;
  - a single put to R2 key `<prefix>/<sha256>` with `{ sha256 }`, where the prefix is `f`, `c` or `k` by kind (data-model "R2 keys");
  - multipart create, part, complete and abort through the R2 binding;
  - `makeThumb(sha)`: `env.IMAGES` resizes to 400 px wide WebP, stored at `t/<sha256>` with a `thumb` blob row. Failure is logged, not thrown (research R4).
- [ ] T016 [US1] `apps/web/src/lib/server/mirror/ingest.ts`: `plan()`, `commit()` and `abort()` as in `contracts/ingest-api.md`.
  - **Commit:** one `db.batch`, validated with the T006 schemas.
  - **Garbage collection after commit:** delete R2 objects and `blob` rows not referenced by `book.cover_sha256`, `book_file.sha256`, or the current or previous catalogue, along with thumbnails whose cover is gone. Commit moves the old `catalog.sha256` into `previous_sha256`.
- [ ] T017 [US1] Routes under `apps/web/src/routes/api/ingest/`: `plan/+server.ts`, `blobs/[sha]/+server.ts` (PUT), `blobs/[sha]/multipart/+server.ts` (POST), `blobs/[sha]/multipart/[uploadId]/[part]/+server.ts` (PUT), `blobs/[sha]/multipart/[uploadId]/complete/+server.ts` (POST), `blobs/[sha]/multipart/[uploadId]/+server.ts` (DELETE), `commit/+server.ts` and `abort/+server.ts`. Stream bodies (`request.body`) straight to R2 and never buffer a file in memory. Return 413 for a single PUT over 95 MB.
- [ ] T018 [P] [US1] `packages/sync-cli/src/config.ts`: the config file path per OS (`$XDG_CONFIG_HOME/longshelf/config.json`; macOS `~/Library/Application Support/longshelf/config.json`), written with mode 0600. Priority is `--library` > env `LONGSHELF_*` > file > Calibre default. Also `longshelf config set|show`, with secrets masked to the last 4 characters.
- [ ] T019 [P] [US1] `packages/sync-cli/src/hash-cache.ts`: streaming SHA-256 (`node:crypto`), and a cache file `hash-cache.json` beside the config, keyed by absolute path, size and mtimeMs.
- [ ] T020 [US1] `packages/sync-cli/src/upload.ts`: a client using `fetch` with `CF-Access-Client-Id` and `CF-Access-Client-Secret` headers. It runs plan, then blobs (largest first, 2 concurrent; single PUT at 95 MB or under, else multipart in 50 MB parts read with `fs.createReadStream({ start, end })`), then the catalogue blob, then commit. It calls abort on SIGINT and on fatal errors. A 401, 403 or Access login redirect maps to exit 2.
- [ ] T021 [US1] `packages/sync-cli/src/main.ts`: the `library [--dry-run] [--yes] [--library]` and `config` commands from `contracts/cli.md`.
  - It builds the `MirrorCatalog` from the T008 snapshot, with cover URLs `/api/covers/<sha>` and the files map.
  - The removal prompt follows FR-006, and `--yes` is only allowed for 10 or fewer books.
  - It reports through `report.ts`. A book whose file is missing on disk is reported by title and skipped; the run carries on.
- [ ] T022 [P] [US1] `packages/sync-cli/src/report.ts`: the plain output and exit codes 0 to 4 exactly as in `contracts/cli.md`.
- [ ] T023 [US1] Run quickstart step 5 locally (`pnpm --filter web preview` with local D1 and R2) on the fixture library: the first run uploads everything, the second prints "Nothing changed", and an edited title is reported as 1 updated. Record the result in `docs/JOURNAL.md`.

**Checkpoint**: US1 works locally. Mirror data exists, but the screens don't use it yet.

---

## Phase 4: User Story 2, browse and read my real library anywhere (P1)

**Goal**: the spec 002 screens run on the mirror catalogue, the reader opens mirrored files, and any format can be saved.

**Independent test**: after T023, open the local preview: Library shows the fixture books with covers, one opens in the reader, and the PDF saves with a readable file name.

### Tests for US2

- [ ] T024 [P] [US2] Read-route tests in `apps/web/tests/unit/mirror-read.test.ts` (pool-workers):
  - `/api/catalog` returns 200 with an ETag, then 304 for `If-None-Match`;
  - covers serve the thumbnail, `?size=full` serves the original, and a missing thumbnail falls back to the original;
  - files support `Range: bytes=0-99` (206);
  - `?download=` sets `Content-Disposition` with an RFC 5987 filename;
  - a bad hash gives 400, an unknown hash gives 404;
  - no identity gives 403.

### Implementation for US2

- [ ] T025 [US2] Routes `apps/web/src/routes/api/catalog/+server.ts`, `api/covers/[sha]/+server.ts` and `api/files/[sha]/+server.ts`, as in `contracts/mirror-api.md`. They stream from R2 (`range` option for files), with caching headers as in the contract table, and accept a hash only with a `blob` row of the matching kind.
- [ ] T026 [US2] Make library loading async in `apps/web/src/lib/library/index.ts`:
  - `getLibrary(fetch)` returns the sample, local or mirror source. Mirror is chosen when the build flag `PUBLIC_LIBRARY=mirror` is set, which the production build sets.
  - The mirror source is memoised by the catalogue ETag, and `fileUrl` picks EPUB, then KEPUB.
  - `syncStatus()` follows `contracts/mirror-api.md`.

  Set `export const ssr = false` in `apps/web/src/routes/+layout.ts` (research R3), and return `library` from its load. Update every importer of `library` (`+page.ts` files, components such as `+page.svelte` on Home that call `library.bookFileUrl`) to use layout data or `getLibrary`. The sample build and `pnpm dev:calibre` must still work, and the existing e2e tests must pass.
- [ ] T027 [US2] Move Read next and More like this to the browser (owner ruling after the T003 spike; Read next took 20–59 ms of CPU against the 10 ms Free plan limit).
  - New routes `GET /api/ai/neighbours?ids=<id,…>` (the stored `book_neighbours` rows for those ids, plus every row with `copies`) and `GET /api/ai/dismissals` (active dismissals).
  - `apps/web/src/lib/ai/suggestions.ts` runs `readNext` and `moreLike` (from `#lib/server/ai/suggest.ts`, moved to a shared browser-safe module `#lib/ai/suggest.ts`) on the browser's `LibrarySource`.
  - `api/ai/read-next` and `api/ai/more-like/[bookId]` are removed. The `/api/ai/usage` guard still gates the features.
  - Per-book AI routes (`genres/[bookId]`, `dismiss`) and jobs (`jobs/genres`, `jobs/embeddings`) read book metadata from D1 `book` rows through `serverLibrary(db)` in `apps/web/src/lib/server/mirror/server-library.ts`, which implements only `book` and `allBooks`. Jobs already run in batches.
  - Update the spec 002 tests for the moved functions, and keep sample and local modes working.
- [ ] T028 [US2] **Design approval first:** show the owner a sketch (screenshot of `design-mocks/book.html` with the More menu open) of a "Save a copy" group listing each format with its size, e.g. "EPUB · 1.2 MB". Build it after the owner approves, in `apps/web/src/lib/components/BookHeader.svelte`, linking to `/api/files/<sha>?download=<Title - Author>.<ext>`. Sanitise the filename: strip `/\:*?"<>|` and cap it at 120 characters. A book with no readable format shows "Can't be read here" in place of the Read action, with no broken button (US2 scenario 4). The Download toggle is unchanged (spec 004).
- [ ] T029 [US2] Seed the e2e preview from the fixture library. A `globalSetup` in `apps/web/playwright.config.ts` runs `longshelf library --library packages/sync-cli/test/fixtures/library --yes` against the preview, with a local dev identity. Add `apps/web/tests/e2e/mirror.spec.ts`: Library shows the 6 fixture books, the book page shows "Save a copy", the reader opens an EPUB, and the news row shows the Evening Courier cover. Existing axe checks run on mirror mode too.
- [ ] T030 [US2] FR-026: in `apps/web/src/routes/settings/+page.svelte`, under the AI switch, add one plain sentence: "While AI is on, book details and some book text are sent to Cloudflare's AI service in your account." Keep the default on. Text only, no layout change. Add an e2e assertion.

**Checkpoint**: US1 and US2 work end to end locally on the fixture library.

---

## Phase 5: User Story 3, only I can get in (P1)

**Goal**: nothing is readable without the owner's sign-in or the CLI token (SC-004).

**Independent test**: quickstart step 4 against the deployment.

- [ ] T031 [P] [US3] `apps/web/scripts/test-access.ts` and the `apps/web` script `test:access <url>`:
  - without credentials, request `/`, `/library`, `/api/catalog`, `/api/covers/<sha>`, `/api/files/<sha>` and `/api/ingest/plan`, and assert that no response body contains a fixture title or any JSON book fields;
  - with the service token (from the CLI config), only `/api/ingest/*` succeeds and the browser routes give 403.

  It reads hashes from the CLI's last report and never prints secrets.
- [ ] T032 [US3] CLI credential handling: a revoked or wrong token gives exit 2, with "The mirror refused the upload key. Set a new one: longshelf config set client-id … / client-secret …". The mirror is unchanged (US3 scenario 3). Add a test in `packages/sync-cli/test/upload.test.ts` with a mocked 403 and with an Access login redirect.
- [ ] T033 [US3] Write the Access section of `docs/DEPLOY.md` from quickstart step 3: enable Access for the custom domain with All traffic, an Allow policy for the owner's email with a 30-day session, a Service Auth policy with token `longshelf-cli`, and the `OWNER_EMAIL` and `ACCESS_TEAM` Worker vars. Include rotating the token without a redeploy (FR-017).

**Checkpoint**: on the deployment, the access probe passes.

---

## Phase 6: User Story 4, install it like an app (P2)

**Goal**: the app installs and opens offline, and covers already seen still show (SC-007).

**Independent test**: quickstart step 6 on a phone.

- [ ] T034 [US4] `apps/web/src/service-worker.ts` (SvelteKit native, research R6):
  - precache `build` and `files` (the app shell);
  - cache-first for `/api/covers/*`;
  - network-first for `/api/catalog` with a cache fallback;
  - network-first for navigations, falling back to the cached shell;
  - never cache `/api/ingest/*`, `/api/ai/*` or `/api/files/*` (offline files are spec 004);
  - treat an Access redirect (an opaque redirect, or a response from `*.cloudflareaccess.com`) as offline and serve the cache;
  - activate a new version on the next open (FR-021), with no `skipWaiting` while a reader page is open.
- [ ] T035 [US4] In `apps/web/src/app.html`, put `crossorigin="use-credentials"` on the manifest link (research R5). Check `apps/web/static/manifest.webmanifest` (name, icons, `display: standalone`) and leave it unchanged unless something is wrong. Surface the "Sign in again" sync state in `SyncStatus` (existing component; label only) when the catalogue fetch was redirected by Access.
- [ ] T036 [US4] Add a Playwright test in `apps/web/tests/e2e/offline.spec.ts`: load Library, set the context offline, reload, then assert that the shell renders and a cover image has loaded (`naturalWidth > 0`).

**Checkpoint**: the app installs on a phone and opens offline with covers (owner check).

---

## Phase 7: User Story 5, deploy and update it myself (P2)

**Goal**: one person can set up and deploy from the repo, and a failed deploy keeps the old version.

**Independent test**: follow `docs/DEPLOY.md` from scratch, then deploy a migration twice.

- [ ] T037 [US5] Write `docs/DEPLOY.md` from quickstart steps 1 to 3: a costs check with the research R9 table and links (FR-025), resource creation, the real D1 id, `pnpm run deploy`, Access (from T033), and CLI config. Each step names the exact command or dashboard screen. Link it from `README.md` and `CLAUDE.md`.
- [ ] T038 [US5] Check FR-023 and FR-024 on the deployment: run `pnpm run deploy` twice (the second applies no migrations), then deploy a build that throws at start-up in a throwaway commit (not merged), and confirm the previous version still serves. Record the results in `docs/JOURNAL.md`.

---

## Phase 8: Polish and real library

- [ ] T039 Real-library run (owner present; it uploads private data to the owner's own account). Run `longshelf library --dry-run`, then `longshelf library`, timed: SC-001 under 1 hour, a re-run under 30 s (SC-002). On a phone over 4G, the first covers in under 3 s (SC-003). Record the times in `docs/JOURNAL.md`. If SC-003 fails, open the research R2 option of leaving descriptions out of the catalogue.
- [ ] T040 [P] SC-008: in `packages/sync-cli/test/calibre-untouched.test.ts`, hash every file in a copy of the fixture library, run the snapshot read and a `--dry-run` against a stub server, then hash again: no differences.
- [ ] T041 [P] Docs:
  - `docs/DESIGN.md`: update the "longshelf CLI", "Cloud" and "Data model" sections to match DR-0010, and remove the "see DR-0010" banner;
  - `docs/PLAN.md`: tick Phase 1 items and mark spec 003 status;
  - `README.md`: add a short "Mirror your library" section;
  - `CLAUDE.md`: add `longshelf` and `test:access` to the commands.
- [ ] T042 Run `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm test:e2e`, and the quickstart steps not yet done. Write the spec 003 closing entry in `docs/JOURNAL.md`, with an efficacy block like spec 002's: time, reworks, and actual Cloudflare usage from the dashboard.

---

## Dependencies and execution order

- **Phase 1** (T001 to T003) comes first. T003 needs the owner and gates any fixed cost.
- **Phase 2** blocks all stories. T004, T005 and T006 can run in parallel. T007, then T008 and T009. T010 is independent. T011, then T012.
- **US1** (T013 to T023) needs Phase 2.
- **US2** needs US1's ingest to seed data (T023). T024 and T025 can start once T010 is done.
- **US3**: T031 needs deployed US1 and US2. T032 needs T020. T033 can be written at any time.
- **US4** needs T026 (browser rendering and catalogue loading).
- **US5**: T037 can be drafted early. T038 needs a deployment.
- **Polish** comes after the stories. T039 needs US1 to US3 on the deployment.

```
T001─T002─T003 ─► T004‖T005‖T006 ─► T007─T008─T009 ─► US1 ─► US2 ─► US3 ─► Polish
                                     T010, T011─T012 ┘        └► US4
                                                                  US5 (T037 early, T038 on deploy)
```

## Parallel examples

- **Phase 2:** T004, T005 and T006 together (different files in `packages/shared`).
- **US1:** T013 and T014 (tests), then T018, T019 and T022 together, then T020 and T021.
- **US2:** T024 alongside T025. T030 at any time after T026.
- **US3:** T031 and T033 together.

## Implementation strategy

1. **MVP = Phase 1, Phase 2, US1, US2 and US3.** The library is online, browsable and private.
   Deploy the real library only after US3's access probe passes. Never deploy US1 or US2
   without US3.
2. Then US4 (installable app), then US5 (procedure check), then the real-library run (T039).
3. Stop and ask the owner at T003 (account changes and cost), T028 (design), T039 (private
   upload), and at any fixed cost.

## Notes

- Out of scope: reading progress, offline book files and the Download toggle (spec 004); the
  device timer and writing genres to Calibre (spec 005).
- Commit after each task or logical group, and push the branch after each commit.
