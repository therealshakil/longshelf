# Contract: Downloads and the service worker (in the browser)

## `apps/web/src/lib/offline/downloads.ts`

A module the book page, library, reader and storage page share:

| Function | Does |
|---|---|
| `download(book, fileUrl, size, onProgress)` | Fetches the file, streams it into `books-v1` with the headers in [data-model.md](../data-model.md), checks the stored size, and calls `persist()` the first time. Rejects with `NoSpace { needed }`, `Offline` or `Failed`, leaving nothing behind. |
| `remove(fileUrl)` | Deletes the entry. Leaves the place alone. |
| `removeAll()` | Deletes every entry. |
| `list()` | Every entry: `{ bookId, title, format, size, savedAt, fileUrl }`. |
| `status(bookId, currentFileUrl)` | `none`, `downloaded` or `update` (a cached file for the book with a different URL). |
| `storageInfo()` | `{ used (sum of sizes), available (estimate, "about"), persisted }` |

## Service worker additions (`src/service-worker.ts`)

- **Files:** `GET /api/files/*` and `/sample/books/*`. If `books-v1` has the path, answer from it
  (with or without `?download=`, which adds `Content-Disposition`). Otherwise go to the network,
  as now, and never cache.
- **Places:** `GET /api/progress` is network-first with the cached fallback, exactly as
  `/api/catalog` is.
- **Range:** a `Range` request for a cached file gets the full 200 response. ASSUMPTION:
  foliate-js reads whole files (it opens from a fetched Blob); T001 confirms it for EPUB and PDF.

## Offline reader states (FR-005)

| Online? | Downloaded? | Reader |
|---|---|---|
| yes | yes | Opens from the device copy |
| yes | no | Opens from the mirror, as now |
| no | yes | Opens from the device copy |
| no | no | Calm message: "This book isn't downloaded. Connect to read it, or download it next time." With a link back to the library. No error page. |
