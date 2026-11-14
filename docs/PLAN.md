# Plan

## Spike (manual, on the desktop with the Kobo; record findings here)
- [ ] Install Kobo Utilities, configure columns, confirm store and restore round-trip a position.
- [ ] Can restore run automatically on connect, or is it a menu click?
- [ ] Hand-edit the location column to a chapter start, restore, confirm the Kobo opens there.
- [ ] How does `calibredb set_custom` behave with the Calibre GUI open?
- [ ] Add KEPUB as a library format for one book, send it, and check whether the file on the device is
      byte-identical to the library copy (if so, exact web -> Kobo positions are possible).
- [ ] Note the exact column names and the format of the location value for a KEPUB and a plain EPUB.

## Phase 1: mirror (does not depend on the spike)
- [ ] Scaffold pnpm workspace, SvelteKit app, wrangler config, CI deploy
- [ ] D1 schema + migrations
- [ ] Ingest API (`plan`, `commit`) with Zod contract
- [ ] `ribbon library` (upload KEPUB as well as EPUB when present)
- [ ] Library UI: grid, search, book detail, download
- [ ] PWA manifest + service worker (app shell, covers)
- [ ] Cloudflare Access + service token

## Phase 2: read
- [ ] foliate-js submodule + `Reader.svelte`
- [ ] Offline downloads (OPFS), storage settings page
- [ ] Web progress, outbox, catalog snapshot in Dexie
- [ ] Playwright smoke test: open app, go offline, open a book

## Phase 3: device progress via Calibre columns
- [ ] Store device location verbatim in `native_location`; merge status and position by separate timestamps
- [ ] Column config; `ribbon progress` (read columns, push; pull, `calibredb set_custom`)
- [ ] "Jump to Kobo position" prompt
- [ ] `ribbon install-timer` (systemd, launchd)

## Later, optional
- [ ] Layer 2 Kobo adapter: highlights, exact positions
- [ ] Reading stats
