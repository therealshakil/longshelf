# DR-0013: Offline books in Cache Storage, reading places in localStorage

Status: **proposed** (2026-11-25, spec 004 plan). Accepted when the owner approves the plan.
Supersedes the `docs/DESIGN.md` lines "Offline books: Download stores the file in OPFS" and
"Dexie: … offline progress writes go to an outbox table" for spec 004.

## Context

Spec 004 keeps books on a device for offline reading and syncs the reading place between
devices. DESIGN.md planned OPFS for book files and Dexie (IndexedDB) for the catalogue and a
progress outbox. Spec 003 has since put the catalogue in the service worker's Cache Storage, and
the reader already saves its place in localStorage.

## Options

| Option | For | Against |
|---|---|---|
| **Cache Storage for book files** (platform standard) | The reader opens the same URL, and the service worker answers from the cache; no reader change. Same quota as OPFS ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)). Long supported everywhere. | Built for HTTP responses, not files. Whether a failed body leaves a partial entry isn't documented ([MDN `put`](https://developer.mozilla.org/en-US/docs/Web/API/Cache/put)): spike T001. |
| OPFS for book files (DESIGN.md) | The platform's file store, with a clear write-then-close model | Streaming writes only Baseline since September 2025 ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileHandle/createWritable)). Needs code to hand Blobs to the reader, and a second storage system. |
| **localStorage for places** (existing) | Synchronous, so a place is on disk before the page can close. Latest-wins means one small record per book. Already used by the reader. | 5 MiB cap; fine at about 1 KB per book. |
| Dexie for places (existing library, in the agreed stack) | Structured, async, and ready for highlights later | A dependency for one record per book; async writes can be lost on a hard close |

## Decision

- Downloaded book files go in a `books-v1` Cache Storage cache, keyed by their content-addressed
  URL, with the book's details in response headers. The service worker serves them cache-first.
- Reading places stay in the per-book localStorage key, extended with `readAt` and `syncedAt`.
  The outbox is the set of places not yet confirmed by the mirror.
- On the mirror: one `reading_place` row per book and device, latest `read_at` wins.

## Challenger

See [spec 004 research](../../specs/004-reading/research.md), "Challenger". In short:
- OPFS is the "right" file store, but it brings no gain in space or speed here, and costs
  reader changes. If T001 finds partial cache entries, switch to OPFS before building.
- Dexie is in the stack and spec 005 may need it. Adopting it then, for structured data, costs
  little; using it now adds a dependency for no gain.

## Consequences

- No new dependencies. The service worker gains two routes.
- DESIGN.md's Client (PWA) section points here.
- Revisit when spec 005 adds highlights or other structured device data (likely Dexie then).
