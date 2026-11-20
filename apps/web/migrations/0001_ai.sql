-- Spec 002 AI tables (specs/002-redesign-and-ai/data-model.md). Plain SQL, no ORM.

-- Suggested genres per book. States: suggested -> promoted -> in_calibre;
-- suggested -> removed; promoted -> removed. Removed rows stay as tombstones so the same genre
-- isn't suggested again. Promotion is applied to Calibre by the ribbon CLI (spec 003).
CREATE TABLE genre_suggestion (
	book_id TEXT NOT NULL,
	genre TEXT NOT NULL,
	state TEXT NOT NULL CHECK (state IN ('suggested', 'promoted', 'in_calibre', 'removed')),
	model TEXT NOT NULL,
	created_at TEXT NOT NULL,
	state_at TEXT NOT NULL,
	PRIMARY KEY (book_id, genre)
);

-- One summary per chapter the owner has passed; recaps are built only from these (FR-011).
CREATE TABLE chapter_summary (
	book_id TEXT NOT NULL,
	href TEXT NOT NULL,
	chapter_label TEXT NOT NULL,
	ordinal INTEGER NOT NULL,
	summary TEXT NOT NULL,
	model TEXT NOT NULL,
	created_at TEXT NOT NULL,
	PRIMARY KEY (book_id, href)
);

-- Last recap per book, keyed by the cut-off it was built to.
CREATE TABLE recap (
	book_id TEXT PRIMARY KEY,
	upto_href TEXT NOT NULL,
	upto_percent REAL NOT NULL,
	text TEXT NOT NULL,
	model TEXT NOT NULL,
	created_at TEXT NOT NULL
);

-- Text-profile embedding per book, for similarity and plain-language search.
CREATE TABLE book_embedding (
	book_id TEXT PRIMARY KEY,
	profile_hash TEXT NOT NULL,
	vector BLOB NOT NULL,
	model TEXT NOT NULL,
	created_at TEXT NOT NULL
);

-- The owner's dismissals of suggestions (FR-010). until NULL = never suggest again.
CREATE TABLE suggestion_dismissal (
	book_id TEXT PRIMARY KEY,
	kind TEXT NOT NULL CHECK (kind IN ('not_now', 'never')),
	until TEXT
);

-- Spend guard (FR-017): estimated neurons per UTC day.
CREATE TABLE ai_usage (
	day TEXT PRIMARY KEY,
	neurons_est REAL NOT NULL DEFAULT 0,
	calls INTEGER NOT NULL DEFAULT 0
);

-- The owner's AI settings: the off switch (FR-016) and the daily ceiling (FR-017).
CREATE TABLE ai_setting (
	key TEXT PRIMARY KEY,
	value TEXT NOT NULL
);
