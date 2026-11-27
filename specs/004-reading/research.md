# Research: Reading offline and across devices

Decisions for [spec.md](spec.md). Read 2026-11-25. Sources are linked; anything unverified is
marked ASSUMPTION with the task that checks it.

## Starting point (read from the code, 2026-11-25)

- The reader opens a URL (`/api/files/<sha256>` in mirror mode, `/sample/books/…` in sample mode)
  with foliate-js `view.open(src)`. File URLs are content-addressed: a changed file has a new URL.
- The place is saved per book in localStorage (`longshelf.reader.place.<id>`: cfi, fraction,
  chapter label, savedAt). It never leaves the device.
- `ReadingPosition` (`packages/shared/src/library/types.ts`) already has `source` (a device id),
  `readAt` and the chapter, fraction, percent and CFI fields. The book page and reader already
  show another device's place ("Kobo: 63%… Jump there?") from `book.positions`. In mirror mode
  that list is empty.
- The service worker (spec 003 R6) precaches the shell, caches covers by hash, and serves the
  catalogue network-first. It deliberately skips book files.
- The book page's Download button is a placeholder toggle.

## R1. Where downloaded books are kept: Cache Storage, not OPFS

**Decision:** a `books-v1` cache in Cache Storage, keyed by the file URL. The page fetches the
file and stores it. The service worker serves any file URL found there, cache-first, online or
offline.

**Rationale:**
- The reader needs no change: it still opens the same URL, and the service worker answers it
  from the cache (FR-003, FR-004). Content-addressed URLs mean a cached file is never stale.
- Cache Storage is already used by the service worker. OPFS would add a second storage system,
  plus code to turn files back into responses or Blobs for the reader.
- Cache Storage, IndexedDB and OPFS share one per-origin quota, and `QuotaExceededError` behaves
  the same for each ([MDN, storage quotas](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)).
  OPFS has no space advantage.
- OPFS's streaming write (`createWritable`) only became Baseline in September 2025 ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileHandle/createWritable)).
  Cache Storage has worked everywhere for years.

**All or nothing (FR-002):** `cache.put()` stores an entry only once the body has been read in
full. ASSUMPTION: a body that errors mid-way stores nothing. MDN's `put` page doesn't say ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Cache/put)).
Spike task T001 checks it in Chromium and WebKit. As a belt-and-braces check, the stored size is
compared with the catalogue's size before the book is marked downloaded. A mismatch deletes the
entry.

**Progress (US1 scenario 1):** the response body is piped through a byte-counting stream into
`cache.put`, so the bar moves without holding the whole file in memory.

**Index of downloads:** no second store. Each cached response carries `x-longshelf-book`,
`x-longshelf-format`, `x-longshelf-size` and `x-longshelf-title` headers, so `cache.keys()` plus
`cache.match()` gives the storage page everything (FR-014). It also covers a book that has left
the mirror.

**Alternatives:**
- OPFS (DESIGN.md's plan): rejected for the reasons above. It stays the fallback if T001 finds
  `put` stores partial bodies in a browser.
- IndexedDB Blobs: workable, but it needs Dexie or raw IndexedDB code, and the reader would need
  a Blob instead of a URL.
- Leave it to the service worker to cache files as they're read ("read once, keep"): rejected.
  The owner asked to choose what is kept (US3), and silent growth breaks principle I.

## R2. Keeping downloads: `navigator.storage.persist()`

**Decision:** call `persist()` on the first download, and on the storage page if it isn't granted
yet. Store the answer, and show it in plain words on the storage page (FR-006, FR-014).

**Facts:** Chromium and Safari decide from the site's interaction history, without a prompt.
Firefox shows a prompt ([MDN, storage quotas](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)).
Safari deletes all script-written data from an origin with no interaction for 7 days of browser
use, all at once ([same page](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)).
ASSUMPTION: Home Screen web apps are exempt from the 7-day rule (WebKit's ITP announcement;
not re-read today). Either way, the spec's edge case "the device cleared its storage" covers it:
the app notices missing entries and keeps the places, which are also on the mirror.

## R3. Space figures: `navigator.storage.estimate()`

**Decision:** the storage page shows each book's size from its header (exact), the total as the
sum of those (exact, SC-006), and "space available" as `quota − usage` from `estimate()`,
labelled "about".

**Facts:** `estimate()` is Baseline since 2023 but imprecise "between compression, deduplication,
and obfuscation" ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/estimate)).
So the exact total comes from the book sizes, not from `usage`.

**Not enough space:** before downloading, compare the book size with `quota − usage`. If it
clearly won't fit, say how much is needed and don't start. If `put` still throws
`QuotaExceededError`, show the same message, and nothing is stored (R1).

## R4. Device places: localStorage, not Dexie

**Decision:** keep the existing per-book localStorage key and extend it. A place carries `readAt`
(when it was read) and `syncedAt` (when the mirror last confirmed it). The outbox is every place
with `readAt > syncedAt`. The device id and name sit in one more key.

**Rationale:**
- With latest-wins (FR-011), only the newest place per book and device matters. The outbox is at
  most one entry per book: a few KB, far below localStorage's 5 MiB ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)).
- Writes are synchronous, so the place is on disk before the page can be closed (FR-008, SC-004).
  IndexedDB writes are asynchronous and can be lost on a hard close.
- No new dependency (Longshelf principle 4; constitution IX).
- Two tabs: a write keeps whichever place has the later `readAt`, so neither tab can move the
  other back.

**Spec wording:** FR-010 says "kept in order" and SC-003 says "every place recorded". With
latest-wins, intermediate places carry no information. The plan sends the latest place per book
and device. Spec FR-010 and SC-003 are reworded to "the latest place of every book read offline
reaches the mirror, none lost or overtaken by an older one".

**Alternatives:**
- Dexie (DESIGN.md's plan, in the agreed stack): rejected for now. It's worth it for the
  structured local data that highlights (spec 005+) will bring, and can be adopted then.
- Raw IndexedDB: asynchronous, more code, no benefit at this size.

## R5. Places on the mirror: one D1 table, one route

**Decision:** a `reading_place` table with one row per book and device, and `GET` / `PUT
/api/progress`. The upsert keeps a row only if its `read_at` is newer. The browser fetches all
places with the catalogue, and the service worker caches them network-first, so the home page's
"Currently reading" and the reader's notice work offline from the last copy.

**Rationale:**
- It is the `progress` table from DESIGN.md, cut to what this spec needs. Kobo's
  `native_location` and `status` come in spec 005, as new nullable columns (additive migration).
- A separate route, because the catalogue is an immutable blob built at upload. Places change
  every few minutes.
- No foreign key to `book`: a place outlives a book removed from the mirror (spec edge case).

**Clock skew:** `readAt` is the device's clock. The server clamps any `readAt` later than its own
time plus 5 minutes to its own time, so a device with a fast clock can't win forever. ASSUMPTION:
phones and laptops are NTP-synced to within seconds, so latest-wins is reliable in practice.

**Cost (SC-008):**
- Sending is debounced: at most one `PUT` per 10 s while reading, plus one when the app is hidden
  (`fetch` with `keepalive`).
- 2 hours of reading is at most about 720 requests and 720 row writes. Workers Free allows
  100,000 requests a day, and D1 Free 100,000 rows written a day (limits as cited in
  `docs/DEPLOY.md`, read 2026-11-24).
- Cost: £0.

## R6. Choosing where to open (FR-009)

**Decision (revised 2026-11-27, owner chose option 1 after a calm council):** on opening a book,
compare this device's place with the newest place from another device, by `readAt`:
- no newer place elsewhere: open here;
- newer elsewhere: open at the other place, and adopt it as this device's place with the other
  place's `readAt`, so adopting never creates a "move". If this device's own place was still
  unsent, send it first, so the mirror keeps it.

Then offer, once, the furthest place that is further on in a later chapter (or at least 5%
further when there's no chapter to compare), from another device or from this device's place
before adopting. Offers already shown are kept per book in `longshelf.reader.offered.v1`, by
device and `readAt`, so the same place is never offered twice. Prior art: Kindle opens at the most
recent page and keeps the furthest page as a manual option; KOReader's Kobo plugin pulls newer
progress and never older. The 2026-11-25 rule (open here and ask when both devices moved) taxed
the common case of switching devices.

The open is made from the newest places available. That is the network copy online, or the
cached copy offline, which may be older; the spec accepts that.

**Jumping to another device's place:** the CFI is exact within the same file. If the files
differ (the book was updated, or a Kobo place in spec 005), fall back to chapter `href` plus
`fraction`, then to `percent`. `Reader.svelte` already takes `startCfi`, `startHref` and
`startFraction`.

## R7. Device name (FR-013)

**Decision:** a random id (`crypto.randomUUID()`) on first use, and a name derived once from the
browser: "Android phone", "iPhone", "iPad", "Mac", "Windows PC", "Linux PC", with the browser
name added if two devices would otherwise clash on the mirror. The owner can rename the device on
the storage page. Sent with every place.

**Alternative:** asking the owner to name the device on first run. Rejected as extra load
(principle I). Renaming covers it.

## R8. The smoke test (FR-016)

**Decision:** a Playwright test in the default e2e suite (sample mode, as today):
1. open a book page;
2. Download and wait for "Downloaded";
3. `context.setOffline(true)`;
4. reload, open the book, turn 3 pages, and check the place changes.

It needs no mirror and no Access. The download code treats any file URL the same, so sample
books (`/sample/books/…`) exercise the same path as mirror files. The service worker runs in
Chromium under Playwright. ASSUMPTION: it controls the page after one reload; the test does that
reload before going offline.

## Challenger (constitution VII)

**Strongest case against R1 (Cache Storage):** the design doc chose OPFS, the platform's file
store. A 300 MB PDF in Cache Storage might strain the browser, and Cache Storage is "for HTTP
responses", not a library.

**Ruling:** keep Cache Storage.
- The quota is shared, so space is the same either way.
- Streaming `put` doesn't hold the file in memory.
- The library has few large PDFs, and spec 004 downloads one book at a time, by choice.
- The reader-needs-no-change benefit is concrete. OPFS's is theoretical.
- If T001 shows partial entries are possible, switch to OPFS with write-then-rename before
  building US1.

**Strongest case against R4 (localStorage):** DESIGN.md and CLAUDE.md name Dexie; deviating
fragments the client data story, and spec 005 will need it anyway.

**Ruling:** keep localStorage for spec 004.
- The data is one small record per book, and the synchronous write is a real benefit for FR-008.
- Adopting Dexie when spec 005 has structured data to store costs little.
- Recorded in DR-0013, so it isn't a silent reversal.
