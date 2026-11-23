-- Books the genre job has checked, including those that got no new genre, so a rerun doesn't pay
-- for them again (spec 002 T058).
CREATE TABLE genre_checked (
	book_id TEXT PRIMARY KEY,
	model TEXT NOT NULL,
	checked_at TEXT NOT NULL
);
