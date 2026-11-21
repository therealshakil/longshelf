# Feature Specification: Redesigned screens and AI features

**Feature Branch**: `redesign-impeccable`

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "Build the approved redesign (Home, Story so far, Library with
author and shelf pages, book page, reader) and the AI features (Read next, genres, Story so far,
Ask your library, More like this) together, matching the approved design."

## Context

The design was approved by the owner on 2026-11-18 after live review
([DR-0002](../../docs/decisions/DR-0002-redesign-impeccable.md)). The approved composition for
each screen is the static mock in [`design-mocks/`](../../design-mocks/README.md), and the
direction contracts are in `apps/web/.impeccable/surfaces/`. The AI features and their honesty
rules are recorded in [DR-0003](../../docs/decisions/DR-0003-ai-features.md).

This spec builds the screens and the AI features into the app. It sits on spec 001's
foundation: tokens, the catalogue, and the accessibility floor. The real library mirror, offline
reading and Kobo progress come from later specs (see Dependencies). Until those exist, every
screen runs on a licence-free sample library, so the screens can be reviewed and tested now and
take real data later without being redesigned.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pick up where I left off (Priority: P1)

The owner opens Ribbon and sees the book they read last, large, with where they are on this
device and on the Kobo and when they last read it. They resume with one tap. The other books
they are partway through sit below in a calm list. Each row resumes its book, and the list
shows progress here and on the Kobo.

**Why this priority**: Resuming reading is the main reason to open Ribbon. Every other screen
is secondary.

**Independent Test**: With the sample library, open Home and resume the current book and one
other book in progress. Each opens in the reader at the stored place.

**Acceptance Scenarios**:

1. **Given** at least one book in progress, **When** the owner opens Home, **Then** the most
   recently read book is shown first with its progress, chapter, the other device's progress (if
   known) and the last-read time, plus a single "Continue reading" action.
2. **Given** three other books in progress, **When** Home is shown, **Then** each appears as a
   row with cover, title, author, progress and chapter. The whole row opens the book in the
   reader.
3. **Given** no book in progress, **When** Home is shown, **Then** it skips the current-book
   area and starts with suggestions, with no empty boxes.
4. **Given** a phone-width screen, **When** Home is shown, **Then** the current book and all
   books in progress (up to four) are visible without horizontal scrolling.

---

### User Story 2 - Read comfortably (Priority: P1)

The owner reads in a page that looks typeset rather than rendered. Controls stay out of the way
until a tap in the middle of the page brings them back. One panel adjusts text size, font, line
spacing, margins, scroll or page turning, and theme, including a darker Night theme. Contents
jumps to a chapter. When the Kobo is further on, the top bar says so and offers to go there.

**Why this priority**: The owner ranked the reader as the most important surface.

**Independent Test**: Open a sample book, read a chapter, hide and show the bars, change every
text setting, switch to Night, jump via Contents, and act on a "Kobo is further on" notice.

**Acceptance Scenarios**:

1. **Given** a book open in the reader, **When** the owner taps the middle third of the page,
   **Then** the top and bottom bars hide. A second tap shows them. Taps on the left and right
   edges are left for page turns.
2. **Given** the text panel, **When** the owner changes any setting, **Then** the page updates
   at once, and the setting applies to every book on that device.
3. **Given** the Kobo position is further on than this device, **When** the book opens, **Then**
   the top bar shows "Kobo is further on" with the chapter and percentage, plus "Go there" and
   "Stay". Nothing covers the text.
4. **Given** the owner's system asks for reduced motion, **When** the bars hide or show, **Then**
   they change without sliding.

---

### User Story 3 - Find a book in the library (Priority: P2)

The owner browses the library by what arrived recently, by author, by genre, by collection,
by news and magazines, or by title. Each book shows its read status at a glance. They open an
author to see a short biography and bibliography, a collection or genre to see its books, or a
book to see its page with description, progress and actions.

**Why this priority**: Finding the next thing to read matters, but less than resuming and
reading.

**Independent Test**: In the sample library, reach a given book by each route (recently added,
author, genre, collection, all books) and open its book page.

**Acceptance Scenarios**:

1. **Given** the Library page, **When** it opens, **Then** the tabs read, in order: Recently
   added (selected), Authors, Genres, Collections, News & magazines, All Books.
2. **Given** any book shown anywhere, **Then** its status reads: nothing if unread, "N% read"
   if in progress, "Finished" if finished.
3. **Given** All Books, **When** the owner drags along the letter rail, **Then** the list jumps
   to each letter as the pointer passes it. Letters with no books are skipped. The rail also
   works by keyboard and single taps.
4. **Given** an author page, **Then** it shows the portrait (if one is available), life dates, a
   short biography with its source, the author's books in the library, and a bibliography that
   marks owned and not-owned titles.
5. **Given** a book page, **Then** it shows cover, title, author, publication line, the
   progress table, Continue reading, the download state, Story so far, description, genres,
   details and "More like this".

---

### User Story 4 - Recall the story so far (Priority: P2)

After time away from a book, the owner opens a spoiler-safe recap of everything up to where
they stopped. The recap opens from the book's row on Home, from the book page and from the
reader.

**Why this priority**: It removes the main barrier to returning to a long book after a break,
which matters for an owner who reads several books at once.

**Independent Test**: For a sample book read to a known chapter, open Story so far and check
that the recap covers that chapter and nothing beyond it.

**Acceptance Scenarios**:

1. **Given** the owner has not opened a book for 7 or more days, **When** Home is shown,
   **Then** that book's row offers "Away N days · Story so far".
2. **Given** a recap is requested, **Then** it states its cut-off ("Up to Chapter 23 · 12%"),
   is written only from text before the owner's furthest position, and ends with a plain note
   that it was written by AI and may get details wrong.
3. **Given** the recap cannot be produced, **Then** the panel says why: still writing, offline
   or unavailable, or too early (under 5% read). Reading is never blocked.

---

### User Story 5 - Get suggestions from my own library (Priority: P3)

Home suggests up to 12 books to read next, and each book page suggests similar books. Every
suggestion comes from the owner's own library and gives its reason. The owner can dismiss a
suggestion for now or for good.

**Why this priority**: Useful once the core reading flows are solid.

**Independent Test**: In the sample library, check that every suggestion has a reason, that
none of them are finished or in progress, and that a dismissed book leaves the list.

**Acceptance Scenarios**:

1. **Given** Read next, **Then** every suggestion shows a one-line reason and is a book in the
   owner's library that is neither finished nor in progress.
2. **Given** "Never suggest" on a book, **Then** it does not appear in Read next or More like
   this again until the owner undoes it.

---

### User Story 6 - Browse and keep genres (Priority: P3)

Every book gets suggested genres, which the owner can browse at once. On a book page or in a
review view, the owner promotes the genres they agree with into the Calibre library, or removes
wrong ones.

**Why this priority**: It adds a browse route that the owner's sparse collections don't cover.
It depends on suggestions existing.

**Independent Test**: Browse a genre and promote one suggested genre. After the next sync,
confirm it appears in the Calibre library's genres and is no longer marked suggested.

**Acceptance Scenarios**:

1. **Given** a book page, **Then** genres already in Calibre show as plain chips and suggested
   ones as outlined chips with "Promote" and "Remove".
2. **Given** a promoted genre, **When** the next desktop sync runs, **Then** it is written to
   the Calibre library through Calibre's own tools, never by editing the database directly.
   Until then it shows as waiting for sync.
3. **Given** the owner's hand-made collections, **Then** genre features never change them.

---

### User Story 7 - Ask the library in plain words (Priority: P3)

The search field also accepts requests such as "something short set at sea". Results say why
each book matched. Exact title and author searches work as before.

**Why this priority**: Convenient, but exact search already covers the need.

**Independent Test**: Run three plain-language requests and three exact searches on the sample
library. Every result carries a reason, and the exact searches return the expected book first.

**Acceptance Scenarios**:

1. **Given** a plain-language request, **Then** each result shows why it matched.
2. **Given** AI is unavailable, **Then** the search falls back to exact matching and says so in
   one line.

---

### User Story 8 - News and magazines (Priority: P3)

Issues that Calibre fetches automatically appear in their own Library tab, one row per
publication with issues newest first. They also appear in a "Latest news & magazines" row at
the bottom of Home. They never flood Recently added.

**Independent Test**: With sample periodicals, confirm they appear only in the news tab and the
Home row, newest issue first, with new issues marked.

**Acceptance Scenarios**:

1. **Given** 14 issues fetched on one day, **When** Recently added is shown, **Then** none of
   them appear there.

---

### Edge Cases

- Books without a cover show a plain binding with the title. Books without an author sort last
  and show "Unknown author".
- Very long titles wrap to two lines and end with an ellipsis. Nothing overflows its column.
- A book that is in progress on the Kobo only appears in Also reading with that progress.
- Six or more books in progress: Home shows the five most recent; the rest are reachable from
  the Library.
- AI output that fails or is low quality: the feature hides itself (suggestions) or says it is
  unavailable (recap). It never shows an error in place of content.
- An author with no public biography or portrait shows name, dates if known, and their books
  only.
- Offline: every screen still works from what is stored. AI features say they need a
  connection.

## Requirements *(mandatory)*

### Functional Requirements

**Screens (match the approved design)**

- **FR-001**: Each screen MUST match its approved mock in `design-mocks/` in arrangement,
  type, colour and density at desktop, tablet and phone widths, in light and dark. The reader
  MUST also match in Night. The mock's review-only chrome (dashed "Mock state" switches) is
  excluded.
- **FR-002**: Home MUST show the current book, the Also reading list, Read next, a link to the
  library, and Latest news & magazines, in that order.
- **FR-003**: The Library MUST offer the six tabs of User Story 3, in that order, plus author,
  shelf (collection or genre) and book pages.
- **FR-004**: The reader MUST provide: tap-to-hide bars; a text panel (size, font, line spacing,
  margins, scroll or turn pages, theme: match system, Paper or Night); contents; bookmarks;
  progress with the other device's position; and the Kobo-further-on notice in the top bar.
- **FR-005**: Read status MUST be shown on every book tile and follow one rule everywhere:
  nothing when unread, "N% read" when in progress, "Finished" when finished.
- **FR-006**: The sync status MUST sit in the header on every page outside the reader. No
  status may float over content.
- **FR-007**: Until the library mirror exists, all screens MUST run on a licence-free sample
  library: public-domain books, covers and periodicals. Swapping in the real library MUST NOT
  require screen changes.

**Accessibility and calm (binding floor from spec 001)**

- **FR-008**: All screens MUST meet WCAG 2.2 AA in every theme. They MUST keep the 3px focus
  ring and targets of at least 24px, and they MUST work by keyboard and screen reader.
  Click-target rows MUST expose one link per book.
- **FR-009**: Movement MUST happen only in response to the owner, and MUST stop under reduced
  motion. Reading text MUST NOT be hyphenated, and body text contrast MUST stay in the calm
  band (about 9–13:1).

**AI features**

- **FR-010**: Read next MUST show up to 12 books from the owner's library that are neither in
  progress nor finished. Each MUST show a reason, and each MUST be dismissible for now or for
  good.
- **FR-011**: Story so far MUST be written only from text before the owner's furthest
  position. It MUST state its cut-off and say that it was written by AI. It MUST have writing,
  unavailable and too-early states. For chapters not read in Ribbon, it MUST summarise whole
  chapters newest first, up to 40,000 words before the owner's place, MUST say what it covers,
  and MUST add earlier chapters only when the owner asks, with the estimated cost shown first
  (DR-0004).
- **FR-012**: Genre suggestions MUST be kept in Ribbon and marked as suggested until the owner
  promotes them. Promotion MUST write to a dedicated genres field in the Calibre library through
  Calibre's own tools at the next sync. The owner's collection field MUST never be changed.
- **FR-013**: Ask your library MUST accept plain-language requests, give a reason for every
  result, and fall back to exact search when AI is unavailable.
- **FR-014**: More like this MUST show up to 5 owned books with reasons on each book page.
- **FR-015**: AI output MUST be marked in plain words where it appears. Suggestions MUST NOT
  include books outside the owner's library, streaks or prompts to read more.
- **FR-016**: Every AI feature MUST work as an optional layer. With AI off or unavailable, all
  screens MUST still work, and the AI areas MUST hide or explain themselves.
- **FR-017**: Before any AI feature is enabled, its expected monthly running cost MUST be stated
  to and approved by the owner. AI features MUST stay within £5 a month in total, and SHOULD stay
  within the hosting provider's free allowance (target £0).
- **FR-018**: Book content and reading data MUST be processed for AI features only inside the
  owner's own hosting account, by a provider that does not train on or keep that content. No other
  AI provider may receive it (owner, 2026-11-18: no Anthropic for now). If recap quality falls
  short, that is reported to the owner for a decision. It is not worked around by sending
  content elsewhere.

### Key Entities

- **Book**: title, authors, cover, description, series, collection, tags, formats, date added,
  publication facts, read status.
- **Reading position**: where the owner is in a book on a device (this device, Kobo). It has a
  percentage, chapter, time and furthest point. It drives Home, the reader and the recap
  cut-off.
- **Author**: name, life dates, short biography with source, portrait with source,
  bibliography (owned and not owned).
- **Shelf**: a named group of books: a collection from Calibre, or a genre (suggested or
  promoted).
- **Genre suggestion**: a book–genre pair. Its state is suggested, promoted (waiting for sync),
  in Calibre, or removed.
- **Suggestion**: a book suggested to read next or as similar, with its reason and dismissal
  state.
- **Recap**: a book, its cut-off position, the recap text, and when it was written.
- **Periodical issue**: publication, issue date, read status. It is kept apart from books.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From opening Ribbon, the owner reaches the right place in the current book with
  one tap and in under 3 seconds on a mid-range phone.
- **SC-002**: The owner signs off every screen in a finish review against its approved mock,
  with no outstanding differences in arrangement, type or colour.
- **SC-003**: Automated accessibility checks report zero violations on every screen in light,
  dark and Night, at phone and desktop widths.
- **SC-004**: In a sample of 20 recaps, none mentions an event after the cut-off, judged
  against the text.
- **SC-005**: 100% of AI suggestions and search results show a reason, and none comes from
  outside the owner's library.
- **SC-006**: With AI switched off, every screen still opens and every non-AI task in User
  Stories 1–3 and 8 completes.
- **SC-007**: AI running costs over any month stay within the approved ceiling (FR-017).

## Assumptions

- The approved mocks and direction contracts are the design source of truth. Changes go back
  through owner review first.
- "7 days away" for offering a recap and "under 5%" for "too early" are starting values, to be
  tuned (ASSUMPTION).
- Ask your library's results layout has no approved mock yet. It gets a short design review in
  the same way before it is built.
- Biographies, bibliographies and portraits come from public sources and show their source.
  Missing data is left out rather than guessed.
- Ribbon remains single-user, behind the existing access control.
- Recap quality from the open models available in the owner's hosting account is good enough. It
  is checked against SC-004 on sample books before the feature is turned on (ASSUMPTION).

## Dependencies

- **Spec 001** (visual design foundation): tokens are updated to the oxblood accent per DR-0002.
- **Mirror, reading and device progress specs** (renumbered 003–005 in PLAN.md): they supply
  the real library, offline book files, and Kobo positions. Until they land, this spec's screens
  use the sample library. Kobo-related display shows sample values.
