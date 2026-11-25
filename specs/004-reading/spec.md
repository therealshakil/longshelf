# Feature Specification: Reading offline and across devices

**Feature Branch**: `004-reading`

**Created**: 2026-11-25

**Status**: Draft

**Input**: User description: "Spec 004: Read (Phase 2 in docs/PLAN.md). The owner reads books from their private Longshelf mirror (spec 003) in the web app on phone and desktop, including offline. Download books for offline reading on that device; see and remove downloads and how much space they use on a storage page; the installed app opens and reads downloaded books with no network. Reading progress per book is saved on the device as you read, including offline, and synced to the mirror when back online, so another device picks up where you left off. Latest position wins, by time. The library browses offline from a saved copy of the catalogue. A smoke test: open the app, go offline, open a downloaded book. Out of scope: the public showcase, Kobo progress (spec 005), writing to Calibre."

## Where we start

Spec 003 already delivers, and this spec does not redo:
- Opening any mirrored book in the reader while online.
- The library and book pages opening offline from the last catalogue seen, with an "Offline" notice.
- The reader remembering its place on the device it was read on.

What is missing: book files are not kept for offline reading (the Download button on the book
page is a placeholder), the reading place never leaves the device, and there is nowhere to see
what is stored.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read a downloaded book with no connection (Priority: P1)

The owner taps Download on a book while online. Later, on a plane or underground with no
signal, they open the installed app, find the book in the library and read it, turning pages,
using the contents list and changing text size as usual.

**Why this priority**: Offline reading is the main reason for a personal reader app over a
website. Without it, nothing else in this spec matters on the move.

**Independent Test**: On a phone, download one book, turn on airplane mode, close the app
completely, reopen it from the home screen, open the book and read to a later chapter.

**Acceptance Scenarios**:

1. **Given** the owner is online on a book's page, **When** they tap Download, **Then** they
   see progress while it saves, then "Downloaded", and the book is kept on this device.
2. **Given** a downloaded book and no network, **When** the owner opens the installed app and
   then the book, **Then** it opens at their last place and reads normally.
3. **Given** no network, **When** the owner browses the library, **Then** downloaded books are
   clearly marked as readable, and opening a book that is not downloaded explains calmly that
   it needs a connection, without an error page.
4. **Given** a downloaded book, **When** the owner opens it online, **Then** it opens from the
   device copy, without downloading it again.

---

### User Story 2 - Pick up on another device where you left off (Priority: P2)

The owner reads a chapter on their phone on the way home, then opens the same book on their
laptop. The laptop takes them to where they stopped on the phone. This works even if the phone
was offline while reading: the place is sent once the phone is back online.

**Why this priority**: Switching between phone and laptop is everyday use. Without it the
owner has to hunt for their place every time.

**Independent Test**: Read to 40% on device A (online), then open the book on device B: it
offers or goes to 40% (see FR-009). Repeat with device A offline while reading, then
reconnected.

**Acceptance Scenarios**:

1. **Given** the owner read further on device A and device B has not moved since it last
   synced, **When** they open the book on device B, **Then** it opens at device A's place.
2. **Given** both devices moved since they last synced, **When** the owner opens the book on
   device B, **Then** it opens at device B's place and offers device A's place to jump to.
3. **Given** device A was offline while reading, **When** it next has a connection and the app
   is open, **Then** its latest place reaches the mirror without the owner doing anything.
4. **Given** both devices moved while apart, **When** they sync, **Then** the most recently read
   place is the one offered, and no device ever silently moves the owner backwards.
5. **Given** the owner closes the app mid-chapter, **When** they reopen it on the same device,
   **Then** they are at the same place, to within the same screen.

---

### User Story 3 - See and manage what is stored on this device (Priority: P3)

The owner opens a storage page in settings. It lists the downloaded books with their sizes, the
total, and how much space the device allows. They remove books they have finished to free
space, singly or all at once.

**Why this priority**: Phones have limited space. The owner needs to stay in control, but this
is used rarely compared with reading.

**Independent Test**: Download three books, open the storage page, check the sizes add up,
remove one, and confirm it is no longer readable offline and the total falls.

**Acceptance Scenarios**:

1. **Given** downloaded books, **When** the owner opens the storage page, **Then** each book is
   listed with its size, plus the total used and the space available.
2. **Given** the storage page, **When** the owner removes a book, **Then** its file is deleted
   from the device, the book page shows Download again, and the reading place is kept.
3. **Given** the device may clear stored data under pressure, **When** the owner downloads their
   first book, **Then** the app asks the device to keep downloads, and the storage page says
   plainly whether that was granted.

---

### Edge Cases

- **Not enough space**: the download stops, nothing half-saved is left behind, and the owner is
  told how much space is needed.
- **Connection drops mid-download**: the book is not marked downloaded; tapping Download again
  starts over or resumes, and never leaves a broken copy.
- **The book changes in Calibre** after it was downloaded (a new file is uploaded): the device
  keeps reading its copy, and the book page offers to update it when online. The reading place
  carries over as closely as the new file allows.
- **The book is removed from the mirror**: its device copy stays readable until the owner removes
  it, and it is marked as no longer in the library.
- **Sign-in has expired** while offline: downloaded books still open; places queue until the
  owner signs in again, then send.
- **Several formats**: Download saves the format the reader opens (EPUB first), not every format.
- **The device cleared its storage**: the app notices on next open, marks the books as not
  downloaded, and keeps their reading places.
- **Two tabs or windows** on one device: both record places; the latest wins and nothing is lost.

## Requirements *(mandatory)*

### Functional Requirements

**Downloads**
- **FR-001**: The owner MUST be able to download a book for offline reading on the current
  device from the book page, and to remove it again.
- **FR-002**: A download MUST either complete fully or leave nothing behind; a book MUST only show
  as downloaded when its whole file is stored and readable.
- **FR-003**: Downloaded books MUST open and read with no network connection, from the installed
  app opened cold.
- **FR-004**: When a downloaded book is opened, the device copy MUST be used, online or offline.
- **FR-005**: The library MUST mark which books are downloaded. Offline, opening a book that is not
  downloaded MUST show a calm message saying it needs a connection, not an error.
- **FR-006**: On the first download, the app MUST ask the device to keep stored books, and record
  whether this was granted.
- **FR-007**: When the mirror has a newer file for a downloaded book, the book page MUST offer to
  update the device copy while online. It MUST NOT replace it on its own.

**Reading place**
- **FR-008**: The reader MUST save the reading place on the device as the owner reads, online or
  offline, so that closing the app at any moment loses at most the current screen.
- **FR-009**: When the book is opened and another device has a more recent place than this
  device (owner, 2026-11-25):
  - if this device has not moved in the book since it last synced, the reader MUST go straight
    to the more recent place;
  - if both devices moved, the reader MUST open where this device was and offer the other place
    ("Phone: 63%, ch. 12. Jump there?"), as the existing Kobo notice does. It MUST NOT move the
    owner without asking.
- **FR-010**: Places recorded offline MUST be kept in order and sent to the mirror automatically
  once there is a connection and the app is open. No place may be lost if the app is closed
  before sending.
- **FR-011**: Each place MUST record when it was read and on which device. When places conflict,
  the most recently read one wins; an older place MUST never overwrite a newer one.
- **FR-012**: Places MUST be private to the owner, behind the same sign-in as the rest of the
  mirror, and stored apart from Calibre's data (Calibre is not written to).
- **FR-013**: Each device MUST have a stable name the owner can recognise (for example "Pixel"
  or "Laptop"), shown wherever another device's place is offered.

**Storage page**
- **FR-014**: A storage page in settings MUST list downloaded books with sizes, the total used,
  the space the device reports as available, and whether the device has agreed to keep them.
- **FR-015**: The owner MUST be able to remove one downloaded book, or all of them, from the
  storage page. Removing a download MUST NOT remove its reading place.

**Quality**
- **FR-016**: An automated smoke test MUST cover: open the app, download a book, go offline,
  reload, and open and turn pages in that book.
- **FR-017**: New screens and states MUST follow the approved calm design (spec 002) and meet the
  accessibility standard of earlier specs. New UI is shown as a mock for the owner's approval
  before it is built.

### Key Entities

- **Downloaded book**: a book file kept on one device for offline reading. Has the book, the
  format, the file's identity (so a newer file can be detected), its size and when it was saved.
- **Reading place**: where the owner is in a book on one device. Has the book, the device, the
  position (chapter, place in chapter, percentage through the book), and when it was read. The
  latest per book and device is kept.
- **Device**: a browser or installed app the owner reads on. Has a stable identity and a
  readable name.
- **Pending place**: a reading place recorded on the device but not yet confirmed by the mirror.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With no network, a downloaded book opens from the installed app, started cold, in
  under 3 seconds on the owner's phone.
- **SC-002**: After reading on one device, the place is offered on a second device within 10
  seconds of opening the book, when both are online.
- **SC-003**: After 30 minutes of offline reading, every place recorded reaches the mirror within
  1 minute of the device being online with the app open, with none lost or reordered.
- **SC-004**: Closing the app at any moment and reopening it on the same device returns to the
  same screen in 20 out of 20 tries.
- **SC-005**: A typical book (under 5 MB) downloads in under 10 seconds on a home connection.
- **SC-006**: The storage page totals match the sum of the listed books to within 1%.
- **SC-007**: The smoke test passes on every run in the test suite.
- **SC-008**: Running costs stay at £0 for one reader: syncing places adds at most a few thousand
  requests a day, well inside the hosting's free allowance.

## Assumptions

- One owner, a handful of devices (phone, laptop, maybe a tablet). No sharing between people.
- Books are downloaded one at a time by choice; there is no automatic downloading of "currently
  reading" books in this spec.
- Download saves one format: the one the reader opens (EPUB first, then other readable formats).
  Saving other formats to the device's files stays as spec 003 built it.
- Finished/unread status and highlights are out of scope; they come with device progress
  (spec 005) or later.
- Places from the Kobo arrive in spec 005. The data kept here must leave room for them (separate
  source per device), as `docs/DESIGN.md` describes.
- The mirror sign-in (spec 003) stays as it is. Sign-in can expire while offline; this is
  handled by queuing, not by a new sign-in flow.
- Browsers keep stored files unless storage runs short or the owner clears site data; the app
  asks for them to be kept but cannot guarantee it.
- Each change is tried on a PR preview (DR-0012) with the test library before production.

## Out of Scope

- The public showcase library (its own spec).
- Kobo and other device progress via Calibre columns (spec 005).
- Any writing to Calibre.
- Highlights, notes, bookmarks and reading statistics.
