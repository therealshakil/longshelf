# Data model: 002

Two layers:
- **Library data**, read through `LibrarySource` ([contracts/library-source.md](contracts/library-source.md)).
  It comes from sample fixtures now and from the mirror's D1 tables in spec 003. Field names
  follow `docs/DESIGN.md` "Data model" so the swap is mechanical.
- **AI data**, owned by this spec and stored in D1 (tables below).

## Library entities (read-only here)

| Entity | Fields | Notes |
|---|---|---|
| Book | id, title, subtitle?, authors[] (id, name, sort), cover (url, alt), description?, series? (name, index), collection?, tags[], formats[], addedAt, pubYear?, publisher? | `collection` is Calibre's single-value Collection column; never written (FR-012). |
| ReadingPosition | bookId, source (`this-device` \| `kobo` \| other device id), percent, chapterLabel, href, fraction, cfi?, readAt, furthestHref, furthestPercent | Matches DESIGN.md `progress` plus "furthest", which recaps need. |
| ReadStatus (derived) | `unread` \| `in-progress(percent)` \| `finished` | One rule everywhere (FR-005): no label / "N% read" / "Finished". |
| Author | id, name, sort, lifeDates?, bio? (text, source url), portrait? (url, credit, licence, source?), bibliography[] (title, year?, ownedBookId?) | Bio, portrait and bibliography come from public sources, with the source shown. Missing data is omitted. |
| Shelf | kind (`collection` \| `genre`), id, name, bookIds[] | Genre shelves include suggested and promoted genres. |
| PeriodicalIssue | id, publication, issueDate, cover?, status | Never listed in Recently added (FR-002, US8). |

Validation:
- `percent` is 0–100.
- `furthestPercent` ≥ `percent` for the same source.
- A book appears in Also reading only if it is in progress on some source (edge case: Kobo only).

## AI entities (D1, this spec)

```sql
-- Suggested genres per book; promotion is applied to Calibre by the ribbon CLI (spec 003)
genre_suggestion(book_id, genre, state, model, created_at, state_at,
                 PRIMARY KEY (book_id, genre))
  -- state: suggested -> promoted -> in_calibre ; suggested -> removed ; promoted -> removed

-- One summary per chapter the owner has passed; recaps are built only from these (FR-011)
chapter_summary(book_id, href, chapter_label, ordinal, summary, model, created_at,
                PRIMARY KEY (book_id, href))

-- Books the genre job has checked, so a rerun doesn't pay for them again
genre_checked(book_id PRIMARY KEY, model, checked_at)

-- Last recap per book, keyed by the cut-off it was built to
recap(book_id, upto_href, upto_percent, text, model, created_at, PRIMARY KEY (book_id))

-- Text profile embedding per book, for similarity and plain-language search
book_embedding(book_id PRIMARY KEY, profile_hash, vector BLOB, model, created_at)

-- Each book's closest matches, built by `pnpm ai:neighbours` (research R6)
-- neighbours: JSON [[bookId, score], ...]; copies: JSON [bookId, ...] or null
book_neighbours(book_id PRIMARY KEY, model, neighbours, copies)

-- Owner's dismissals of suggestions (FR-010)
suggestion_dismissal(book_id PRIMARY KEY, kind, until)   -- kind: not_now | never; until null = never

-- Spend guard (FR-017): estimated neurons per UTC day
ai_usage(day PRIMARY KEY, neurons_est, calls)

-- The owner's AI settings: the off switch (FR-016) and the daily ceiling (FR-017)
ai_setting(key PRIMARY KEY, value)
```

State rules:
- `genre_suggestion`: only `suggested` and `promoted` show as dashed chips. `promoted` shows
  "Waiting for sync" until the CLI reports `in_calibre`. `removed` stays as a tombstone, so the
  same genre isn't suggested again.
- `recap`: rebuilt when `furthest` moves past `upto_href`. Never built from a chapter without a
  summary.
- `suggestion_dismissal`: `not_now` lapses after 30 days (ASSUMPTION: starting value); `never`
  lasts until undone.
- `ai_usage`: every AI call adds its estimate. Calls stop for the day at the configured ceiling
  (default 8,000 neurons).

## Device-local state (browser)

- Reader settings (size, font, spacing, margins, scroll or pages, theme): one versioned
  `localStorage` key. They apply to every book on the device (FR-004).
- This device's reading positions: kept locally in this spec. The outbox and cross-device sync
  belong to specs 004 and 005.
