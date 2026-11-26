# Feature Specification: Author details and first-published years for the real library

**Feature Branch**: `006-open-library`

**Created**: 2026-11-26

**Status**: Locked (owner, 2026-11-27; amended to follow DR-0005)

**Input**: User description: "Enrich library data with Open Library: author details Calibre can't hold (birth and death dates, short bio, photo, other works not in the library) and the first publication year of each work beside the edition's year. Gaps in Calibre's own fields are filled in Calibre with its built-in metadata download, not here (owner, 2026-11-26: option B). Author photos are kept (owner, 2026-11-26). The author service lives in the cloud: the app must not depend on the owner's laptop, which only syncs the library (owner, 2026-11-26)." Amended (owner, 2026-11-26): author content keeps DR-0005's sources (Wikipedia and Wikidata); Open Library is used to match authors through the owner's books and for first-published years.

## Where we start

The owner's Calibre library has about 631 books and 367 authors (counted read-only on
2026-11-26). 542 books carry an ISBN.

The author page already exists (spec 002) and follows DR-0005: a Wikipedia bio, a
free-licensed Wikipedia photo with its credit, life dates and notable works from Wikidata
marked against the library. It works on the 67 sample authors, whose data was gathered by
hand. Real Calibre authors have no lookup yet (JOURNAL, 2026-11-21).

Calibre stores only a name for each author, and only the edition's date for each book, so a
2004 reprint of a 1818 novel shows 2004. Open Library answers lookups by ISBN, links each
edition to its work and authors, and its author IDs appear on Wikidata entries
([Open Library API](https://openlibrary.org/developers/api),
[Wikidata WikiProject Books](https://www.wikidata.org/wiki/Wikidata:WikiProject_Books)).

The mirror (spec 003) already runs in the cloud and receives the library from the owner's
computer. This spec has the mirror look up author details itself, so the owner's computer
keeps its one job: uploading the library.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Learn about an author (Priority: P1)

The owner opens an author from a book page. Beside the books they own, they see the author
page as designed: when the author was born and died, a short bio, a photo, and the author's
notable works, marking which ones are in the library.

**Why this priority**: The page is built but empty for every real author. This fills it, and
Calibre cannot, since it has nowhere to store author details.

**Independent Test**: Upload a library with one well-known author, wait for the mirror to fill
in their details, and open the author in the app: dates, bio, photo and notable works show,
each with its source. Turn off the network and open the author again: the details are still
there.

**Acceptance Scenarios**:

1. **Given** the mirror has matched an author, **When** the owner opens them, **Then** they
   see the details the sources hold, each part shown only if present.
2. **Given** an author who was not matched with confidence, **When** the owner opens them,
   **Then** the page looks as it does today, with no empty boxes or apology.
3. **Given** a matched author, **When** the owner views the notable works, **Then** works in
   the library are marked as theirs.
4. **Given** author details, **When** the page shows them, **Then** each part names its source
   as DR-0005 sets out: the bio with Wikipedia's licence and a link, the photo with its credit
   and licence, and the notable works as from Wikidata.

---

### User Story 2 - See when a book was first published (Priority: P2)

On a book page, the owner sees the year the work was first published beside the year of
their edition, when they differ.

**Why this priority**: It corrects a quiet, common distortion (reprints showing as new) and
needs no change to Calibre.

**Independent Test**: Upload a reprint with an ISBN, wait for its details, and see both years
on the book page.

**Acceptance Scenarios**:

1. **Given** a book whose work was first published before its edition, **When** the owner
   opens it, **Then** both years show, clearly labelled.
2. **Given** both years are the same or the first year is unknown, **When** the owner opens
   it, **Then** one year shows, as today.

---

### User Story 3 - Glance at the author service (Priority: P3)

In Settings, the owner sees how the author service is doing: how many authors have details,
when it last ran, and how many books are still waiting. They can turn it off, which stops
lookups and removes what it fetched, and turn it on again later.

**Why this priority**: The service works on its own in the cloud, so this is the one place the
owner can see it and stay in charge of it.

**Independent Test**: After an upload, open Settings and see books waiting; later, see them
done. Turn the service off, see author details leave the app, turn it on, see them return.

**Acceptance Scenarios**:

1. **Given** lookups are in progress, **When** the owner opens Settings, **Then** they see
   plain counts (done, waiting) and when it last ran, with no progress pressure.
2. **Given** a source has been unreachable, **When** the owner opens Settings, **Then** they
   see a calm note that it will try again later, and nothing asks them to act.
3. **Given** the owner turns the service off, **When** they confirm, **Then** lookups stop and
   fetched details and photos are removed from the mirror.

---

### Edge Cases

- Two authors share a name, or one author has several spellings: no match is better than a
  wrong one (FR-004).
- A book has no ISBN (about 89 books): it is not looked up in this spec. Its author can still
  be matched through another of their books that has one.
- An ISBN is unknown to Open Library, or the author has no Wikidata entry: the author keeps
  the simpler page, and is not retried until the refresh period passes.
- The Wikipedia photo has no clear free licence: no photo is shown (DR-0005).
- A source is slow, down or rate-limits the mirror: lookups pause and continue on a later run;
  nothing already fetched is lost.
- The owner's computer is off for weeks: lookups already queued still finish.
- The owner removes a book from Calibre: its looked-up data leaves the mirror at the next
  upload, and an author with no books left stops being shown.
- Dev mode (`pnpm dev:calibre`): shows no looked-up details and makes no requests.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Lookups MUST run in the mirror, started by uploads and by a schedule. They MUST
  NOT need the owner's computer or any device to be on. The owner's devices, the app's pages
  and dev mode MUST NOT contact any source.
- **FR-002**: Requests MUST carry only ISBNs and the sources' own IDs and article names. Nothing
  about the owner or their reading is sent; the requests come from the mirror, not the
  owner's connection.
- **FR-003**: Lookups MUST stay within each source's published rate limits and MUST identify
  the app by name.
- **FR-004**: An author MUST be matched only through a book in the library: the book's ISBN
  leads to an Open Library work, the Calibre author is paired with the work's author whose
  name agrees, and that Open Library author ID leads to the Wikidata entry. A name match
  without a shared book MUST NOT count.
- **FR-005**: Author content MUST follow DR-0005: bio from Wikipedia's introduction, photo
  from Wikipedia's lead image only with a clear free licence, life dates and notable works
  from Wikidata, with DR-0005's date sanity rule for notable works.
- **FR-006**: First-published years MUST come from the Open Library work.
- **FR-007**: Lookups MUST be resumable and incremental: a book is looked up once, refreshed
  only after a refresh period, and an interrupted run continues on the next.
- **FR-008**: Author details and first-published years MUST be stored in the mirror alongside,
  and separate from, the data that comes from Calibre, and MUST be readable offline in the app
  like the rest of the catalogue.
- **FR-009**: Author photos MUST be copied into the mirror with their credit and licence, so
  that viewing a page never contacts a third party.
- **FR-010**: Settings MUST show the service's state (authors with details, books waiting, last
  run) and offer an off switch that stops lookups and removes fetched data, after a
  confirmation.
- **FR-011**: The feature MUST fit within the free allowances the mirror already uses, adding
  no fixed monthly cost.
- **FR-012**: Calibre MUST NOT be written to by this feature.
- **FR-013**: The public showcase library MUST NOT receive anything from this feature until a
  separate decision covers it.

### Key Entities

- **Author details**: an author in the library, the book it was matched through, its Open
  Library and Wikidata IDs, birth and death dates, bio with source, photo with credit and
  licence, notable works, and when it was fetched.
- **Work details**: a book in the library, the Open Library work it matched, the first
  published year, and when it was fetched.
- **Lookup queue**: books waiting for a lookup, with how many tries and when to try next.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Once the first fill is done, at least 60% of the library's authors show details
  in the app. (Assumption: the sample authors were all public domain; coverage of living
  authors is checked against the real library in the planning spike.)
- **SC-002**: In a hand check of 30 matched authors, none is the wrong person.
- **SC-003**: The first fill of the owner's library finishes within a day of turning the
  service on, with the owner's computer switched off after the upload.
- **SC-004**: A newly uploaded book's details appear in the app within an hour.
- **SC-005**: Opening an author or book page makes no request outside the mirror.
- **SC-006**: The month after launch, the mirror's bill is unchanged.

## Assumptions

- DR-0005 stands for author content. This spec adds Open Library as the way to match authors
  through the owner's books, and as the source of first-published years. Planning records this
  as an update to DR-0005, and a DR for the cloud runner.
- About 2,500 requests fill the owner's library once, across the three sources; after that, a
  few a month. (Estimate, to be checked in the spike.)
- The sources see ISBNs, IDs and article names coming from the mirror. The owner judged this
  acceptable (2026-11-26).
- Licences, from DR-0005: Wikipedia text is CC BY-SA 4.0, shown with a link; photos are used
  only with a clear free licence, shown with their credit. Open Library supplies IDs and years
  only.
- Considered and set aside (owner, 2026-11-26): matching against Open Library's monthly dumps
  on the owner's computer (ties the feature to the laptop), and hosting a trimmed copy of the
  dumps (a monthly 17.5 GB job to maintain). Open Library as the source of bios and photos was
  set aside by DR-0005.
- Author details fill the existing author page (`library/authors/[id]`); the first-published
  year and the Settings status are new parts of the book page and Settings, mocked with
  public-domain data and approved by the owner before UI code.
- Out of scope: the full bibliography (on hold in DR-0005); books without an ISBN; library
  sorting by first-published year; new pages; writing to Calibre; anything on the public
  showcase.
