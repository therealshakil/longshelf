# Quickstart: validate reading offline and across devices

Proves spec 004 end to end. Each step runs first on a PR preview (DR-0012), with the test
library. Step 6 is on the owner's own devices, against production, after merge.

## Prerequisites

- Spec 003 deployed. A PR from this branch has a preview, shown in the PR comment.
- Two devices signed in: the owner's phone (installed app) and a laptop browser.

## 1. Automated checks

```sh
pnpm test                       # unit: place merge (R6), outbox, upsert, schemas
pnpm test:e2e                   # includes the smoke test (FR-016): download, offline, read
```
Expected: all pass. The smoke test is in the default suite and needs no mirror.

## 2. Download and read offline (US1, SC-001, SC-005)

On the preview, on the phone:
1. Open a book and tap Download. Expected: progress shows, then "Downloaded" (under 10 s for a
   book under 5 MB).
2. Turn on airplane mode, close the app fully, and reopen it from the home screen.
3. The library opens. The downloaded book is marked, and other books say they need a connection.
4. Open the downloaded book. Expected: open in under 3 s, at your place. Turn pages and use
   the contents list.

## 3. Pick up on another device (US2, SC-002, SC-003)

1. Laptop: read Dracula to about 30%. Close the tab.
2. Phone (online): open Dracula. Expected: it goes straight to about 30% (this phone hadn't
   moved), within 10 s.
3. Phone, airplane mode: read on to about 45%. Close the app.
4. Laptop: read on from 30% to 35%.
5. Phone back online, open the app. Expected: within 1 minute its 45% reaches the mirror.
6. Laptop: reopen Dracula. Expected: the laptop read most recently, so it opens at 35%, and
   offers "Android phone is further on · 45%" (FR-009, 2026-11-27). Tap Stay.
7. Phone: open Dracula. Expected: it opens at the laptop's 35%, the most recent, and offers
   "This device is further on · 45%". Tap Stay.
8. Reopen Dracula on either device. Expected: no offer; each place is offered once.

## 4. Storage page (US3, SC-006)

1. Download three books. Open Settings, then Storage. Expected: three rows with sizes whose
   total matches, "about N GB available", and whether downloads are kept.
2. Remove one. Expected: its book page shows Download again, and its place is unchanged.

## 5. Failure cases

- Airplane mode halfway through a download. Expected: not marked downloaded, nothing listed on
  the storage page, and Download works again once online.
- Sign out of Access (clear the site cookie), read offline, come back online. Expected: "Sign in
  again", places kept, and sent after signing in.

## 6. Owner's devices, production

Repeat steps 2 and 3 on the real library after merge and `pnpm run deploy`. Record the SC-001
and SC-002 timings in `docs/JOURNAL.md`.
