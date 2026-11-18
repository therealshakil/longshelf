# Implementation Plan: Redesigned screens and AI features

**Branch**: `redesign-impeccable` | **Date**: 2026-11-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-redesign-and-ai/spec.md`

## Summary

Build the owner-approved screens:
- Home with Story so far;
- Library, with author, shelf and book pages;
- the reader.

Each matches its mock in `design-mocks/` and the direction contracts in
`apps/web/.impeccable/surfaces/`. Screens read data only through a `LibrarySource` interface,
served by licence-free sample data until the mirror (spec 003) arrives.

The AI features run on Cloudflare Workers AI in the owner's account. Each takes the cheapest
route to its job:
- **Story so far:** recaps are built from per-chapter summaries, so they are spoiler-safe by
  construction.
- **Read next and More like this:** rules plus embeddings, with reasons that can't be false.
- **Ask your library:** exact search plus embeddings.
- **Genres:** suggested, then promoted to Calibre through the CLI.

A daily spend guard keeps usage inside the free allowance. Decisions:
[DR-0002](../../docs/decisions/DR-0002-redesign-impeccable.md),
[DR-0003](../../docs/decisions/DR-0003-ai-features.md), and [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 5, Svelte 5, Node 24.

**Primary Dependencies**:
- The agreed stack: SvelteKit 3, Tailwind v4, shadcn-svelte (Bits UI), Lucide, Zod.
- foliate-js as a pinned submodule (brought forward from 004, research R2).
- Workers AI and D1 through Wrangler bindings (research R3).
- No new npm dependencies.

**Storage**:
- D1 for AI results ([data-model.md](data-model.md)).
- `localStorage` for reader settings and this device's positions.
- Static sample fixtures in the repo.

**Testing**:
- Vitest: the read-status rule, letter-rail mapping, suggestion rules and reasons, recap cut-off
  assembly, spend guard, Zod contracts, and token contrast across three themes.
- Playwright + axe on every route.
- A design-compare screenshot script.
- A recap eval script (SC-004).

**Target Platform**: evergreen browsers on phone, tablet and laptop, with the Worker on
Cloudflare. AI needs the Cloudflare account. Everything else runs locally with `pnpm dev`.

**Project Type**: web application (SvelteKit app + API in one Worker), pnpm workspace.

**Performance Goals**:
- From launch to resuming the current book: one tap, under 3 s on a mid-range phone (SC-001).
- No layout shift while covers load.

**Constraints**:
- WCAG 2.2 AA in light, dark and Night.
- 3px focus ring and targets of at least 24px.
- Motion only on owner action, and never under reduced motion.
- No hyphenation in reading text.
- Tokens only in routes and components (the existing lint test).
- AI: at most 8,000 neurons/day by default, £5/month hard ceiling (FR-017). Content stays in
  the owner's Cloudflare account (FR-018).

**Scale/Scope**:
- 6 routes, about 20 components, 11 AI endpoints.
- 96-book sample library with 3 openable EPUBs.
- The real library is about 700 books.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | How |
|---|---|---|
| I. Calm & low-load | Pass | Owner-started motion only, reduced-motion honoured. No streaks or nudges (FR-015). The next action is always visible (Continue reading). The resume point is the reading position itself. |
| II. Outcomes over ceremony | Pass | Gates are outcome tests: SC-001 to SC-007, design compare, the recap eval. |
| III. Dual interface | Pass | Operator view: an AI usage and controls page (usage, ceiling, off switch, genre job) in [contracts/ai-api.md](contracts/ai-api.md). |
| IV. What, not how | Pass | The spec is tool-free. Tools are named here and in DR-0003. |
| V. Adopt before building | Pass | foliate-js for rendering. Workers AI models rather than our own. Vectorize was assessed and deferred (R6). The catalogue reuses DR-0001. |
| VI. Decisions recorded | Pass | DR-0002 and DR-0003. Scope shifts (reader and Wrangler pulled forward) are in research R2 and R3, with a challenger note. |
| VII. Challenger before locking | Pass (same-session) | Challenger passes are in DR-0002, DR-0003 and research R2. The owner ruled on scope and provider. |
| VIII. Cite or mark assumption | Pass | Prices and policies are cited with read dates. Estimates are marked ASSUMPTION. |
| IX. Economy | Pass | Expected AI cost is £0 within the free allowance. No new dependencies. The fixed cost (Workers Paid) is not needed for AI. |
| X. Solo-operable | Pass | Everything runs from one laptop. The only manual step is downloading three EPUBs (robots.txt, R2). |
| XI. Honest by construction | Pass | AI marked in plain words. Template reasons can't lie. Data stays in the owner's account and is disclosed on the operator page. |

Re-check after Phase 1: no new violations. The spend guard and the off switch make FR-016 and
FR-017 enforceable rather than promised.

## Project Structure

### Documentation (this feature)

```text
specs/002-redesign-and-ai/
├── spec.md
├── plan.md                 # this file
├── research.md             # R1–R10
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── library-source.md
│   └── ai-api.md
├── checklists/requirements.md
└── tasks.md                # /speckit-tasks
```

### Source Code (repository root)

```text
packages/shared/src/
├── tokens/            # oxblood accent, night theme, grain token (R8)
├── library/           # Zod types + LibrarySource interface (contract)
├── ai/                # Zod schemas for /api/ai/*
└── sample/            # SampleLibrary fixtures (from design-mocks/se-books.json, invented progress)

apps/web/
├── wrangler.jsonc     # AI + D1 bindings only (deploy/CI stay in 003)
├── migrations/        # D1: AI tables (data-model.md)
├── static/sample/     # covers (from design-mocks/se-covers) + books/ (3 EPUBs, owner-downloaded)
└── src/
    ├── lib/
    │   ├── components/  # AppHeader, SyncStatus, CurrentBook, LedgerRow, ReadNextShelf, BookTile,
    │   │                # ReadStatus, LibraryTabs, LetterRail, AuthorList, CollectionStack,
    │   │                # GenreList, PeriodicalRow, BookHeader, GenreChips, ReaderChrome,
    │   │                # TextPanel, ContentsPanel, StorySoFar (dialog), KoboNotice, EmptyState, ErrorState
    │   ├── reader/      # Reader.svelte (foliate-js wrapper), settings store
    │   ├── library/     # sample source wiring
    │   └── server/ai/   # models, spend guard, summaries, recap, suggestions, search, genres
    └── routes/
        ├── +page.svelte                 # Home
        ├── library/+page.svelte         # tabs via ?tab=
        ├── library/authors/[id]/        # author page
        ├── library/shelf/[kind]/[id]/   # collection or genre
        ├── book/[id]/                   # book page
        ├── read/[id]/                   # reader
        ├── settings/ai/                 # operator view
        ├── api/ai/…                     # contracts/ai-api.md
        └── design/…                     # a catalogue page per new component (DR-0001)

vendor/foliate-js/     # pinned submodule
```

**Structure Decision**: the existing pnpm workspace. UI and API live in `apps/web`, one Worker;
shared types, tokens and sample data live in `packages/shared`. The `ribbon` CLI's genre
write-back lands with the mirror (003).

## Phasing (for /speckit-tasks)

1. **Foundation:** tokens (R8), LibrarySource and sample data (R1), AppHeader and ReadStatus,
   catalogue pages.
2. **US1 Home** and **US2 Reader** (the MVP: the owner can resume and read).
3. **US3 Library** and **US8 News**.
4. **AI groundwork:** Wrangler bindings, D1 migrations, spend guard, operator page, off switch.
5. **US4 Story so far**, then **US5 Suggestions**, **US6 Genres** and **US7 Ask your library**.
   Ask your library gets a short design review of its results layout first (spec Assumptions).
6. **Finish:** design compare, axe matrix, recap eval, Impeccable finish review, owner sign-off,
   then `apps/web/DESIGN.md` from the documenter, journal, and 001 tasks note (R10).

## Complexity Tracking

| Deviation | Why needed | Simpler alternative rejected because |
|---|---|---|
| Reader rendering pulled forward from 004 | The reader design can't be judged without real text (R2) | A mock reader would be thrown away |
| Minimal Wrangler and D1 config pulled forward from 003 | AI needs a binding and storage for results (R3) | Browser-only storage loses results between devices |
