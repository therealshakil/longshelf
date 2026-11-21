# DR-0005: Where author bios, photos and bibliographies come from

Status: **accepted** (owner, 2026-11-21). The author page design was approved the same day.
Refines: spec 002 ("Biographies, bibliographies and portraits come from public sources")

## Context

The approved author page shows a bio, photo, life dates and bibliography, but only one of the 67
sample authors had that data. The real library needs an automatic source.

## Options

Checked 2026-11-21 on the public-domain sample authors.

| Option | Result | Verdict |
|---|---|---|
| Open Library only | Of 10 authors that answered: 4 bios, 5 photos, 1 wrong person. No licence stated for photos | Too sparse for bios and photos |
| Wikipedia and Wikidata only | 66 of 67 matched, 65 photos, 62 with a clear free licence. About 3 notable works per author | Strong, but no full bibliography |
| Calibre author notes | Private, but empty unless filled in by hand | Not enough on its own |
| **Combined (chosen)** | Each source used for what it does best | Chosen by the owner |

## Decision

- **Bio:** the Wikipedia article's introduction, with a link to its source.
- **Photo:** the Wikipedia lead image, only with a clear free licence, shown with its credit.
- **Life dates and notable works:** Wikidata.
- **Full bibliography: on hold.** See the update below.
- Each author is fetched once and stored. An author with no match keeps the simpler page.

## Update: full bibliography held back (2026-11-21)

Open Library works were found through the Open Library ID on each author's Wikidata entry, then
cleaned automatically. Across 66 authors, 179,966 raw works became 3,667 entries. A hand review of
50 random entries found about a third wrong: translations, collections, misattributed books and
misspelled duplicates. 47% had no trustworthy date. More title rules would not fix unreliable
records, so this source is rejected for now, as the challenger ruling below allows.

Next test: Wikidata literary works, excluding editions, on the same authors with the same 50-entry
review. It is untested because the Wikidata Query Service was rate-limiting during an outage. If
it fails, the page links to the author's Open Library page instead of showing a list.

Notable works are shown now. A Wikidata year is hidden if it is under 12 years after the author's
birth or over 100 years after their death. Wikipedia text is CC BY-SA 4.0, and only photos with a
clear free licence are used, each with its credit and licence.

## Challenger

Strongest case against: "Three sources is more moving parts than a single-user app should carry,
and Ribbon's first principle is easy maintenance. Open Library's data is noisy enough that a full
bibliography may never be trustworthy. Wikipedia alone would be simpler."

Ruling: the owner wants both notable works and a full bibliography, and only Open Library offers
the second. The cost is contained: all three are optional, a failed source only hides its section,
and the page says bibliography data can be incomplete. If the cleaning results are poor, the full
bibliography is the part to drop.

## Privacy and cost

Wikipedia, Wikidata and Open Library see the author names being looked up, but no reading data.
All three are free, with no account or recurring cost. Open Library's web APIs are for low-volume
use, so requests are paced.

## Sources (read 2026-11-21)

- Open Library APIs — https://openlibrary.org/developers/api
- Open Library Covers API — https://openlibrary.org/dev/docs/api/covers
- Wikimedia REST API — https://en.wikipedia.org/api/rest_v1/
- Wikidata Query Service — https://query.wikidata.org/
