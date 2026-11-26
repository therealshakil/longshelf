# Feature Specification: Richer library data from Open Library

**Feature Branch**: `006-open-library`

**Created**: 2026-11-26

**Status**: Draft (proposal; the owner locks)

**Input**: User description: "Enrich library data with Open Library. Scope from the owner ('add all of that'): (1) author details Calibre can't hold: birth/death dates, short bio, photo, other works not in the library; (2) first publication year of the work alongside the edition's year; (3) subjects as suggested tags for untagged books, cleaned of noise; (4) filling gaps in descriptions, publication year and publisher. Calibre is the source of truth, so book-level fills are suggestions written through calibredb only with owner confirmation, never silently. Lookups by ISBN where present, author by name with careful matching. Lookups happen in the longshelf CLI, results stored in the mirror; dev mode stays offline (DR-0009). Respect Open Library rate limits."

## Where we start

The owner's Calibre library has about 631 books and 367 authors (counted read-only on
2026-11-26). Every book has a cover. Gaps: 62 books have no description, 36 no publication
year, 39 no publisher, 152 no tags. 542 books carry an ISBN.

Calibre stores only a name for each author, and only the edition's date for each book, so a
2004 reprint of a 1818 novel shows 2004. Open Library holds author details and the work's
first publication year, and is free to query. Its limits: 1 request a second, or 3 a second
when the caller names itself with a contact
([Open Library API](https://openlibrary.org/developers/api)).

This was first tried in the owner's earlier prototype, readit, which matched authors by exact
name at page-view time. This spec moves the lookup to a deliberate, owner-run step.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Learn about an author (Priority: P1)

The owner opens an author from a book page. Beside the books they own, they see when the
author was born and died, a short bio, a photo, and a list of the author's other works that
are not in the library.

**Why this priority**: This is the one gain Calibre cannot give at all, since it has nowhere to
store author details. It adds something new without competing with Calibre.

**Independent Test**: Run the lookup for a library with one well-known author, publish, open
the author in the app, and see dates, bio, photo and other works. Turn off the network and
open the author again: the details are still there.

**Acceptance Scenarios**:

1. **Given** the owner has run the lookup and published, **When** they open an author who was
   matched, **Then** they see the details Open Library holds, each part shown only if present.
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

**Independent Test**: For a reprint with an ISBN, run the lookup, publish, and see both years
on the book page.

**Acceptance Scenarios**:

1. **Given** a book whose work was first published before its edition, **When** the owner
   opens it, **Then** both years show, clearly labelled.
2. **Given** both years are the same or the first year is unknown, **When** the owner opens
   it, **Then** one year shows, as today.

---

### User Story 3 - Review suggestions for gaps in Calibre (Priority: P3)

The owner runs a review step on their computer. It lists books with a missing description,
year, publisher or tags where Open Library has a value, shows each suggestion beside the
book, and lets the owner accept, skip, or edit each one. Accepted values are written to
Calibre, and reach the mirror at the next upload.

**Why this priority**: It helps, but Calibre's own metadata download already covers much of
this. It is also the only part that writes to Calibre, so it carries the most care.

**Independent Test**: In a copy of a test library with one book missing a description, run
the review, accept the suggestion, and see it in Calibre afterwards. Skip another and see
Calibre unchanged.

**Acceptance Scenarios**:

1. **Given** suggestions exist, **When** the owner runs the review, **Then** nothing is
   written to Calibre until they accept a specific suggestion.
2. **Given** the owner accepts a suggestion, **When** it is written, **Then** it goes through
   Calibre's own tools and only fills an empty field, never replacing one the owner set.
3. **Given** subjects from Open Library, **When** they are offered as tags, **Then** broad or
   noisy subjects (such as "Fiction, general" or "Accessible book") are left out.
4. **Given** the owner stops partway, **When** they run the review again, **Then** it resumes
   from the books not yet decided, and skipped books stay skipped.

---

### Edge Cases

- Two authors share a name, or one author has several spellings: no match is better than a
  wrong one (FR-004).
- A book has no ISBN (about 89 books): it is looked up by title and author only if the match
  is unambiguous, otherwise left alone.
- Open Library is slow, down or rate-limits the CLI: the lookup pauses and retries, then stops
  calmly and keeps what it has; running it again continues.
- An author's record changes on Open Library: the next lookup refreshes it.
- A bio contains HTML or markup: it shows as plain paragraphs, as descriptions do today.
- The owner removes a book from Calibre: its looked-up data leaves the mirror at the next
  upload, and an author with no books left stops being shown.
- Dev mode (`pnpm dev:calibre`): no lookups are made; it shows whatever the owner's last
  lookup saved locally, or nothing.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Lookups MUST happen only when the owner runs a command on their computer. The
  web app, the mirror and dev mode MUST NOT contact Open Library.
- **FR-002**: Before the first lookup, the command MUST say what will be sent (author names,
  ISBNs, titles for books without one) and to whom, and proceed only on the owner's yes.
  That consent is remembered.
- **FR-003**: Lookups MUST stay within Open Library's published rate limits and MUST identify
  the app by name, with a contact if the owner has set one.
- **FR-004**: An author MUST be matched only when the match is confident: by an identifier
  Calibre already holds, or by a work in the library that Open Library lists under that
  author. A name match alone MUST NOT be enough.
- **FR-005**: Lookups MUST be resumable and incremental: a second run fetches only what is new
  or older than a refresh period, and a stopped run loses nothing already fetched.
- **FR-006**: Looked-up author details and first-published years MUST be stored in the mirror
  alongside, and separate from, the data that comes from Calibre, and MUST be readable offline
  in the app like the rest of the catalogue.
- **FR-007**: Author photos MUST be copied into the mirror, so that viewing a page never sends
  the reader's browsing to a third party.
- **FR-008**: Every shown detail from Open Library MUST name its source with a link.
- **FR-009**: Book-level suggestions (description, year, publisher, tags) MUST only fill empty
  Calibre fields, MUST be written through Calibre's own tools, and MUST each be accepted by the
  owner. [NEEDS CLARIFICATION: does the owner want this review step in Longshelf at all, or
  would they rather fill these gaps with Calibre's built-in "Download metadata", which uses
  Google and Amazon and often has fuller descriptions?]
- **FR-010**: Subject suggestions MUST pass a noise filter, and MUST be offered as tags only,
  never added silently.
- **FR-011**: The public showcase library MUST NOT receive anything from this feature until a
  separate decision covers it.

### Key Entities

- **Author details**: an author in the library, the Open Library record it matched, how it was
  matched, birth and death dates, bio, photo, other works, and when it was fetched.
- **Work details**: a book in the library, the Open Library work it matched, the first
  published year, subjects, and when it was fetched.
- **Suggestion**: a book, a Calibre field that is empty, the suggested value, its source, and
  the owner's decision (pending, accepted, skipped).
- **Lookup consent**: whether the owner agreed to send data to Open Library, and when.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After one full lookup, at least 60% of the library's authors show details in the
  app. (Assumption: to be checked against the real library in the planning spike.)
- **SC-002**: In a hand check of 30 matched authors, none is the wrong person.
- **SC-003**: A first full lookup of the owner's library finishes in under 30 minutes, and a
  repeat run with nothing new finishes in under 1 minute.
- **SC-004**: With the network off, author details and first-published years open in the app
  as fast as the rest of the catalogue.
- **SC-005**: No Calibre field is changed without the owner accepting that change (checked by
  comparing the library before and after a review where everything is skipped).

## Assumptions

- The owner's "add all of that" is consent in principle to send author names and ISBNs to Open
  Library; FR-002 still asks once at the command line, so the choice is visible and recorded.
- No contact is sent by default; the lookup runs at the anonymous rate of 1 request a second.
  The owner can set a contact to go faster.
- Licence of Open Library data is unconfirmed: their FAQ asks for contributions under CC0, and
  one third-party source says CC-BY 4.0
  ([Open Library FAQ](https://openlibrary.org/help/faq/using),
  [Thoth wiki](https://github.com/thoth-pub/thoth/wiki/Open-Library)). For a private,
  single-owner mirror with attribution (FR-008), either is fine. To be confirmed in planning.
- Author photo rights vary by photo; copying them into a private mirror for the owner's own
  viewing is acceptable, and FR-011 keeps them off the public showcase.
- Adopt Before Building (constitution V): planning records a DR comparing Open Library with at
  least Wikidata and Google Books for author details, before any build.
- Author details extend the existing author page (`library/authors/[id]`) and book page. The
  new parts are mocked with public-domain authors and approved by the owner before UI code.
- Out of scope: new pages; changes to dev mode beyond reading saved results; any lookup on the
  public showcase.
