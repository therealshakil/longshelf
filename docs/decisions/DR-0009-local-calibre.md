# DR-0009: Run locally against a Calibre library

Status: **accepted** (owner request, 2026-11-23).

## Context

The owner wants to run the app on their own library before the cloud mirror (spec 003) exists. The
library is private and copyrighted, and the repository is public. Calibre stays the source of truth.

## Options

| Option | Assessment |
|---|---|
| Calibre Content Server | Mature and official, but needs a second process and its API doesn't return the app's data shape directly. |
| `calibredb list --for-machine` | Official, but it doesn't expose every link needed in one call and is slower to start. |
| Read `metadata.db` read-only with `node:sqlite` | No dependency, and it is how `docs/DESIGN.md` already plans the CLI to read. Depends on Calibre's schema. |
| Build the mirror first | The real answer later, but needs Cloudflare setup and doesn't serve a quick local run. |

## Decision

Add `pnpm dev:calibre`, a dev-server mode that reads `metadata.db` read-only at startup and serves
covers and EPUBs from the library to localhost only.

## Rationale

It adds no dependency or service and uses the existing `LibrarySource` swap point. Production builds
get a null module, so no library data can enter them.

**Strongest counter-argument:** reading Calibre's schema directly can break when Calibre changes it.
Ruled acceptable: the mode is dev-only, a failure is loud at startup, and the planned CLI takes the
same dependency.

## Limits

- AI routes are off in this mode, so no book text or metadata leaves the machine.
- Reading progress isn't shown from Calibre yet. The Kobo columns were empty when checked on 2026-11-23.
- The reader opens EPUB only. Restart the dev server to pick up library changes.

## Sources

- Calibre database API: https://manual.calibre-ebook.com/db_api.html
- Node `node:sqlite`: https://nodejs.org/api/sqlite.html
