# Quickstart: validating 002

## Prerequisites

- `pnpm install` from the repo root (Node 24, pnpm 12).
- The three sample EPUBs (Middlemarch, Moby Dick, Meditations) from standardebooks.org, saved
  by hand in `apps/web/static/sample/books/` (research R2).
- For the AI stories only: `wrangler login` to the owner's Cloudflare account, and the D1
  database and AI binding from research R3.

## Screens on sample data (US1, US2, US3, US8)

1. `pnpm dev`, then open the app.
2. **Home:**
   - Middlemarch leads, with progress, Kobo figure and last read.
   - Continue reading opens the reader at the stored place.
   - Each Also reading row opens its book.
   - Latest news & magazines sits at the bottom.
3. **Reader:**
   - A tap in the middle third hides and shows the bars.
   - Each Aa setting changes the page at once and persists after a reload.
   - Night turns the page near-black.
   - The Kobo-further-on pill sits in the top bar; "Go there" moves to the Kobo position.
4. **Library:**
   - The tabs are in FR-003 order.
   - The letter rail on All Books can be scrubbed and used by keyboard.
   - The author and shelf pages open.
   - The book page shows all sections.
   - No periodical appears in Recently added.
5. **Read status:** pick three books (unread, in progress, finished) and check the same label
   on Home, every Library tab, the author, shelf and book pages.

## Design match (SC-002) and accessibility (SC-003)

- `pnpm test:e2e`: axe on every route at 390 and 1440 px in light, dark and Night (reader).
  Expect zero violations.
- `pnpm design:compare` writes app and mock screenshots side by side to `test-results/design-compare/`
  for the finish review.

## AI (US4 to US7) against the owner's Cloudflare account

1. `pnpm dev:remote` (the Worker with its AI and D1 bindings).
2. Read past two chapters of Moby Dick, then open Story so far. It covers those chapters only,
   names the cut-off, and ends with the AI note.
3. Run the genre job from the operator page. Suggested genres appear as dashed chips. Promote
   one; it shows "Waiting for sync".
4. Read next: every item has a reason and none is in progress or finished. "Never suggest"
   removes a book.
5. Search "a long sea voyage": Moby Dick is among the results, with a reason. Search
   "Middlemarch": exact match first.
6. Switch AI off on the operator page. Every screen still works; the AI areas hide or say they
   are off (SC-006).
7. The operator page shows today's neuron estimate below the ceiling (SC-007).

## Recap quality (SC-004)

`pnpm eval:recaps` builds 20 recaps at set cut-offs across the three sample books. It writes
them next to the chapter that follows each cut-off, for the owner to judge "mentions anything
after the cut-off: yes/no". Pass: 0 of 20.
