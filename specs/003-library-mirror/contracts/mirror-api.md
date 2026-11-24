# Contract: Mirror read API (browser)

Called by the app in the browser with the owner's Access session. Any request without the
owner's identity gets 403 with no library data (FR-015, SC-004). Every response carries
`X-Robots-Tag: noindex, nofollow` (FR-018), and `robots.txt` disallows everything.

| Route | Returns | Caching |
|---|---|---|
| `GET /api/catalog` | The current catalogue document ([data-model.md](../data-model.md)), gzipped | `ETag: "<sha256>"`, `Cache-Control: private, no-cache`. `If-None-Match` gives 304 |
| `GET /api/covers/:sha256` | The 400 px WebP thumbnail, or the original if there's no thumbnail | `private, max-age=31536000, immutable` |
| `GET /api/covers/:sha256?size=full` | The original cover | same |
| `GET /api/files/:sha256` | A book file. Supports `Range` (206) for the reader | same |
| `GET /api/files/:sha256?download=<name>` | The same file with `Content-Disposition: attachment; filename*=UTF-8''<name>` | same |

Unknown hashes get 404. Hashes are 64 lowercase hex characters, and any other shape gets 400. A
file route only serves hashes that have a `blob` row of the matching kind.

## Browser `LibrarySource` (spec 002 contract, unchanged)

`apps/web/src/lib/library/index.ts` stays the one switch point (FR-010):

- **Sample build:** `createSampleLibrary()`, as now.
- **Local Calibre mode:** `createSnapshotLibrary(localCalibre)`, as now (DR-0009).
- **Mirror:** `createSnapshotLibrary(catalog, { fileUrl })`. The catalogue comes from
  `GET /api/catalog`. `fileUrl` picks EPUB, then KEPUB, and returns `/api/files/<sha256>`.

Loading turns async: `getLibrary(fetch)` returns the source, memoised per catalogue ETag. The
root `+layout.ts` awaits it, and pages read it from layout data. Server AI routes get a D1-backed
equivalent, `serverLibrary(db)`, that implements only the methods they use (research R2).

`syncStatus()` in mirror mode returns:
- `up-to-date`, with the catalogue's `committed_at`;
- `offline`, when served from the service worker cache;
- `attention`, with the label "Sign in again", when Access redirected.
