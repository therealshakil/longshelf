-- Spec 003 library mirror (specs/003-library-mirror/data-model.md, DR-0010). Additive only.
-- Book ids are Calibre book UUIDs, the same ids the spec 002 AI tables use.

-- One row per Calibre book, news issues included. metadata = the shared Book shape as JSON.
CREATE TABLE book (
	id TEXT PRIMARY KEY,
	metadata TEXT NOT NULL,
	metadata_hash TEXT NOT NULL,
	cover_sha256 TEXT,
	is_news INTEGER NOT NULL DEFAULT 0,
	updated_at TEXT NOT NULL
);

-- One row per format of a book. A file's R2 key is its SHA-256.
CREATE TABLE book_file (
	book_id TEXT NOT NULL REFERENCES book(id) ON DELETE CASCADE,
	format TEXT NOT NULL,
	sha256 TEXT NOT NULL,
	size INTEGER NOT NULL,
	PRIMARY KEY (book_id, format)
);
CREATE INDEX book_file_sha ON book_file (sha256);

-- Every object stored in R2. A row exists only after the object is fully stored.
CREATE TABLE blob (
	sha256 TEXT PRIMARY KEY,
	kind TEXT NOT NULL CHECK (kind IN ('file', 'cover', 'thumb', 'catalog')),
	size INTEGER NOT NULL,
	stored_at TEXT NOT NULL
);

-- The catalogue the browser downloads. One row, replaced at each commit; the previous one is
-- kept so a browser mid-fetch never gets a 404.
CREATE TABLE catalog (
	id INTEGER PRIMARY KEY CHECK (id = 1),
	sha256 TEXT NOT NULL,
	previous_sha256 TEXT,
	book_count INTEGER NOT NULL,
	committed_at TEXT NOT NULL
);

-- One upload run at a time. Expires so a crashed run doesn't block forever.
CREATE TABLE ingest_run (
	id INTEGER PRIMARY KEY CHECK (id = 1),
	run_id TEXT NOT NULL,
	started_at TEXT NOT NULL,
	expires_at TEXT NOT NULL
);
