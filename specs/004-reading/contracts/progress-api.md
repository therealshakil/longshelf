# Contract: Reading places API (browser ↔ mirror)

Owner-only, like every browser route in spec 003 ([mirror-api.md](../../003-library-mirror/contracts/mirror-api.md)):
- no owner identity gives 403 with no data, and the service token gets 403 too;
- every response carries `X-Robots-Tag: noindex, nofollow`.

The Zod schemas live in `packages/shared/src/progress.ts`.

## `GET /api/progress`

Returns every place, one per book and device:

```json
{
  "places": [
    {
      "bookId": "…", "deviceId": "…", "deviceName": "Android phone",
      "percent": 41.2, "chapterLabel": "Chapter 12", "href": "ch12.xhtml", "fraction": 0.3,
      "cfi": "epubcfi(…)", "fileSha256": "…",
      "furthestPercent": 41.2, "furthestHref": "ch12.xhtml",
      "readAt": "2026-11-25T18:02:11.000Z"
    }
  ]
}
```

- `Cache-Control: private, no-cache`, with a weak `ETag` from the newest `received_at` and the
  row count. `If-None-Match` gives 304.
- Service worker: network-first, falling back to the last copy, with the same `x-longshelf-source`
  header as the catalogue ("offline" or "sign-in").
- Size: about 300 bytes per row. 670 books × 3 devices is under 1 MB in the worst case. Typical
  use (tens of books started) is a few KB.

## `PUT /api/progress`

Body: `{ "places": [ <place>, … ] }`, 1 to 100 places, each as above.

- Each place is upserted on `(bookId, deviceId)` only if its `readAt` is newer than the stored one.
- A `readAt` more than 5 minutes ahead of the server is clamped to the server's time (research R5).
- Response 200: `{ "accepted": [ { "bookId", "deviceId", "readAt" } ], "stale": [ … ] }`.
  - `stale` lists places that were older than the stored row. The browser treats both lists as
    sent (`syncedAt = readAt`), because the mirror holds the newer one.
- 400 on schema errors, with a plain message, and nothing is written.
- 403 without the owner's identity. The browser keeps the places pending and shows "Sign in again"
  (spec edge case "sign-in has expired").

## When the browser sends

- Debounced 10 s after the place changes while reading.
- When the page is hidden (`visibilitychange`), with `fetch(…, { keepalive: true })`.
- On `online`, and on app start.
- Each send carries every pending place (at most one per book). Nothing is dropped until the
  mirror answers 200.
