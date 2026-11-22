-- Each book's closest matches, built outside the Worker because comparing every pair is too much
-- CPU for a request (research R6). neighbours: JSON [[bookId, score], ...], best first.
-- copies: JSON [bookId, ...] of other records of the same work, or NULL when there are none.
CREATE TABLE book_neighbours (
	book_id TEXT PRIMARY KEY,
	model TEXT NOT NULL,
	neighbours TEXT NOT NULL,
	copies TEXT
);
CREATE INDEX book_neighbours_copies ON book_neighbours (book_id) WHERE copies IS NOT NULL;
