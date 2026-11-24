# Data model: Library mirror (spec 003)

Plain SQL in `apps/web/migrations/0004_mirror.sql`. Additive only (research R7). Book ids are
Calibre's book UUID, the same id the spec 002 AI tables already use.

## D1 tables

```sql
-- One row per Calibre book (news issues included). metadata = the shared Book shape as JSON
-- (title, authors, series, tags, collection, publisher, pubYear, description, addedAt, rating),
-- so server code reads it with the same types as the browser.
CREATE TABLE book (
	id TEXT PRIMARY KEY,                 -- Calibre uuid
	metadata TEXT NOT NULL,              -- JSON, validated by the shared Zod Book schema at ingest
	metadata_hash TEXT NOT NULL,         -- SHA-256 of the canonical metadata JSON
	cover_sha256 TEXT,                   -- NULL when the book has no cover
	is_news INTEGER NOT NULL DEFAULT 0,
	updated_at TEXT NOT NULL
);

-- One row per format of a book. A file's R2 key is its SHA-256 (DESIGN.md).
CREATE TABLE book_file (
	book_id TEXT NOT NULL REFERENCES book(id) ON DELETE CASCADE,
	format TEXT NOT NULL,                -- Calibre's format name, upper case (EPUB, KEPUB, PDF, ...)
	sha256 TEXT NOT NULL,
	size INTEGER NOT NULL,
	PRIMARY KEY (book_id, format)
);
CREATE INDEX book_file_sha ON book_file (sha256);

-- Every object in R2, so the plan can say what is missing without listing the bucket.
-- kind: file | cover | catalog. A row exists only after the object is fully stored.
-- Thumbnails (t/<cover sha>) have no row: they share the cover's hash. 'thumb' is allowed by the
-- CHECK but unused.
CREATE TABLE blob (
	sha256 TEXT PRIMARY KEY,
	kind TEXT NOT NULL CHECK (kind IN ('file', 'cover', 'thumb', 'catalog')),
	size INTEGER NOT NULL,
	stored_at TEXT NOT NULL
);

-- The catalogue the browser downloads. One row; replaced at each commit.
CREATE TABLE catalog (
	id INTEGER PRIMARY KEY CHECK (id = 1),
	sha256 TEXT NOT NULL,                -- the catalogue blob, also its ETag
	previous_sha256 TEXT,                -- kept so a browser mid-fetch never gets a 404
	book_count INTEGER NOT NULL,
	committed_at TEXT NOT NULL
);

-- One upload run at a time (spec edge case). Expires so a crashed run doesn't block forever.
CREATE TABLE ingest_run (
	id INTEGER PRIMARY KEY CHECK (id = 1),
	run_id TEXT NOT NULL,
	started_at TEXT NOT NULL,
	expires_at TEXT NOT NULL
);
```

## R2 keys

| Key | Content |
|---|---|
| `f/<sha256>` | A book file. Served with Range support |
| `c/<sha256>` | An original cover |
| `t/<sha256>` | Its 400 px WebP thumbnail (key = the original cover's hash) |
| `k/<sha256>` | A catalogue document |

Everything is immutable: a change makes a new key. Objects no book or catalogue refers to are
deleted at commit (FR-005). The last two catalogue versions are kept so a browser mid-fetch never
gets a 404.

## Catalogue document

The shared `LibrarySnapshot` (DR-0009) plus file lists, so the browser builds its `LibrarySource`
with the existing `createSnapshotLibrary`:

```ts
interface MirrorCatalog extends LibrarySnapshot {
	version: 1;
	/** Per book id, its stored formats. */
	files: Record<string, { format: string; sha256: string; size: number }[]>;
}
```

`Book.cover.url` is `/api/covers/<sha256>` (thumbnail). The book page asks for `?size=full`.

## Shared type changes

`BookSchema` (`packages/shared/src/library/types.ts`) gains two optional fields so FR-003 is met:
`sort` (Calibre's title sort) and `rating` (0 to 5, Calibre's 0 to 10 halved). Existing screens
ignore them; title ordering keeps its The/A/An rule unless `sort` is present.

`PeriodicalIssue.cover` already exists (2026-11-24).

## Rules and state

- **Book lifecycle:** absent → present (commit adds it) → updated (metadata or file hash changes)
  → removed (absent from the CLI's list at commit). Removal deletes the row and its `book_file`
  rows. The spec 002 AI rows for that id stay, so a re-added book keeps its genres.
- **Removal guard (FR-006):** a commit removing more than 10% of `book` rows is rejected unless it
  carries `confirmRemovals: true`. The CLI asks the owner first.
- **Consistency (FR-007):** a book row is written only by commit, and commit rejects any book
  whose cover or files have no `blob` row. So the mirror never lists a book with missing files.
- **Lock:** plan takes `ingest_run` if it is free or expired (default 2 hours). Commit and abort
  release it. Blob uploads must quote the current `run_id`.
- **Collection:** read from the Calibre custom column with label `collection`, as in DR-0009.
- **Reading progress:** none (specs 004 and 005). `status()` returns unread, as in local mode.
