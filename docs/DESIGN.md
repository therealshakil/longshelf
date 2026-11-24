# Longshelf: design

## Goals
- Calibre on the desktop stays the only place books are managed; the cloud is a mirror.
- Web library and reader: installable PWA, works offline, usable on phone, tablet and laptop.
- Reading progress syncs both ways between the web reader and the e-reader (Kobo Libra 2), via Calibre.
- Low maintenance above all.

## Non-goals (v1)
- Editing metadata in the web app.
- Multi-user or public sharing. "Installable by anyone" later means each person deploys their own copy.
- Replacing Calibre's device driver; Calibre still loads books onto the device over USB.

## Context
- Library: about 700 books, mostly EPUB. Desktop: Linux, with macOS support wanted.
- Device: Kobo Libra 2, stock firmware, managed by Calibre over USB.

## Architecture
```
Kobo <-> (Kobo Utilities plugin, USB) <-> Calibre custom columns
                                              ^
                                              | longshelf CLI (reads metadata.db read-only,
                                              v                 writes via calibredb)
                        Cloudflare Worker (SvelteKit UI + /api) -- D1 (metadata, progress)
                        behind Cloudflare Access                \- R2 (book files, covers)
                                              ^
                                              v
                        PWA: IndexedDB catalog + outbox, OPFS books, foliate-js reader
```

## Layering
| Layer | Provides | Depends on |
|---|---|---|
| 0. Calibre only | Books, metadata, covers, web reader, progress between web devices | Nothing extra |
| 1. Calibre custom columns | Two-way progress with any device whose Calibre plugin fills the columns (Kobo Utilities; KOReader sync plugin is similar) | A device plugin |
| 2. Direct device adapter (later, optional) | Kobo highlights/notes and more exact positions, from `.kobo/KoboReader.sqlite` joined to Calibre via the device's `/.metadata.calibre` (path -> Calibre uuid) | Per-device code |
| 3. Kobo wireless sync protocol (unlikely) | Sync without USB | Reverse-engineered API |

v1 is layers 0 and 1. Column names are configuration, so the core contains no Kobo-specific code.

## longshelf CLI
> Spec 003 changes the upload path and metadata storage below: see DR-0010.

- Node 24, `node:sqlite`. Opens `metadata.db` read-only. Idempotent; safe to run repeatedly.
- `longshelf library`: read books/authors/series/tags/formats; SHA-256 each file;
  `POST /api/ingest/plan` with `{uuid, metadataHash, fileHashes}`; server returns what is missing plus
  presigned R2 upload URLs; upload; `POST /api/ingest/commit`.
- `longshelf progress`: read the configured custom columns (percent, location, last-read, status) and push
  to the cloud; pull cloud progress and, where the cloud's last-read time is newer, write the columns with
  `calibredb set_custom`.
- `longshelf install-timer`: systemd user timer on Linux, launchd on macOS.
- Per-OS differences are only default paths (library, `calibredb`) and the scheduler. v1 never touches the
  device, so there is no mount detection.
- Auth: Cloudflare Access service token.

## Cloud
- One Worker: SvelteKit with `@sveltejs/adapter-cloudflare` (Workers static assets). UI and API deploy together.
- D1: metadata, progress, highlights. Plain SQL; `wrangler d1 migrations`. Search runs in the browser with MiniSearch (DR-0008).
- R2: files keyed by SHA-256, served immutable with Range support. Cover thumbnails via Cloudflare Image
  Transformations.
- Auth: Cloudflare Access in front of everything, long session (about 30 days) for the offline PWA.

## Client (PWA)
- Svelte 5, Tailwind v4, shadcn-svelte (Bits UI), Lucide.
- Service worker: SvelteKit native `src/service-worker.ts`. App shell precached; covers cache-first; API
  network-first with IndexedDB fallback.
- Dexie: whole catalog fetched as one JSON document, re-fetched only when its ETag changes (700 books is
  small; no incremental sync). Offline progress writes go to an outbox table, flushed on `online`,
  `visibilitychange` and app start (no Background Sync; iOS lacks it).
- Offline books: "Download" stores the file in OPFS and calls `navigator.storage.persist()`.
- Reader: foliate-js (parses EPUB/KEPUB/PDF in the browser from a Blob), pinned submodule, one wrapper
  component. Fallback if it stalls: Readium ts-toolkit. Not epub.js.

## Data model (D1)
```sql
books(id, calibre_uuid UNIQUE, title, sort, series_id, series_index,
      pubdate, description, rating, cover_hash, updated_at, deleted_at)
authors(id, name, sort)          book_authors(book_id, author_id, pos)
series(id, name)                 tags(id, name)   book_tags(book_id, tag_id)
files(book_id, format, sha256, size)               -- R2 key = sha256

progress(book_id, source, device_id, percent, href, fraction, cfi,
         native_location,           -- device's own position, stored verbatim (JSON)
         read_at,                   -- when the position last changed
         status, status_at,         -- read status, timestamped separately
         PRIMARY KEY(book_id, source, device_id))
highlights(id, book_id, source, source_ref, text, note, color,
           href, cfi, created_at, updated_at, deleted_at)

books_fts USING fts5(title, authors, series, tags)
```
- Position = chapter `href` + `fraction` within the chapter + overall `percent`. The web reader also stores
  a CFI for its own exact positions.
- `native_location` holds whatever the device reported, uninterpreted (for Kobo: chapter file, marker within
  it, and type). A position that originated on the device is written back from this field exactly; only
  positions that originated in the web reader are converted. Kobo's two percentages (through the book,
  through the chapter) map to `percent` and `fraction`.
- `status` and position have separate timestamps and are merged independently, so "finished" set on one
  device and a position moved on another both survive.
- Each source's latest position is kept separately. The UI offers "Kobo: 63%, ch. 12. Jump there?" rather
  than overwriting silently.

## Known limits
- Web -> Kobo is accurate to the chapter, not the sentence, when the library holds only EPUB: Kobo's exact
  position refers to markers in the KEPUB that Calibre generates at send time, which are not in the EPUB.
  Possible fix (unverified, see spike): keep KEPUB as a format in the Calibre library so the cloud and the
  device hold the same file. The web reader can then read Kobo's markers and write an exact position.
  `longshelf library` should therefore upload KEPUB when present and the reader should prefer it.
- USB is the transport: web progress reaches the Kobo next time it is plugged in with Calibre open.
- Kobo highlights are not available in layer 1.

## Unverified assumptions (see spike in PLAN.md)
- Kobo Utilities round-trips position through custom columns, and a hand-written chapter-start location
  restores correctly.
- Whether restore can run automatically on connect.
- Whether `calibredb set_custom` works while the Calibre GUI is open, or must go through Calibre's local
  content server (`--with-library http://localhost:8080`).
- Whether Calibre sends a library KEPUB to the device unchanged (so its markers match the cloud copy).
Fallback if restore of our written locations fails: longshelf writes the Kobo database itself (part of layer 2).

## Lessons from Calibre-Web and Calibre-Web-Automated
Both are GPL-3: use them to understand behaviour, do not copy or closely port their code.
- They store the Kobo's location uninterpreted and echo it back (hence `native_location`).
- They keep the web reader bookmark and the Kobo reading state in unrelated tables; one unified `progress`
  table is what this project does differently.
- CWA bridges KOReader and Kobo progress by percent only; chapter + fraction is already finer.
- CWA writes its own table into `metadata.db` and needs the library on the server; we do neither.
- Layer 3 reference: the reading-state endpoint (`/v1/library/<uuid>/state`) is small, but the device
  believes it is talking to Kobo's store, so about 30 other routes must be stubbed or forwarded to Kobo,
  plus device auth and a sync token (about 1,300 lines in Calibre-Web's `cps/kobo.py`). The protocol also
  carries reading minutes and an annotations endpoint, so layer 3 could deliver highlights without layer 2.
  Wireless delivery needs KEPUBs made in advance, since a Worker cannot run the converter.
- Their scope grew to uploads, editing, conversion, OAuth and more. Hold the non-goals.

## Risks
- Kobo firmware changes the DB schema (layer 2 only): one adapter module, fixture tests.
- foliate-js API churn: pinned submodule, thin wrapper.
- iOS PWA storage eviction: `persist()`, re-download button, server is the source of truth.

## Cost
Free tiers of Workers, D1, R2 and Access should cover it; $5/month Workers Paid at most.
