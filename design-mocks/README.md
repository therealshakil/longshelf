# Design mocks

Static HTML mocks for design review with Impeccable live mode. Not app code.

**Status: approved reference (owner sign-off 2026-11-23).** The built app and `apps/web/DESIGN.md` are now the source of truth. The "Mock state" links are review controls, not product UI, and `pnpm design:compare` hides them. The mocks predate the Longshelf name.

Serve from the repo root with `apps/web/node_modules/.bin/vite design-mocks --port 8411 --strictPort --host 127.0.0.1` and open http://127.0.0.1:8411/. Vite reloads the page when an HTML file changes and swaps `styles.css` in place.

## Sample data

Titles, authors and covers come from [Standard Ebooks](https://standardebooks.org/), whose
text and cover art are in the U.S. public domain and whose own work is dedicated to the public
domain (source: https://standardebooks.org/about). Fetched 2026-11-18 from the popularity
listing; `se-books.json` links each book to its page.

Collections, reading progress, dates, suggestions and genre counts are invented for the mock.

Author photo: `authors/jane-austen.jpg`, Cassandra Austen’s sketch of Jane Austen (about 1810), public domain per Wikimedia Commons (https://commons.wikimedia.org/wiki/File:CassandraAusten-JaneAusten(c.1810)_hires.jpg); Commons notes that a third party has made copyright claims over reproductions. Biography text is a short summary written for the mock.
