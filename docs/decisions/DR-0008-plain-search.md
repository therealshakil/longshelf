# DR-0008: Plain library search in the browser

Status: **accepted** (owner, 2026-11-23).
Supersedes: the FTS5 search table in `docs/DESIGN.md`. Spec 002 FR-013 (plain-language search) stays parked.

## Context

AI search would have to compare each question with every book, which is likely over the 10 ms CPU
limit of the Workers Free plan. The owner parked it and asked for free, typo-tolerant search that
works well on mobile.

## Options

Checked 2026-11-23 on 631 real metadata records, locally, with 10 test searches.

| Option | Result | Verdict |
|---|---|---|
| PostgreSQL with `pg_trgm`, through Hyperdrive | Capable and free to start, but adds a second data provider and wake-up delay | Too many moving parts |
| SQLite FTS5 in D1 | No new dependency, but found 5 of 10, missing typos | Not fuzzy enough |
| **MiniSearch in the browser (chosen)** | Found 10 of 10, about 2 ms per search, works without the server | Chosen by the owner |

## Decision

- Use MiniSearch 7.2.0 (MIT, no dependencies, about 6 KB gzipped) in the browser.
- Index titles, authors and tags. Every search word must match, and words of four or more letters
  tolerate typos.
- The search route doesn't render on the server, so it uses no Worker CPU.

## Challenger

**Strongest case against:** every device builds its own index, and the library has had no release
since September 2025. **Ruling:** accepted. On the owner's iPad, a larger index with descriptions
took 118 ms for 700 books. The library is small, and search sits behind one module if it needs
replacing.

## Limits

- It matches words, not meaning.
- Descriptions are not searched. With them, 5,000 books took 27 s to build in Chrome slowed 6×.
- Offline search also needs the catalogue stored on the device, which arrives with the mirror work.

## Sources

- MiniSearch: https://github.com/lucaong/minisearch
- Workers limits: https://developers.cloudflare.com/workers/platform/limits/
- Measurements: `specs/002-redesign-and-ai/research.md`, R6
