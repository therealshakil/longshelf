# Plan

Work is done as Spec Kit features in `specs/NNN-name/` (spec, plan, tasks). This file is the index
and the spike log. Each phase's checklist below is the starting scope for its spec; once the spec
exists, its `tasks.md` is the source of truth and the list here is not updated.

## Specs
| # | Feature | Depends on | Status |
|---|---|---|---|
| 001 | [Visual design](../specs/001-visual-design/spec.md): calm, ND-friendly design system + per-element design pages | calm-ds constitution | MVP built (US1+US2); US4 superseded by 002 |
| 002 | [Redesigned screens and AI features](../specs/002-redesign-and-ai/spec.md) (DR-0002, DR-0003) | 001 | Built and design signed off 2026-11-23 on sample data. Not deployed. Story so far (T053) and AI search (T061–T063) are parked; plain search shipped instead (DR-0008) |
| 003 | [Library mirror](../specs/003-library-mirror/spec.md) (Phase 1 below) | 002 | Specified and planned 2026-11-24 (DR-0010 accepted) |
| 004 | Read (Phase 2) | 003 | not started |
| 005 | Device progress (Phase 3) | 004, spike | not started |

## Spike (manual, on the desktop with the Kobo; record findings here)
- [ ] Install Kobo Utilities, configure columns, confirm store and restore round-trip a position.
- [ ] Can restore run automatically on connect, or is it a menu click?
- [ ] Hand-edit the location column to a chapter start, restore, confirm the Kobo opens there.
- [ ] How does `calibredb set_custom` behave with the Calibre GUI open?
- [ ] Add KEPUB as a library format for one book, send it, and check whether the file on the device is
      byte-identical to the library copy (if so, exact web -> Kobo positions are possible).
- [ ] Note the exact column names and the format of the location value for a KEPUB and a plain EPUB.

## Spike log: spec 003 T003 (deployed Worker, 2026-11-24)

Measured on `longshelf.<account>.workers.dev` with `wrangler tail` CPU times. The catalogue was a
licence-free synthetic one: 670 records, 1.2 MB.

- **(b) Images binding on workers.dev:** works. One 400 px WebP thumbnail came out at 138 KB, so
  set a quality option in T015.
- **(c) CPU:**
  - Parsing the catalogue took 8 ms warm and 19 ms cold.
  - Read next over 640 books took 20–24 ms warm and 59 ms cold, over the Free plan's 10 ms
    (research R9). Cloudflare didn't stop those requests, but that isn't something to rely on.
  - **Owner ruling:** Read next and More like this run in the browser on the catalogue it
    already holds. The server returns only stored matches and dismissals. Cost stays $0. This
    changes T027.
- **(a) Access identity:** `platform.ctx.access` isn't exposed through SvelteKit's adapter, so
  the Worker uses the `Cf-Access-Jwt-Assertion` header (research R5 fallback).
  - The owner's browser token carries `email`.
  - The service token's token carries `common_name`, equal to the Client ID, and no email.
  - Both have `type: app` and the app's `aud`.
  - Access needed a **Service Auth** policy that includes the token. Without it, the token was
    redirected to sign-in like an anonymous request.
  - The library is served at `library.longshelf.app` only, with workers.dev off.

## Starting scope per spec

### Phase 1: mirror → spec 003 (does not depend on the spike)
- [ ] Wrangler config, `pnpm run deploy` from the laptop (CI deferred, DR-0010; scaffold moved to spec 001)
- [ ] D1 schema + migrations
- [ ] Ingest API (`plan`, `commit`) with Zod contract
- [ ] `longshelf library` (upload every format; KEPUB when present, per spec 003 FR-004)
- [ ] Library UI: wire the spec 002 screens to real data (download included)
- [ ] PWA manifest + service worker (app shell, covers)
- [ ] Cloudflare Access + service token

### Phase 2: read → spec 004
- [ ] foliate-js submodule + `Reader.svelte`
- [ ] Offline downloads (OPFS), storage settings page
- [ ] Web progress, outbox, catalog snapshot in Dexie
- [ ] Playwright smoke test: open app, go offline, open a book
- [ ] Public showcase library (owner, 2026-11-24): a second, public deployment on its own
      subdomain that anyone can browse and read. It holds public-domain books the owner picks to
      represent them, and it grows out of the spec 003 test library. Needs:
      - a separate Worker, D1 and R2, so the private library's data and key never touch it;
      - a public, read-only mode: no Access, the fail-closed gate off for reading, ingest still
        locked to a service token;
      - AI off, or capped hard, because anyone can call it;
      - no personal reading progress shown;
      - a recorded cost check, because public traffic counts against the free allowances.

### Phase 3: device progress via Calibre columns → spec 005
- [ ] Store device location verbatim in `native_location`; merge status and position by separate timestamps
- [ ] Column config; `longshelf progress` (read columns, push; pull, `calibredb set_custom`)
- [ ] "Jump to Kobo position" prompt
- [ ] `longshelf install-timer` (systemd, launchd)

### Later, optional
- [ ] Layer 2 Kobo adapter: highlights, exact positions
- [ ] Reading stats
