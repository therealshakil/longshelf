# DR-0003: AI features in the design

Status: **accepted for design** (owner, 2026-11-18). Implementation (models, hosting, cost) is
a separate decision, still open.
Version: 1.0.0   Date: 2026-11-18   Decider: owner
Scope: what the AI features do and how they appear. Not how they are built.

## Context

The owner asked for AI features in the redesign ("read next, categories, genres, etc."), with
"tech implementation later". The AI-Team constitution requires honest-by-construction design
(no dark patterns, minimal data) and flags recurring costs before they are incurred. Calibre is
Ribbon's source of truth: it is never written directly, and writes go through `calibredb`.

## Features (designed and approved)

1. **Read next.** Up to 12 suggestions from the owner's own library, each with a one-line
   reason. Dismissible ("Not now", "Never"). Shown on Home.
2. **Genres.** Suggested genres for every book, browsable as a Library tab and shown on the
   book page.
3. **Story so far.** A spoiler-safe recap up to the owner's place. It is offered after a gap of
   7 or more days (ASSUMPTION: threshold to be tuned) and is always available from the ledger,
   the book page and the reader. It states its cut-off and has states for writing, unavailable
   and too early (under 5%).
4. **Ask your library.** The search field also takes plain-language requests. Results design
   is still to do.
5. **More like this.** Suggestions on the book page, each with a reason.

## Where AI-made genres live

| Option | Effect |
|---|---|
| Suggest, owner accepts, write to Calibre | One truth, but about 2,000 decisions before anything is browsable |
| Ribbon only | No effort, but invisible in Calibre and on the Kobo |
| Auto-write to Calibre | Unchecked AI output in the owner's library data |
| **Mix (chosen)** | Suggestions live in Ribbon and are browsable at once; the owner promotes the ones they agree with to a new multi-value Calibre "Genres" column via `calibredb` |

The hand-curated `collection` column is never touched.

## Honesty rules

- AI output is marked in plain words where it appears. The owner rejected boxed "AI" badges.
  The disclosure now lives in the reasons, the recap's closing note and the genre footnotes.
- Every suggestion carries its reason.
- No streaks, nudges, or suggestions from outside the owner's library.
- Spoiler safety: recaps never go past the owner's furthest read position.

## Challenger: the strongest case against

"AI features add a recurring cost and an external dependency to a single-user app whose first
principle is ease of maintenance. Suggestions from 96–700 books could be plain rules:
same author, same collection, Reading List. Recaps of public-domain classics exist already."

Ruling: the design keeps every feature optional, with a non-AI fallback: exact search, Calibre
tags, and no recap. The build decision must assess a rules-only or local option before any paid
API, and must state the monthly cost first (constitution 8).

## Sources

- Owner steers: this session, 2026-11-18.
- Calibre `calibredb` — https://manual.calibre-ebook.com/generated/en/calibredb.html
