-- Spec 004 reading places (specs/004-reading/data-model.md). Additive only.
-- One place per book and device; the latest read_at wins (FR-011). No foreign key to book:
-- a place outlives a book that has left the library.
CREATE TABLE reading_place (
	book_id TEXT NOT NULL,
	device_id TEXT NOT NULL,
	device_name TEXT NOT NULL,
	percent REAL NOT NULL,
	chapter_label TEXT NOT NULL,
	href TEXT NOT NULL,
	fraction REAL NOT NULL,
	cfi TEXT,
	file_sha256 TEXT,
	furthest_percent REAL NOT NULL,
	furthest_href TEXT NOT NULL,
	read_at TEXT NOT NULL,
	received_at TEXT NOT NULL,
	PRIMARY KEY (book_id, device_id)
);
