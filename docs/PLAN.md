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

### Phase 3: device progress via Calibre columns → spec 005
- [ ] Store device location verbatim in `native_location`; merge status and position by separate timestamps
- [ ] Column config; `longshelf progress` (read columns, push; pull, `calibredb set_custom`)
- [ ] "Jump to Kobo position" prompt
- [ ] `longshelf install-timer` (systemd, launchd)

### Later, optional
- [ ] Layer 2 Kobo adapter: highlights, exact positions
- [ ] Reading stats
