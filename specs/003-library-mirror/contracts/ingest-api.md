# Contract: Ingest API (`/api/ingest/*`)

Called only by the `longshelf` CLI with the Access service token (headers `CF-Access-Client-Id`
and `CF-Access-Client-Secret`). Any other identity gets 403. Request and response bodies are JSON
validated by Zod schemas in `packages/shared/src/ingest.ts`, except blob bodies, which are raw
bytes. Errors are `{ error: string, detail?: string }` in plain words.

## Flow

```
plan ──► upload each missing blob (single or multipart) ──► upload catalogue blob ──► commit
  └── takes the run lock                                                      └── releases it
abort: releases the lock, keeps stored blobs (they are reused next run)
```

## `POST /api/ingest/plan`

Request:
```ts
{
  books: {
    id: string;                 // Calibre uuid
    metadataHash: string;       // sha256 hex
    cover?: { sha256: string; size: number };
    files: { format: string; sha256: string; size: number }[];
  }[];
}
```
Response 200:
```ts
{
  runId: string;
  missingBlobs: string[];       // sha256s the server has no blob row for
  changedBooks: string[];       // new ids, or ids whose metadataHash differs
  removedBooks: { id: string; title: string }[];   // in the mirror, absent from the request
  removalNeedsConfirm: boolean; // removedBooks > 10% of the mirror (FR-006)
}
```
409 when another run holds the lock: `{ error, detail: "started <time>, expires <time>" }`.

## `PUT /api/ingest/blobs/:sha256?run=<runId>&kind=file|cover|catalog`

For bodies up to 95 MB. The body is streamed to R2 with `sha256` set, so R2 rejects a mismatch.
On success a `blob` row is written. For `kind=cover`, the thumbnail is made and stored too
(research R4). A failed thumbnail is logged and isn't an error.

Responses: 201 stored, 200 already present (idempotent), 400 hash mismatch, 413 over 95 MB.

## Multipart, for files over 95 MB

- `POST /api/ingest/blobs/:sha256/multipart?run=<runId>&size=<bytes>` → `{ uploadId }`
- `PUT /api/ingest/blobs/:sha256/multipart/:uploadId/:part` (1-based, 50 MB except the last) →
  `{ part, etag }`
- `POST /api/ingest/blobs/:sha256/multipart/:uploadId/complete` with `{ parts: {part, etag}[] }`.
  The server checks the total size against `size`, then writes the `blob` row.
- `DELETE /api/ingest/blobs/:sha256/multipart/:uploadId` aborts.

The CLI resumes an interrupted multipart upload by starting it again. Parts are 50 MB, so the
largest loss is one part.

## `POST /api/ingest/commit`

Request:
```ts
{
  runId: string;
  books: { id: string; metadata: Book; metadataHash: string; isNews: boolean;
           coverSha256?: string; files: { format: string; sha256: string; size: number }[] }[];
                                // only the changedBooks from plan, plus any whose files changed
  removed: string[];            // ids to remove; must equal plan's removedBooks
  confirmRemovals?: boolean;    // required when removalNeedsConfirm
  catalogSha256: string;        // the uploaded catalogue blob
}
```
In one D1 batch (all or nothing):
1. Check that every referenced sha256 has a `blob` row. If not: 409, listing what's missing.
2. Upsert `book` and `book_file` rows, and delete removed books.
3. Point `catalog` at `catalogSha256`.
4. Release the lock.

Afterwards it deletes R2 objects (and `blob` rows) that no book, and neither of the last two
catalogues, refers to. Deletes are free operations in R2.

Response 200:
`{ added: number, updated: number, removed: number, catalogSha256: string, bytesFreed: number }`

## `POST /api/ingest/abort`

`{ runId }` releases the lock. 200 even if the lock was already gone.
