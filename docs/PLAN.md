# Plan

Work is done as Spec Kit features in `specs/NNN-name/` (spec, plan, tasks). This file is the index
and the spike log. Each phase's checklist below is the starting scope for its spec; once the spec
exists, its `tasks.md` is the source of truth and the list here is not updated.

## Specs
| # | Feature | Depends on | Status |
|---|---|---|---|
| 001 | [Visual design](../specs/001-visual-design/spec.md): calm, ND-friendly design system + per-element design pages | calm-ds constitution | MVP built (US1+US2); US4 superseded by 002 |
| 002 | [Redesigned screens and AI features](../specs/002-redesign-and-ai/spec.md) (DR-0002, DR-0003) | 001 | Built and design signed off 2026-11-23 on sample data. Not deployed. Story so far (T053) and AI search (T061–T063) are parked; plain search shipped instead (DR-0008) |
| 003 | Mirror (Phase 1 below) | 001 | not started |
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

## Spike: OPDS (parked 2026-11-24: future nice-to-have, to be specced another time)
Nothing below has been tested. Pick it up from the first unchecked item.

Question: could an OPDS feed served by the Worker replace USB for getting books onto the e-reader, and
does KOReader's own progress sync change the plan for spec 005?

Desk findings so far:
- OPDS is a one-way catalogue: the reader browses and downloads, nothing comes back. Clients named:
  KOReader, Thorium, Moon+ Reader, Librera. Servers named: the Calibre content server (`/opds`),
  Calibre-Web, Kavita, Komga, COPS. ([The Open Shelf, 2026-09-23][os]; the author promotes their own
  app, BookShelves, so treat the setup advice as one user's view.)
- Stock Kobo firmware has no OPDS client, so the Libra 2 would need KOReader installed alongside
  Nickel. That conflicts with DESIGN.md's "stock firmware" assumption, so it is the owner's call. ([os])
- KOReader's OPDS form takes a username and password and sends them as HTTP Basic auth
  ([Booklore docs][bl]; [Standard Ebooks][se]). It cannot send Cloudflare Access service-token headers
  (`CF-Access-Client-Id`/`-Secret`, [Cloudflare][cf]). So the feed needs a path outside Access with its
  own Basic auth. ASSUMPTION: an Access Bypass policy on a path-scoped app does this; check the docs.
- KOReader also has its own progress sync ("kosync"): `PUT /syncs/progress`,
  `GET /syncs/progress/{document}`, with the book identified by a partial MD5 of the file and the
  position stored as a percentage plus a KOReader position string ([koreader-sync-server][ks];
  [korrosync][kr]). A Worker could serve this API too. It would be layer 1b: sync over Wi-Fi with no
  USB and no Calibre running. KOReader positions are not EPUB CFIs, so moving between the web reader and
  the device would be accurate to the chapter or percentage.

[os]: https://medium.com/@theopenshelf/i-havent-plugged-my-e-reader-into-a-computer-in-months-opds-is-why-485f8fb405aa
[bl]: https://booklore-app.github.io/booklore-docs/docs/integration/opds
[se]: https://standardebooks.org/help/how-to-add-an-opds-feed-to-your-ereader
[cf]: https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/
[ks]: https://www.github.com/koreader/koreader-sync-server
[kr]: https://docs.rs/crate/korrosync/latest

To check:
- [ ] Owner: is running KOReader on the Libra 2 acceptable? If not, OPDS only helps phone and desktop apps.
- [ ] Throwaway OPDS 1.2 feed (Atom) from local Calibre mode; browse and download it in a desktop client.
- [ ] KOReader on the device: Basic auth, covers, search, and download of EPUB and KEPUB from the feed.
- [ ] Confirm an Access Bypass path plus Worker-side Basic auth (or another way past Access for the feed).
- [ ] kosync: confirm the routes and auth in the official server's `config/routes.lua`; how the partial
      MD5 is computed, so the Worker can match a device book to a Calibre book; the position string format.
- [ ] Outcome: a DR on whether OPDS and/or kosync enter specs 003 and 005.

## Starting scope per spec

### Phase 1: mirror → spec 003 (does not depend on the spike)
- [ ] Wrangler config, CI deploy (workspace + SvelteKit scaffold moved to spec 001)
- [ ] D1 schema + migrations
- [ ] Ingest API (`plan`, `commit`) with Zod contract
- [ ] `longshelf library` (upload KEPUB as well as EPUB when present)
- [ ] Library UI: wire the spec 002 screens to real data (download included)
- [ ] PWA manifest + service worker (app shell, covers)
- [ ] Cloudflare Access + service token

### Phase 2: read → spec 004
- [ ] foliate-js submodule + `Reader.svelte`
- [ ] Offline downloads (OPFS), storage settings page
- [ ] Web progress, outbox, catalog snapshot in Dexie
- [ ] Playwright smoke test: open app, go offline, open a book

### Phase 3: device progress via Calibre columns → spec 005
- [ ] Store device location verbatim in `native_location`; merge status and position by separate timestamps
- [ ] Column config; `longshelf progress` (read columns, push; pull, `calibredb set_custom`)
- [ ] "Jump to Kobo position" prompt
- [ ] `longshelf install-timer` (systemd, launchd)

### Later, optional
- [ ] Layer 2 Kobo adapter: highlights, exact positions
- [ ] Reading stats
- [ ] OPDS catalogue and KOReader progress sync (parked spike above)
