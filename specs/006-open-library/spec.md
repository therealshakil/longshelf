# Feature Specification: Richer library data from Open Library

**Feature Branch**: `006-open-library`

**Created**: 2026-11-26

**Status**: Draft (proposal; the owner locks)

**Input**: User description: "Enrich library data with Open Library: author details Calibre can't hold (birth and death dates, short bio, photo, other works not in the library) and the first publication year of each work beside the edition's year. Gaps in Calibre's own fields (descriptions, years, publishers, tags) are filled in Calibre with its built-in metadata download, not here (owner, 2026-11-26: option B). Use Open Library's public data dumps, so nothing about the library is sent to Open Library (owner, 2026-11-26). Dev mode stays offline (DR-0009)."

## Where we start

The owner's Calibre library has about 631 books and 367 authors (counted read-only on
2026-11-26). 542 books carry an ISBN.

Calibre stores only a name for each author, and only the edition's date for each book, so a
2004 reprint of a 1818 novel shows 2004. Open Library holds author details and each work's
editions. It publishes its whole catalogue as monthly data dumps
([Open Library data dumps](https://openlibrary.org/developers/dumps)). The October 2026 dumps
are, compressed: authors 0.8 GB, works 4.1 GB, editions 12.6 GB (sizes read from the download
server on 2026-11-26).

This was first tried in the owner's earlier prototype, readit, which asked Open Library's API
about each author by name at page-view time. This spec instead matches the library against the
public dumps on the owner's computer.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Learn about an author (Priority: P1)

The owner opens an author from a book page. Beside the books they own, they see when the
author was born and died, a short bio, and a list of the author's other works that are not in
the library.

**Why this priority**: This is the one gain Calibre cannot give at all, since it has nowhere to
store author details. It adds something new without competing with Calibre.

**Independent Test**: Run the matching step for a library with one well-known author, publish,
open the author in the app, and see dates, bio and other works. Turn off the network and open
the author again: the details are still there.

**Acceptance Scenarios**:

1. **Given** the owner has run the matching step and published, **When** they open an author
   who was matched, **Then** they see the details Open Library holds, each part shown only if
   present.
2. **Given** an author who was not matched with confidence, **When** the owner opens them,
   **Then** the page looks as it does today, with no empty boxes or apology.
3. **Given** a matched author, **When** the owner views the other works, **Then** works
   already in the library are not listed again.
4. **Given** author details, **When** the page shows them, **Then** it names Open Library as
   the source with a link to the author's record there.

---

### User Story 2 - See when a book was first published (Priority: P2)

On a book page, the owner sees the year the work was first published beside the year of
their edition, when they differ. Library sorting by year can use the first-published year.

**Why this priority**: It corrects a quiet, common distortion (reprints showing as new) and
needs no change to Calibre.

**Independent Test**: For a reprint with an ISBN, run the matching step, publish, and see both
years on the book page.

**Acceptance Scenarios**:

1. **Given** a book whose work was first published before its edition, **When** the owner
   opens it, **Then** both years show, clearly labelled.
2. **Given** both years are the same or the first year is unknown, **When** the owner opens
   it, **Then** one year shows, as today.

---

### Edge Cases

- Two authors share a name, or one author has several spellings: no match is better than a
  wrong one (FR-004).
- A book has no ISBN (about 89 books): it is matched by title and author only if the match is
  unambiguous, otherwise left alone.
- The download is interrupted: running the step again continues it rather than starting over.
- The owner's computer is short of disk space: the step says how much it needs before it
  starts, and stops calmly without leaving half-written files.
- A newer monthly dump exists: nothing happens until the owner runs the step again.
- A bio contains markup: it shows as plain paragraphs, as descriptions do today.
- The owner removes a book from Calibre: its matched data leaves the mirror at the next
  upload, and an author with no books left stops being shown.
- Dev mode (`pnpm dev:calibre`): it shows whatever the owner's last matching step saved
  locally, or nothing, and makes no network requests.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Matching MUST run only when the owner runs a command on their computer. The web
  app, the mirror and dev mode MUST NOT contact Open Library.
- **FR-002**: Nothing that identifies a book or author in the library MUST be sent to Open
  Library or the Internet Archive. Data comes only from downloading the public dumps whole.
- **FR-003**: The matching step MUST keep only the records that match the library. The full
  dumps MUST NOT be kept after a run unless the owner asks to keep them.
- **FR-004**: An author MUST be matched only when the match is confident: by an identifier
  Calibre already holds, or by a work in the library that Open Library lists under that
  author. A name match alone MUST NOT be enough.
- **FR-005**: The step MUST be resumable: an interrupted download or match continues on the
  next run, and a run with no new dump and no new books does no download.
- **FR-006**: Matched author details and first-published years MUST be stored in the mirror
  alongside, and separate from, the data that comes from Calibre, and MUST be readable offline
  in the app like the rest of the catalogue.
- **FR-007**: Every shown detail from Open Library MUST name its source with a link.
- **FR-008**: Author photos MUST NOT be fetched one by one, since a per-author request would
  reveal which authors are in the library (FR-002). Photos are left out of this spec.
- **FR-009**: Calibre MUST NOT be written to by this feature.
- **FR-010**: The public showcase library MUST NOT receive anything from this feature until a
  separate decision covers it.

### Key Entities

- **Author details**: an author in the library, the Open Library record it matched, how it was
  matched, birth and death dates, bio, other works, and which dump it came from.
- **Work details**: a book in the library, the Open Library work it matched, the first
  published year, and which dump it came from.
- **Dump state**: which monthly dump was last used, and how far an interrupted run got.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After one full run, at least 60% of the library's authors show details in the
  app. (Assumption: to be checked against the real library in the planning spike.)
- **SC-002**: In a hand check of 30 matched authors, none is the wrong person.
- **SC-003**: A run with nothing new finishes in under 1 minute. A full run's time is measured
  in the planning spike and recorded, since it depends on the owner's connection.
- **SC-004**: With the network off, author details and first-published years open in the app
  as fast as the rest of the catalogue.
- **SC-005**: During a run, a network capture shows requests only for the dump files, and none
  carrying a book title, ISBN or author name.
- **SC-006**: After a run, the matched data the owner's computer keeps is under 50 MB.
  (Assumption: to be checked in the spike.)

## Assumptions

- Gaps in Calibre's own fields are the owner's to fill with Calibre's built-in "Download
  metadata" (owner, 2026-11-26), so this feature never writes to Calibre.
- A full run downloads about 17.5 GB. It is run by hand, at most monthly; how often is the
  owner's choice, and a stale dump only means slightly older author details.
- Licence of Open Library data is unconfirmed: their FAQ asks for contributions under CC0, and
  one third-party source says CC-BY 4.0
  ([Open Library FAQ](https://openlibrary.org/help/faq/using),
  [Thoth wiki](https://github.com/thoth-pub/thoth/wiki/Open-Library)). For a private,
  single-owner mirror with attribution (FR-007), either is fine. To be confirmed in planning.
- Author photos may come back in a later spec if a way exists to get them without a
  per-author request (for example, a bulk archive).
- Adopt Before Building (constitution V): planning records a DR comparing Open Library's dumps
  with at least Wikidata's dumps for author details, before any build.
- Author details extend the existing author page (`library/authors/[id]`) and book page. The
  new parts are mocked with public-domain authors and approved by the owner before UI code.
- Out of scope: new pages; writing to Calibre; changes to dev mode beyond reading saved
  results; anything on the public showcase.
