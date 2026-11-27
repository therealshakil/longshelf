# Implementation Plan: Reading offline and across devices

**Branch**: `004-reading` | **Date**: 2026-11-25 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/004-reading/spec.md`

## Summary

Let the owner keep books on a device and read them with no connection, and carry the reading
place between devices:

- **Downloads:** the book page's Download button stores the book's file in a Cache Storage cache,
  keyed by its content-addressed URL. The service worker answers that URL from the cache, so the
  reader opens it unchanged, online or offline (research R1).
- **Places:** the existing per-book localStorage place gains `readAt` and `syncedAt`. Places not
  yet confirmed are sent to a new `reading_place` D1 table, latest wins. They come back with the
  catalogue, so the existing "Jump there?" notice and the home page's current book work in mirror
  mode (R4 to R6).
- **Storage page:** Settings → Storage lists the downloads, sizes and space, with Remove
  (R2, R3).
- **No new dependencies.** Cost: £0.

[DR-0013](../../docs/decisions/DR-0013-offline-books-and-places.md) records where this departs
from `docs/DESIGN.md`: Cache Storage instead of OPFS, and localStorage instead of Dexie for
places.

## Technical Context

**Language/Version**: TypeScript 6, Svelte 5.

**Primary Dependencies**: the agreed stack. SvelteKit 3 and its native service worker, foliate-js
(unchanged), Zod. Browser APIs: Cache Storage, `StorageManager.persist`/`estimate`,
localStorage, Streams, `fetch` keepalive. No new npm packages.

**Storage**:
- D1: a new `reading_place` table ([data-model.md](data-model.md)).
- Browser:
  - Cache Storage `books-v1`, for downloads;
  - localStorage, for the place and the device;
  - the existing `catalog-v1` cache, which now also holds `/api/progress`.

**Testing**:
- Vitest:
  - place merging and the FR-009 decision (R6);
  - the outbox (pending, sent, and moved again meanwhile);
  - the two-tab rule;
  - the device name.
- Vitest with pool-workers: `/api/progress` upsert (newer wins, stale reported, clamping, 403,
  schema 400).
- Playwright: the FR-016 smoke test in the default suite (sample mode). The download, offline and
  read states join the a11y matrix.

**Target Platform**: the existing Worker on `library.longshelf.app`. Evergreen browsers. The
owner's phone (installed app) and laptop.

**Project Type**: web application (SvelteKit app and API), in the existing workspace.

**Performance Goals**:
- SC-001: offline cold open of a downloaded book in under 3 s.
- SC-002: another device's place shown within 10 s.
- SC-005: a 5 MB download in under 10 s.

**Constraints**:
- Worker Free: 10 ms CPU per request. The progress routes are single D1 statements.
- D1 Free: 100,000 rows written a day. At most about 360 a reading hour (R5).
- Calibre is never written.
- Nothing is readable without Access.
- No silent jumps backwards (FR-009, FR-011).

**Scale/Scope**:
- one owner and 2–4 devices; 670 books, typically tens with places;
- 2 new API routes, 1 migration, 1 service worker change;
- 1 new page (Settings → Storage) and new states on the book page, library and reader, each shown
  to the owner as a mock first.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | How |
|---|---|---|
| I. Calm & low-load | Pass | Downloads only by choice. Offline gives a calm message, not an error. FR-009 asks only when the devices disagree. Places sync without any action. |
| II. Outcomes over ceremony | Pass | The gates are the quickstart's real-device checks and the smoke test, not process steps. |
| III. Dual interface | Pass | Owner view: the app. Operator view: `/api/progress` is inspectable, and the storage page shows what is on a device. |
| IV. What, not how | Pass | The spec is tool-free. Tools are named here and in DR-0013. |
| V. Adopt before building | Pass | Platform storage (Cache Storage, StorageManager) and the existing service worker and reader. OPFS, IndexedDB and Dexie were assessed in R1 and R4. Nothing hand-rolled where a standard exists. |
| VI. Decisions recorded | Pass | DR-0013 supersedes DESIGN.md's OPFS and Dexie lines, explicitly. |
| VII. Challenger before locking | Pass (same session) | Counter-cases for R1 and R4 are in research.md. The owner rules on this plan. |
| VIII. Cite or mark assumption | Pass | MDN cited with the read date. 4 ASSUMPTIONs named, each with a checking task (T001 spike, R8). |
| IX. Economy | Pass | £0 a month (R5). No new dependencies. |
| X. Solo-operable | Pass | Nothing new to operate. A migration on the next deploy. |
| XI. Honest by construction | Pass | The storage page states what is stored and whether it is kept. Places stay private behind Access. |

Re-check after Phase 1: no violations. Risks to watch:
- Cache Storage partial writes (T001). The fallback is OPFS.
- Service worker control on the first visit, for the smoke test (R8).

## Project Structure

### Documentation (this feature)

```text
specs/004-reading/
├── spec.md
├── plan.md                  # this file
├── research.md              # R1–R8, challenger
├── data-model.md            # reading_place, localStorage keys, books-v1 cache
├── quickstart.md            # real-device validation
├── contracts/
│   ├── progress-api.md      # GET/PUT /api/progress
│   └── client-storage.md    # downloads module, service worker rules, offline reader states
├── checklists/requirements.md
└── tasks.md                 # /speckit-tasks
```

### Source Code (repository root)

```text
packages/shared/src/
└── progress.ts                      # Zod: place, GET/PUT bodies

apps/web/
├── migrations/0005_reading_place.sql
└── src/
    ├── service-worker.ts            # books-v1 cache-first; /api/progress network-first
    ├── lib/offline/
    │   ├── downloads.ts             # download, remove, list, status, storageInfo
    │   └── device.ts                # id + name (R7)
    ├── lib/reader/
    │   ├── settings.ts              # SavedPlace gains readAt, syncedAt, href, percent…
    │   ├── places.ts                # FR-009 decision, merge with mirror places
    │   └── outbox.ts                # pending places, debounced send, keepalive flush
    ├── lib/server/mirror/progress.ts
    ├── lib/library/                 # positions from /api/progress joined into book.positions
    ├── lib/components/BookHeader.svelte   # real Download states (mock first)
    └── routes/
        ├── api/progress/+server.ts
        ├── read/[id]/+page.svelte   # FR-009 open rule, offline message
        └── settings/storage/+page.svelte  # NEW (mock first)

apps/web/tests/
├── unit/places.test.ts, outbox.test.ts, progress-api.test.ts
└── e2e/offline-reading.spec.ts      # FR-016 smoke test

docs/
├── decisions/DR-0013-offline-books-and-places.md
└── DESIGN.md                        # Client (PWA) lines updated to point at DR-0013
```

**Structure Decision**: the existing workspace. Browser offline code gets its own
`lib/offline/`, beside `lib/reader/` and `lib/library/`. Server code goes under
`lib/server/mirror/`, as in spec 003.

## Delivery order

1. **Spike (T001):** in Chromium and WebKit (Playwright), and on the owner's phone:
   - does an errored body stream leave a `cache.put` entry behind?
   - does foliate-js open EPUB and PDF from a service-worker-cached response offline?
   - what does `persist()` return on the installed app?

   Record the results in the PLAN.md spike log. If partial entries are possible, switch R1 to
   OPFS before US1.
2. **Mocks:** the Download states, the offline book message and the Storage page, as design
   pages in the spec 002 style, for the owner's approval. No UI code before approval.
3. **US1:** the downloads module, the service worker, book page states, library marks, the
   offline reader message, and the smoke test.
4. **US2:** migration, `/api/progress`, outbox, place merge, and the FR-009 open rule. The notice
   names devices from the mirror.
5. **US3:** the Storage page, Remove, Remove all, and renaming the device.
6. Quickstart on a PR preview, then production. DR-0013, DESIGN.md and the journal.

## Complexity Tracking

No constitution violations.
