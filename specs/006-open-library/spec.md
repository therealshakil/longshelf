# Feature Specification: Richer library data from Open Library

**Feature Branch**: `006-open-library`

**Created**: 2026-11-26

**Status**: Locked (owner, 2026-11-26)

**Input**: User description: "Enrich library data with Open Library: author details Calibre can't hold (birth and death dates, short bio, photo, other works not in the library) and the first publication year of each work beside the edition's year. Gaps in Calibre's own fields are filled in Calibre with its built-in metadata download, not here (owner, 2026-11-26: option B). Author photos are kept (owner, 2026-11-26). The author service lives in the cloud: the app must not depend on the owner's laptop, which only syncs the library (owner, 2026-11-26)."

## Where we start

The owner's Calibre library has about 631 books and 367 authors (counted read-only on
2026-11-26). 542 books carry an ISBN.

Calibre stores only a name for each author, and only the edition's date for each book, so a
2004 reprint of a 1818 novel shows 2004. Open Library holds author details and each work's
editions, and answers lookups by ISBN
([Open Library API](https://openlibrary.org/developers/api)).

The mirror (spec 003) already runs in the cloud and receives the library from the owner's
computer. This spec has the mirror look up author details itself, so the owner's computer
keeps its one job: uploading the library.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Learn about an author (Priority: P1)

The owner opens an author from a book page. Beside the books they own, they see when the
author was born and died, a short bio, a photo, and a list of the author's other works that
are not in the library.

**Why this priority**: This is the one gain Calibre cannot give at all, since it has nowhere to
store author details. It adds something new without competing with Calibre.

**Independent Test**: Upload a library with one well-known author, wait for the mirror to fill
in their details, and open the author in the app: dates, bio, photo and other works show.
Turn off the network and open the author again: the details are still there.

**Acceptance Scenarios**:

1. **Given** the mirror has matched an author, **When** the owner opens them, **Then** they
   see the details Open Library holds, each part shown only if present.
2. **Given** an author who was not matched with confidence, **When** the owner opens them,
   **Then** the page looks as it does today, with no empty boxes or apology.
3. **Given** a matched author, **When** the owner views the other works, **Then** works
   already in the library are not listed again.
4. **Given** author details, **When** the page shows them, **Then** it names Open Library as
   the source with a link to the author's record there.

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
2. **Given** Open Library has been unreachable, **When** the owner opens Settings, **Then**
   they see a calm note that it will try again later, and nothing asks them to act.
3. **Given** the owner turns the service off, **When** they confirm, **Then** lookups stop and
   fetched details and photos are removed from the mirror.

---

### Edge Cases

- Two authors share a name, or one author has several spellings: no match is better than a
  wrong one (FR-004).
- A book has no ISBN (about 89 books): it is not looked up in this spec.
- An ISBN is unknown to Open Library: the book is left as it is and not retried until the
  refresh period passes.
- Open Library is slow, down or rate-limits the mirror: lookups pause and continue on a later
  run; nothing already fetched is lost.
- The owner's computer is off for weeks: lookups already queued still finish.
- A bio contains markup: it shows as plain paragraphs, as descriptions do today.
- The owner removes a book from Calibre: its looked-up data leaves the mirror at the next
  upload, and an author with no books left stops being shown.
- Dev mode (`pnpm dev:calibre`): shows no Open Library details and makes no requests.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Lookups MUST run in the mirror, started by uploads and by a schedule. They MUST
  NOT need the owner's computer or any device to be on. The owner's devices, the app's pages
  and dev mode MUST NOT contact Open Library.
- **FR-002**: Requests to Open Library MUST carry only ISBNs and Open Library's own record and
  photo IDs. Nothing about the owner or their reading is sent; the requests come from the
  mirror, not the owner's connection.
- **FR-003**: Lookups MUST stay within Open Library's published rate limits and MUST identify
  the app by name.
- **FR-004**: An author MUST be matched only through a book in the library: the book's ISBN
  leads to a work, and the Calibre author is paired with the work's author whose name agrees.
  A name match without a shared book MUST NOT count.
- **FR-005**: Lookups MUST be resumable and incremental: a book is looked up once, refreshed
  only after a refresh period, and an interrupted run continues on the next.
- **FR-006**: Author details and first-published years MUST be stored in the mirror alongside,
  and separate from, the data that comes from Calibre, and MUST be readable offline in the app
  like the rest of the catalogue.
- **FR-007**: Author photos MUST be copied into the mirror, so that viewing a page never
  contacts a third party. A photo already copied is not fetched again.
- **FR-008**: Every shown detail from Open Library MUST name its source with a link.
- **FR-009**: Settings MUST show the service's state (authors with details, books waiting, last
  run) and offer an off switch that stops lookups and removes fetched data, after a
  confirmation.
- **FR-010**: The feature MUST fit within the free allowances the mirror already uses, adding
  no fixed monthly cost.
- **FR-011**: Calibre MUST NOT be written to by this feature.
- **FR-012**: The public showcase library MUST NOT receive anything from this feature until a
  separate decision covers it.

### Key Entities

- **Author details**: an author in the library, the Open Library record it matched, the book
  it was matched through, birth and death dates, bio, photo, other works, and when it was
  fetched.
- **Work details**: a book in the library, the Open Library work it matched, the first
  published year, and when it was fetched.
- **Lookup queue**: books waiting for a lookup, with how many tries and when to try next.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Once the first fill is done, at least 60% of the library's authors show details
  in the app. (Assumption: to be checked against the real library in the planning spike.)
- **SC-002**: In a hand check of 30 matched authors, none is the wrong person.
- **SC-003**: The first fill of the owner's library finishes within a day of turning the
  service on, with the owner's computer switched off after the upload.
- **SC-004**: A newly uploaded book's details appear in the app within an hour.
- **SC-005**: Opening an author or book page makes no request outside the mirror.
- **SC-006**: The month after launch, the mirror's bill is unchanged.

## Assumptions

- About 2,300 requests fill the owner's library once (editions, works, authors, other works,
  photos); after that, a few a month. At 1 request a second this is about an hour of
  requests, spread across scheduled runs. (Estimate, to be checked in the spike.)
- Open Library sees ISBNs and Open Library IDs coming from the mirror. The owner judged this
  acceptable (2026-11-26).
- Considered and set aside (owner, 2026-11-26): matching against Open Library's monthly dumps
  on the owner's computer (ties the feature to the laptop), and hosting a trimmed copy of the
  dumps (a monthly 17.5 GB job to maintain).
- Licence of Open Library data is unconfirmed: their FAQ asks for contributions under CC0, and
  one third-party source says CC-BY 4.0
  ([Open Library FAQ](https://openlibrary.org/help/faq/using),
  [Thoth wiki](https://github.com/thoth-pub/thoth/wiki/Open-Library)). For a private,
  single-owner mirror with attribution (FR-008), either is fine. To be confirmed in planning.
- Photo rights vary by photo; copies stay in the private mirror for the owner's own viewing,
  and FR-012 keeps them off the public showcase.
- Adopt Before Building (constitution V): planning records a DR for the source and the cloud
  runner. Open Library is the owner's chosen source; the DR still notes Wikidata as a later
  supplement for photos.
- Author details extend the existing author page (`library/authors/[id]`), book page and
  Settings. The new parts are mocked with public-domain authors and approved by the owner
  before UI code.
- Out of scope: books without an ISBN; library sorting by first-published year; new pages;
  writing to Calibre; anything on the public showcase.
