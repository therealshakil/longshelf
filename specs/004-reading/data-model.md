# Data model: Reading offline and across devices

See [research.md](research.md) R1, R4 and R5 for the reasons.

## Mirror (D1): `reading_place`

Migration `apps/web/migrations/0005_reading_place.sql` (additive).

| Column | Type | Notes |
|---|---|---|
| `book_id` | TEXT NOT NULL | The catalogue book id. No foreign key: a place outlives a removed book. |
| `device_id` | TEXT NOT NULL | Random UUID from the device (R7). |
| `device_name` | TEXT NOT NULL | "Android phone", or the owner's own name for it. |
| `percent` | REAL NOT NULL | 0–100 through the book. |
| `chapter_label` | TEXT NOT NULL | For the notice ("ch. 12"). |
| `href` | TEXT NOT NULL | Chapter document within the file. |
| `fraction` | REAL NOT NULL | 0–1 within the chapter. |
| `cfi` | TEXT | Exact place within this file. |
| `file_sha256` | TEXT | The file the CFI belongs to, so another file falls back to href + fraction. |
| `furthest_percent` | REAL NOT NULL | The furthest this device has read. |
| `furthest_href` | TEXT NOT NULL | |
| `read_at` | TEXT NOT NULL | ISO time on the device, clamped by the server (R5). |
| `received_at` | TEXT NOT NULL | Server time, for diagnosis only. |

Primary key `(book_id, device_id)`.

Rules:
- An upsert writes only if `excluded.read_at > reading_place.read_at` (FR-011).
- `percent` and `fraction` are in range, and `furthest_percent ≥ percent`, checked by the shared
  Zod schema before writing.
- Spec 005 adds `source`, `native_location`, `status` and `status_at` as nullable columns.

## Device (browser): localStorage

| Key | Value |
|---|---|
| `longshelf.device.v1` | `{ id, name }`. Created on first use (R7). |
| `longshelf.reader.place.<bookId>` (existing, extended) | `{ cfi, fraction, chapterLabel, savedAt, href, percent, furthestPercent, furthestHref, fileSha256, readAt, syncedAt }` |

- `savedAt` is kept for older entries. On read, a place without `readAt` uses `savedAt`, and
  `syncedAt` defaults to null (unsent).
- **Pending place** = a place with `syncedAt === null` or `readAt > syncedAt`.
- **Sent:** after the mirror accepts it, `syncedAt = readAt`, but only if the place hasn't moved
  again meanwhile.
- **Adopted from another device** (R6): the place is copied with that device's `readAt`, and
  `syncedAt = readAt`.
- **Two tabs:** a write that would lower `readAt` is ignored.

## Device (browser): Cache Storage `books-v1`

One entry per downloaded file, keyed by the file URL without its query.

| Header | Value |
|---|---|
| `x-longshelf-book` | book id |
| `x-longshelf-format` | `EPUB`, `KEPUB`, `PDF`… |
| `x-longshelf-size` | bytes, as stored |
| `x-longshelf-title` | URI-encoded title, so a book that left the mirror is still named |
| `x-longshelf-saved-at` | ISO time |

States per book on this device:

```text
not downloaded ──Download──▶ downloading ──complete + size matches──▶ downloaded
      ▲                         │ error / offline / quota                   │
      └─────────────────────────┘ (entry deleted)                           │
      ▲                                                                     │
      └──────────────────────── Remove (page or storage page) ◀─────────────┤
                                                                            │
                   downloaded ──catalogue lists a different file──▶ update available
                   (old copy still read until the owner taps Update)
```

## Mirror ↔ browser: places in the library view

`GET /api/progress` returns every row. The browser maps the rows to `ReadingPosition` entries in
`book.positions`, with `source = device_id`. It replaces this device's row with the local place
(`source = 'this-device'`), so the existing `splitPositions` and the notice work unchanged.
Device names come from the rows, not from `deviceName()`'s fixed list.
