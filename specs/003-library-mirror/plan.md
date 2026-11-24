# Implementation Plan: Library mirror

**Branch**: `003-library-mirror` | **Date**: 2026-11-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-library-mirror/spec.md`

## Summary

Put the owner's Calibre library online, privately, on their own Cloudflare account, and point the
spec 002 screens at it:

- **Upload:** the `longshelf library` CLI reads Calibre read-only, using the DR-0009 reader. It
  hashes files with a cache and asks the Worker what's missing. It uploads through the Worker's
  R2 binding, in parts for files over 95 MB, then commits in one D1 batch.
- **Read:** the browser downloads the whole catalogue as one ETag-cached document and builds the
  existing snapshot `LibrarySource` from it. Covers and files are served from R2 by content hash.
  Thumbnails are made once, at upload.
- **Access:** Cloudflare Access on the custom domain `library.longshelf.app` (workers.dev off), set up with the one-click option: the
  owner by email, the CLI by service token. The Worker also refuses any request without an Access
  identity.
- **App:** browser rendering only, plus SvelteKit's own service worker.
- **Deploy:** `pnpm run deploy`, with additive migrations. Expected cost $0 a month.

Decisions are in [research.md](research.md) R1 to R10, and
[DR-0010](../../docs/decisions/DR-0010-mirror-storage-and-upload.md) supersedes the parts of
`docs/DESIGN.md` they change.

## Technical Context

**Language/Version**: TypeScript 6, Svelte 5, Node 24 (CLI).

**Primary Dependencies**: the agreed stack only. SvelteKit 3 with adapter-cloudflare, Zod, and
`node:sqlite` and `node:crypto` in the CLI. There are no new npm dependencies: Access JWT checks,
if needed, use WebCrypto (R5).

**Storage**:
- D1: `book`, `book_file`, `blob`, `catalog` and `ingest_run` ([data-model.md](data-model.md)).
- R2: files, covers, thumbnails and catalogues, keyed by SHA-256.
- Service worker Cache Storage in the browser.
- A hash cache in the CLI's config folder.

**Testing**:
- Vitest:
  - CLI: plan diffing, the hash cache, the removal guard, the report text, and multipart
    splitting.
  - Ingest handlers (`@cloudflare/vitest-pool-workers`, with D1 and R2 in miniflare):
    idempotency, the lock, commit atomicity, rejecting a commit with missing blobs, and garbage
    collection.
  - Mirror read routes: ETag/304, Range, the download filename, and 403 without an identity.
- Playwright + axe: existing routes against a mirror-mode preview seeded by running the CLI on
  the fixture library.
- `test:access`, a script that probes a live deployment (quickstart step 4).
- Fixture library: Standard Ebooks titles only.

**Target Platform**: a Cloudflare Worker on the custom domain `library.longshelf.app`. Evergreen browsers on phone and desktop.
The CLI on Linux and macOS.

**Project Type**: web application plus CLI, in the pnpm workspace.

**Performance Goals**:
- SC-001: full upload in under 1 hour at 20 Mbit/s.
- SC-002: a run with no changes in under 30 s.
- SC-003: first covers in under 3 s on 4G.

**Constraints**:
- Worker Free plan: 10 ms CPU per request and a 100 MB request body.
- D1 Free: 100,000 rows written a day.
- Images: 5,000 unique transformations a month.
- Calibre is never written.
- Nothing is readable without Access.

**Scale/Scope**:
- 670 books, about 3.5 GB in R2.
- A 1.3 MB catalogue (475 KB gzipped).
- 9 new API routes and 1 CLI package.
- The spec 002 screens are wired, not redesigned.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | How |
|---|---|---|
| I. Calm & low-load | Pass | The CLI prints one report with the next action. A run with no changes says "Nothing changed". An expired sign-in shows "Sign in again", not an empty library. |
| II. Outcomes over ceremony | Pass | The gates are quickstart's live checks: access probe, upload twice, phone offline, Calibre unchanged. |
| III. Dual interface | Pass | Operator view: CLI report and exit codes, `longshelf config show`, and `docs/DEPLOY.md`. The owner view is the app. |
| IV. What, not how | Pass | The spec is tool-free. Tools are named here and in DR-0010. |
| V. Adopt before building | Pass | Cloudflare Access (not our own auth), R2 multipart (not our own chunk store), SvelteKit's service worker, the Images binding (R4), and the DR-0009 reader is reused. Presigned URLs and `aws4fetch` were assessed in R1. |
| VI. Decisions recorded | Pass | DR-0010 supersedes `docs/DESIGN.md` on presigned uploads, normalised metadata tables and CI deploy. |
| VII. Challenger before locking | Pass (same session) | Counter-cases are in R1, R2 and R3 and in DR-0010. The owner rules when reviewing this plan. |
| VIII. Cite or mark assumption | Pass | Limits and prices are cited with the read date. Five ASSUMPTIONs are named, each with a check. |
| IX. Economy | Pass | $0 a month expected (R9). The one possible fixed cost (Workers Paid, $5 a month) is flagged and needs the owner's agreement. No new dependencies. |
| X. Solo-operable | Pass | Everything runs from the laptop. The one manual step is the Access set-up, a few dashboard screens, documented. |
| XI. Honest by construction | Pass | AI on by default, with plain disclosure in Settings (FR-026). The library stays in the owner's account. Nothing is indexed. |

Re-check after Phase 1: no violations. The risk to watch is Worker CPU on AI routes (R9). It's
measured in the first task, and any fixed cost needs the owner's agreement.

## Project Structure

### Documentation (this feature)

```text
specs/003-library-mirror/
├── spec.md
├── plan.md               # this file
├── research.md           # R1–R10, measurements, costs
├── data-model.md         # D1 tables, R2 keys, catalogue
├── quickstart.md         # live validation; becomes docs/DEPLOY.md
├── contracts/
│   ├── ingest-api.md     # CLI → Worker
│   ├── mirror-api.md     # browser → Worker, LibrarySource wiring
│   └── cli.md            # longshelf commands, config, output, exit codes
├── checklists/requirements.md
└── tasks.md              # /speckit-tasks
```

### Source Code (repository root)

```text
packages/shared/src/
├── library/types.ts      # Book gains sort, rating (data-model.md)
├── library/catalog.ts    # MirrorCatalog type + builder from a LibrarySnapshot
└── ingest.ts             # Zod schemas for /api/ingest/*

packages/sync-cli/        # NEW: the longshelf CLI
├── package.json          # bin: longshelf
├── src/
│   ├── calibre.ts        # moved from apps/web/scripts/local-calibre.ts (readCalibreSnapshot)
│   ├── hash-cache.ts
│   ├── config.ts
│   ├── upload.ts         # plan, single and multipart blobs, commit, abort
│   ├── report.ts
│   └── main.ts
└── test/fixtures/library # small licence-free Calibre library

apps/web/
├── wrangler.jsonc        # name longshelf; R2 + IMAGES bindings; real D1 id
├── migrations/0004_mirror.sql
├── scripts/local-calibre.ts      # now imports the reader from @longshelf/sync-cli
├── scripts/test-access.ts        # live access probe (quickstart 4)
├── static/robots.txt             # Disallow: /
└── src/
    ├── hooks.server.ts           # Access identity required; noindex header; AI-off rule kept for local mode
    ├── service-worker.ts         # NEW (research R6)
    ├── app.html                  # manifest crossorigin="use-credentials"
    ├── lib/library/index.ts      # getLibrary(fetch): sample | local | mirror
    ├── lib/server/mirror/        # access.ts, blobs.ts, ingest.ts, catalog.ts, server-library.ts
    └── routes/
        ├── +layout.ts            # ssr = false; awaits getLibrary
        ├── api/catalog/+server.ts
        ├── api/covers/[sha]/+server.ts
        ├── api/files/[sha]/+server.ts
        └── api/ingest/...        # plan, blobs, multipart, commit, abort

docs/
├── DEPLOY.md             # setup and deploy procedure, from quickstart 1–3
└── decisions/DR-0010-mirror-storage-and-upload.md
```

**Structure Decision**: the existing workspace. The CLI is the planned `packages/sync-cli`
(CLAUDE.md layout). Server mirror code sits under `lib/server/mirror/`, beside `lib/server/ai/`.

## Delivery order

1. **Spike (first task):** deploy an empty Worker with Access, and confirm:
   - that `platform.ctx.access` identifies the owner and the service token;
   - that the Images binding runs on workers.dev;
   - the CPU time of `/api/catalog`, and of read-next on a 670-book catalogue.

   Record the results in `docs/PLAN.md`'s spike log. A failure changes the R4 or R5 fallback, or
   raises the Workers Paid question with the owner.
2. Shared types and the CLI reading and hashing (no network). Local mode keeps working on the
   moved reader.
3. Ingest API and CLI upload (US1).
4. Read API and browser wiring (US2), and the "Save a copy" menu after the owner approves a sketch.
5. Access hardening and the probe (US3).
6. Service worker and manifest (US4).
7. `docs/DEPLOY.md`, the real-library run, and the SC timings (US5, quickstart 8).

## Complexity Tracking

No constitution violations.
