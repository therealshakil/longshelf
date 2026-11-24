# Feature Specification: Library mirror

**Feature Branch**: `003-library-mirror`

**Created**: 2026-11-24

**Status**: Draft

**Input**: User description: "Spec 003: Mirror (docs/PLAN.md Phase 1). A private cloud mirror of the
owner's Calibre library: the owner runs `longshelf library` on their machine to upload metadata,
covers and book files (EPUB, plus KEPUB when present) to their deployment; the spec 002 screens show
the real library instead of sample data, including downloading books; the app installs as a PWA that
caches the app shell and covers; access is limited to the owner (plus a non-interactive credential for
the CLI); deployment and database migrations are repeatable from the repo. Calibre stays the source of
truth and is never written by this feature. Reading progress is out of scope (specs 004 and 005).
Single user per deployment, solo-operable, flag any recurring cost."

## Context

Spec 002 built every screen on a licence-free sample library. DR-0009 added a local, read-only
Calibre mode for development. This spec puts the owner's real library online, privately, so the same
screens work from any device. The architecture is in [`docs/DESIGN.md`](../../docs/DESIGN.md)
(sections "longshelf CLI", "Cloud" and "Client").

Calibre on the owner's computer stays the source of truth. The mirror is a copy that follows it.
Nothing in this feature writes to the Calibre library.

The owner's library on 2026-11-24 was 670 books, about 3.3 GB on disk. Formats: EPUB 634 (2.83 GB),
MOBI 43, PDF 25, CBZ 10, CBR 1. There is no KEPUB yet. (Source: read-only count of the owner's
`metadata.db`.)

## Clarifications

### Session 2026-11-24

- Q: Which formats should the upload command send? → A: All formats. Those the reader can't open are
  download-only. (Adds about 0.4 GB at the owner's library size.)
- Q: AI features on or off by default once the real library is online? → A: On by default, as in
  spec 002, with a plain disclosure in Settings and a way to turn them off.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Put my library online (Priority: P1)

The owner runs one command on their computer. It reads the Calibre library, uploads what the mirror
doesn't have yet, and reports what it did in plain words: books added, changed, removed, and how much
was uploaded. Running it again when nothing has changed uploads nothing and says so.

**Why this priority**: Without the upload there is nothing to show. Every other story depends on it.

**Independent Test**: Against a small test library (licence-free books), run the command twice. The
first run uploads every book. The second reports no changes and transfers no book files.

**Acceptance Scenarios**:

1. **Given** an empty mirror and a library of N books, **When** the owner runs the command, **Then**
   the mirror holds all N books with their metadata and covers, and every supported file.
2. **Given** a mirror in step with the library, **When** the owner runs the command, **Then** no book
   file or cover is uploaded and the report says nothing changed.
3. **Given** the owner edited one book's metadata in Calibre, **When** the command runs, **Then** only
   that book's metadata is sent, and the mirror shows the new metadata.
4. **Given** the owner replaced one book's EPUB in Calibre, **When** the command runs, **Then** only
   the new file is uploaded and the mirror serves the new file.
5. **Given** the owner deleted a book in Calibre, **When** the command runs, **Then** the book no longer
   appears in the mirror.
6. **Given** the connection drops halfway through, **When** the owner runs the command again, **Then**
   it finishes the remaining work without re-uploading what already arrived, and the mirror never
   shows a book whose files are missing.
7. **Given** Calibre is open and in use, **When** the command runs, **Then** it reads the library
   without changing it and without disturbing Calibre.

---

### User Story 2 - Browse and read my real library anywhere (Priority: P1)

The owner opens the app on their phone or another computer and sees their own library on the spec 002
screens: Library, author, shelf, book page, news and magazines, and search. They open a book in the
reader, or download it to keep on the device.

**Why this priority**: This is the point of the mirror. It's what the owner sees.

**Independent Test**: After an upload of the test library, open the deployed app, find a book by
browsing and by search, open it in the reader, and download it.

**Acceptance Scenarios**:

1. **Given** an uploaded library, **When** the owner opens Library, **Then** they see their books with
   covers, authors, series, shelves and news issues, the same as in local Calibre mode.
2. **Given** a book page, **When** the owner chooses to read, **Then** the reader opens that book's file
   from the mirror.
3. **Given** a book page, **When** the owner downloads the book, **Then** the file is saved to their
   device in a format their reading apps can open.
4. **Given** a book with no readable format, **When** the owner opens its page, **Then** the page shows
   its details and says plainly that it can't be read here, with no broken button.
5. **Given** the owner adds books in Calibre and runs the command, **When** they reload the app,
   **Then** the new books appear.

---

### User Story 3 - Only I can get in (Priority: P1)

Every page, file and API of the deployment is closed to anyone who isn't the owner. The owner signs in
once on each device and stays signed in for about a month. The upload command uses its own credential,
which can be replaced without touching the owner's sign-in.

**Why this priority**: The library is private and copyrighted. A public mirror would be a serious
failure, so this ships with the first deploy, not after it.

**Independent Test**: From a browser that isn't signed in, and with no credential, request the home
page, a cover, a book file and an API route. Each is refused. Repeat signed in, and each works.

**Acceptance Scenarios**:

1. **Given** a visitor who isn't signed in, **When** they request any address on the deployment,
   **Then** they get no library data: no titles, covers, files or metadata.
2. **Given** the owner signs in on a device, **When** they come back within about 30 days, **Then**
   they aren't asked to sign in again.
3. **Given** the upload command's credential is revoked, **When** the command runs, **Then** it fails
   with a plain message saying how to set a new credential, and the mirror is unchanged.
4. **Given** the deployment is reachable, **When** a search engine or link preview requests it,
   **Then** it gets nothing it can index.

---

### User Story 4 - Install it like an app (Priority: P2)

The owner adds Longshelf to their phone's home screen and computer. It opens in its own window with
its icon. The app's screens and the covers they've already seen load without waiting on the network.

**Why this priority**: Makes daily use comfortable. The library works without it, so it follows the
P1 stories. Offline reading of whole books is spec 004.

**Independent Test**: Install the app on a phone, browse the library, turn on airplane mode, and
reopen the app. It opens, and covers already seen still show.

**Acceptance Scenarios**:

1. **Given** a supported browser, **When** the owner chooses to install, **Then** Longshelf installs
   with its own name and icon and opens in its own window.
2. **Given** the owner has browsed covers, **When** the device goes offline and the app is reopened,
   **Then** the app opens and the covers already seen still show.
3. **Given** a new version is deployed, **When** the owner next opens the app, **Then** they get the
   new version without reinstalling, and nothing they had open is lost without warning.

---

### User Story 5 - Deploy and update it myself (Priority: P2)

The owner can set up a deployment from the repository on their own account, and later ship changes
and database updates, with a short written procedure and the repository's own commands. A failed
update leaves the previous version working.

**Why this priority**: Needed once before anything is live, then on every change. It must stay simple
enough for one person.

**Independent Test**: On a fresh account, follow the written procedure from start to a signed-in, empty
library. Then deploy a change that includes a database update.

**Acceptance Scenarios**:

1. **Given** a fresh account and the repository, **When** the owner follows the setup procedure,
   **Then** they reach a working, signed-in deployment, and every step is a command or a single
   console screen named in the procedure.
2. **Given** a change that includes a database update, **When** the owner deploys, **Then** the update
   is applied once, in order, and running the deploy again changes nothing.
3. **Given** a deploy fails partway, **When** the owner opens the app, **Then** the previous version
   still works and its data is intact.
4. **Given** any step would start a recurring charge, **When** the owner reaches it, **Then** the
   procedure says so and gives the amount before the step.

---

### Edge Cases

- A book has several formats (for example EPUB and MOBI): which are uploaded and offered follows
  FR-004.
- A book has no cover: it gets the plain binding the screens already use.
- Two books share a title or an author name: they stay separate, keyed by Calibre's book identifier.
- A book's file is missing from disk though Calibre lists it: the command reports it by title and
  carries on with the rest.
- A very large file (for example a 200 MB illustrated EPUB): uploads without timing out, or is
  reported plainly if it can't be.
- The library moves to another folder or computer: the mirror still matches books by Calibre's book
  identifier, so nothing is re-uploaded that is unchanged.
- The owner points the command at a different Calibre library by mistake: it shows what would be
  removed and asks before removing more than a set share of the mirror (default 10%).
- News issues that Calibre deletes after a while: they leave the mirror on the next run, like any
  other removed book.
- The upload is interrupted between files and metadata: the mirror never shows a book whose file
  isn't there yet.
- Two runs at once (for example a timer and a manual run): the second waits or stops with a plain
  message, and the mirror stays consistent.

## Requirements *(mandatory)*

### Functional Requirements

**Upload**

- **FR-001**: The owner MUST be able to mirror their Calibre library with one command, run on Linux or
  macOS, that reads the library without modifying it.
- **FR-002**: The command MUST send only what the mirror lacks or has out of date: new or changed
  metadata, covers and files. A run with no changes MUST transfer no files.
- **FR-003**: The mirror MUST hold, per book: title, sort title, authors (in order), series and number,
  tags, collection, publisher, publication date, description, date added, rating, the cover, and the
  list of formats Calibre has.
- **FR-004**: The command MUST upload every format Calibre holds for a book (EPUB, KEPUB, PDF, MOBI,
  CBZ, CBR and any other), so each can be downloaded. The reader opens the formats it supports; the
  rest are download-only.
- **FR-005**: Books removed from Calibre MUST be removed from the mirror on the next run, and their
  files deleted once no remaining book uses them.
- **FR-006**: If a run would remove more than 10% of the mirror's books, the command MUST list them
  and ask the owner to confirm before removing anything.
- **FR-007**: An interrupted run MUST leave the mirror consistent, and the next run MUST finish the work
  without re-sending what already arrived.
- **FR-008**: The command MUST report, in plain words: books added, updated and removed; data
  uploaded; problems by book title; and the next action when something failed.
- **FR-009**: The command MUST be safe to run while Calibre is open.

**Library on the mirror**

- **FR-010**: Every spec 002 screen MUST show the mirrored library in place of the sample library,
  through the one existing switch point for library data, with no screen redesigned.
- **FR-011**: The owner MUST be able to open any mirrored EPUB or KEPUB in the reader, streamed from
  the mirror.
- **FR-012**: The owner MUST be able to download any mirrored file to their device, under a file name
  made from the title and author.
- **FR-013**: Changes uploaded by the command MUST show in the app on the next load, without a
  redeploy.
- **FR-014**: Search MUST work over the mirrored library as it does over the sample library (DR-0008).

**Access**

- **FR-015**: Every page, file and API route MUST require the owner's sign-in or the command's
  credential. Unauthenticated requests MUST receive no library data.
- **FR-016**: A sign-in MUST last about 30 days per device, so the installed app keeps working offline
  within that time.
- **FR-017**: The command's credential MUST be separate from the owner's sign-in, MUST allow only the
  upload operations, and MUST be replaceable without redeploying.
- **FR-018**: The deployment MUST tell search engines and link previews not to index it.

**Installable app**

- **FR-019**: The app MUST be installable on current mobile and desktop browsers, with its own name,
  icon and window.
- **FR-020**: The app's screens MUST open without the network after the first visit, and covers already
  shown MUST be kept for offline use. Book files offline are spec 004.
- **FR-021**: A new deployed version MUST reach installed apps on next open without reinstalling.

**Deploy and operate**

- **FR-022**: Setup, deploy and database updates MUST be repository commands plus a written procedure
  (`docs/`), runnable by one person on a mid-range laptop.
- **FR-023**: Database updates MUST apply in order, exactly once, and a repeated deploy MUST change
  nothing.
- **FR-024**: A failed deploy MUST leave the previous version serving.
- **FR-025**: The procedure MUST name every recurring cost, with its amount and source, before the step
  that incurs it.
- **FR-026**: AI features MUST be on by default, as in spec 002, reading the mirror's data the same way
  as the sample data. The owner MUST be able to turn them off in Settings, and Settings MUST say
  plainly that, while on, book metadata and some book text are sent to the hosting provider's AI
  service.

### Key Entities

- **Book**: one Calibre book, keyed by Calibre's book identifier. Holds its metadata, cover and
  formats. News issues are books tagged as news, shown apart (spec 002 US8).
- **Author, Series, Tag, Collection**: as in Calibre, linked to books.
- **Book file**: one format of one book. Identified by its content, so an unchanged file is never
  uploaded twice.
- **Cover**: one image per book, identified by its content.
- **Upload run**: one run of the command: what it found, what it sent, what failed.
- **Upload credential**: the command's own key, separate from the owner's sign-in.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The owner's library (670 books, about 3 GB) uploads in full in one unattended run of
  under 1 hour on a 20 Mbit/s upload connection.
- **SC-002**: A run with no changes finishes in under 30 seconds and transfers no book files.
- **SC-003**: Opening Library on a phone over 4G shows the first screen of covers in under 3 seconds.
- **SC-004**: 0 library data (titles, covers, files, metadata) is returned to any request without the
  owner's sign-in or the command's credential, checked against every route.
- **SC-005**: A fresh deployment, from an empty account to a signed-in empty library, takes the owner
  under 30 minutes following the written procedure.
- **SC-006**: The recurring cost at the owner's library size is stated before deploy, and is $0 or
  within the $5 a month ceiling in `docs/DESIGN.md`.
- **SC-007**: After a first visit, the installed app opens with no network, and covers already seen
  are shown.
- **SC-008**: The Calibre library is byte-for-byte unchanged after any number of runs.

## Assumptions

- One owner per deployment, on their own hosting account. There are no other users or roles.
- The hosting and sign-in services are those in `docs/DESIGN.md` (DR records apply). The plan names
  them; this spec doesn't depend on which.
- Free tiers cover a library of this size. `docs/DESIGN.md` estimates the ceiling at $5 a month.
  ASSUMPTION: storage free tier of about 10 GB, against a library of about 3.3 GB. The plan must
  check current pricing and quote it with sources.
- The deployment is reached at the hosting provider's default address. A custom domain can be added
  later without changing this spec. ASSUMPTION: the owner doesn't need a custom domain for the first
  deploy.
- The command is run by hand for now. A timer that runs it automatically is spec 005
  (`longshelf install-timer`).
- Reading progress, Kobo positions, highlights and offline book files are out of scope (specs 004 and
  005). Screens that show progress show none until then, as in local Calibre mode.
- Calibre's custom column for collections is read the same way local Calibre mode reads it (DR-0009).
- Local Calibre mode (DR-0009) stays for development and isn't replaced.

## Dependencies

- Spec 002: the screens and the one switch point for library data.
- DR-0008 (plain search) and DR-0009 (local Calibre mode, whose reading of `metadata.db` the command
  can share).
- Specs 004 (offline reading, web progress) and 005 (device progress) build on this mirror.
