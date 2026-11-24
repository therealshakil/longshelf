# Quickstart: validate the library mirror

Proves spec 003 end to end. Steps 1 to 3 are the owner's one-off setup and become
`docs/DEPLOY.md` (FR-022). Tests in steps 4 onwards use a licence-free test library, except
where step 8 says to use the real library.

## Prerequisites

- Node 24, pnpm via corepack, `pnpm install` done.
- A Cloudflare account, and `pnpm --filter web exec wrangler login`.
- Test library: `packages/sync-cli/test/fixtures/library/`, a small Calibre library of
  Standard Ebooks titles, with at least one PDF and one book without a cover.

## 1. Check costs (FR-025)

Read the pages in [research.md](research.md) R9 and confirm the free allowances still hold.
Expected recurring cost: $0. Stop if any step below would start a charge.

## 2. Create the resources

```sh
pnpm --filter web exec wrangler d1 create longshelf     # put the id in wrangler.jsonc
pnpm --filter web exec wrangler r2 bucket create longshelf
pnpm run deploy                                            # build, migrate --remote, deploy
```
Expected: the custom domain in `wrangler.jsonc` `routes` (the owner's is `https://library.longshelf.app`) serves the app. workers.dev is off.

## 3. Lock it down (US3)

In the dashboard, open the Worker, then Settings, then Domains & Routes. Enable Cloudflare Access
for the custom domain, with All traffic:
- Allow policy: your email. Session duration 30 days.
- Service Auth policy: a new service token named `longshelf-cli`.

Then:
```sh
longshelf config set url https://library.longshelf.app
longshelf config set client-id <id>
longshelf config set client-secret <secret>
```

## 4. Nothing leaks (SC-004)

```sh
pnpm --filter web test:access https://library.longshelf.app
```
This requests `/`, `/library`, `/api/catalog`, a cover, a file and `/api/ingest/plan` with no
credentials. Expected: none returns library data (an Access login page or 403). It repeats with
the service token: only `/api/ingest/*` succeeds.

## 5. Upload and re-run (US1)

```sh
longshelf library --library packages/sync-cli/test/fixtures/library
longshelf library --library packages/sync-cli/test/fixtures/library
```
Expected: the first run reports every book uploaded. The second prints "Nothing changed" and
transfers no files. Then edit one title in the fixture copy (`calibredb set_metadata`) and run
again: it reports 1 updated.

## 6. Browse, read, save, install (US2, US4)

On a phone, signed in:
- Library shows the test books with covers.
- A book opens in the reader.
- "Save a copy" saves the PDF.
- Install to the home screen, browse, turn on airplane mode and reopen: the app opens, and covers
  already seen show.

## 7. Safety checks

- **FR-006:** point the CLI at an empty library. It lists every book and asks. Answer no, and
  nothing changes (exit 4).
- **FR-007:** interrupt the first upload with Ctrl-C, run it again, and it finishes. Meanwhile the
  app never shows a book without its file.
- **FR-024:** deploy a build that fails to start. The previous version still serves.
- **SC-008:** `sha256sum` every file in the fixture library before and after all of this. No
  differences.

## 8. Real library (SC-001 to SC-003)

Run `longshelf library` on the real library and time it. Expected: under 1 hour at 20 Mbit/s.
Re-run: under 30 seconds. Library on a phone over 4G: the first covers show in under 3 seconds.
Record the times in `docs/JOURNAL.md`.
