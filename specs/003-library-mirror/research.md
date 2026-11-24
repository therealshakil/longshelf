# Research: Library mirror (spec 003)

Sources read 2026-11-24 unless stated. Measurements are from the owner's library on 2026-11-24
(670 books), taken read-only with the DR-0009 reader.

## Measurements

| What | Value |
|---|---|
| Books | 670 (EPUB 634, MOBI 43, PDF 25, CBZ 10, CBR 1, one stray `PART`) |
| Library on disk | 3.3 GB. All book files 3.25 GB (EPUB 2.83 GB) |
| Largest file | EPUB, 419 MB. Two files are over 100 MB |
| Covers | 670, 201 MB in total, largest 2.6 MB |
| Catalogue as JSON | 1,304 KB (475 KB gzipped). 310 KB (62 KB gzipped) without descriptions |
| Catalogue `JSON.parse` | 27 ms on the owner's laptop (Node 24) |
| Reading the library | 249 ms |

## R1. Upload path for book files

- **Decision:** files go through the Worker into R2 using the R2 binding. Files up to 20 MB use
  one `put` with the SHA-256 checked by R2. Larger files use R2 multipart upload through the
  binding, in 10 MB parts.
- **Rationale:** a request body sent to a Worker is capped at 100 MB on the Free plan
  ([Workers limits](https://developers.cloudflare.com/workers/platform/limits/)), and the library
  has two files above that. Multipart through the binding needs no S3 keys, no request signing
  and no dependency. Streaming a body to R2 waits on the network, which doesn't count as CPU time
  (same page).
- **Alternatives:**
  - Presigned R2 URLs (`docs/DESIGN.md`): needs an R2 S3 API key stored as a Worker secret, plus
    SigV4 signing (`aws4fetch`, a new dependency, or about 60 hand-written lines). That's more
    moving parts for the same result. Superseded here; recorded in DR-0010.
  - The CLI writes to R2 directly with S3 keys: that's a second credential on the laptop, and the
    Worker never learns what arrived.
- **Integrity:** R2 verifies the SHA-256 on a single `put`. For multipart uploads the CLI hashes
  the file before sending, and the server checks the total size at completion.
  ASSUMPTION: a size check plus TLS is enough for the two files over 20 MB.

## R2. Where metadata lives, and what the app downloads

- **Decision:**
  - D1 holds one row per book: its metadata as JSON, a metadata hash, and its cover hash, plus
    the file rows. Server code (AI routes, ingest) queries these rows.
  - The browser gets the whole catalogue as one document. The CLI builds it from the same code
    the local mode uses, and uploads it as a content-addressed blob. The commit points D1 at it,
    and `GET /api/catalog` streams it with its hash as the ETag.
- **Rationale:**
  - `docs/DESIGN.md` already chose "whole catalog fetched as one JSON document, re-fetched only
    when its ETag changes".
  - A Worker on the Free plan has 10 ms of CPU per request (limits page). Building or parsing a
    1.3 MB document in the Worker (27 ms to parse on a laptop) would break that. Streaming a
    stored blob costs almost no CPU.
  - The browser parses it once per change.
- **Alternatives:**
  - The normalised tables in `docs/DESIGN.md` (`authors`, `series`, `tags`, link tables and
    FTS): nothing reads them now. Search runs in the browser (DR-0008), and shelves come from the
    shared snapshot code. They would add migrations and code for no current reader. Deferred
    until a server feature needs them (DR-0010).
  - The Worker builds the catalogue at commit: its CPU cost is uncertain at 10 ms.
  - Leaving descriptions out of the catalogue: saves 400 KB gzipped, but the book page would
    need a second request and its offline behaviour would get harder. Revisit if SC-003 fails.

## R3. Rendering: browser only

- **Decision:** `ssr = false` at the root layout. The Worker serves the app shell and the API,
  and pages load their data in the browser.
- **Rationale:** with server rendering, the Worker would fetch and parse the catalogue on every
  page load (R2, CPU). There is one signed-in user and no search engine to serve (FR-018).
  Spec 004 needs the app to run offline anyway, so it must render in the browser. Three routes
  already set `ssr = false`.
- **Strongest counter-argument:** server rendering shows the first screen sooner on a slow phone.
  **Ruling:** the shell and catalogue are cached after the first visit (R6), so later loads don't
  wait on the network. SC-003 is measured on 4G to check this.

## R4. Cover thumbnails

- **Decision:** when a cover is uploaded, the Worker makes a 400 px wide WebP thumbnail with the
  Images binding and stores it in R2 beside the original. Screens use the thumbnail, and the book
  page uses the original.
- **Rationale:**
  - The covers average 300 KB, with the largest at 2.6 MB. A Library screen of them over 4G
    would miss SC-003.
  - The Free plan includes 5,000 unique transformations a month, and going over fails rather than
    bills ([Images pricing](https://developers.cloudflare.com/images/pricing/)). The first upload
    uses 670. Later runs only transform new covers.
  - Calling the binding from Worker code doesn't depend on the hostname
    ([Images binding](https://developers.cloudflare.com/images/optimization/binding/)).
  - ASSUMPTION: the binding works for a Worker served only on workers.dev. Task T-spike checks
    this first.
- **Fallback:** if the binding fails, the original is served, so screens still work, only slower.
- **Alternatives:** `sharp` in the CLI is a native dependency, needs asking, and adds a build
  risk on macOS and Linux. Calibre's own thumbnail cache isn't in the library folder. URL-based
  transformations need a zone.

## R5. Access

- **Update 2026-11-24:** the owner has the domain `longshelf.app`. The library is served only at
  the custom domain `library.longshelf.app`. workers.dev and preview URLs are off, so Access on
  that hostname is the only way in. The bare domain stays free for a public project page.
- **Decision:** Cloudflare Access on the Worker, using the one-click setting for the workers.dev
  hostname, with "All traffic", one Allow policy for the owner's email, and a Service Auth policy
  for one service token used by the CLI. Session length is 30 days (FR-016).
- **Rationale:** Access can protect a Worker's workers.dev URL and previews from the Worker's
  settings, and the Worker reads the identity from `ctx.access`
  ([Workers: Cloudflare Access](https://developers.cloudflare.com/workers/configuration/cloudflare-access/),
  [changelog](https://developers.cloudflare.com/changelog/post/2025-10-03-one-click-access-for-workers/)).
  No custom domain is needed.
- **Fail closed:** the Worker also refuses (403) any request that arrives without an Access
  identity, so turning Access off by mistake exposes nothing (SC-004). Ingest routes accept only
  the service token's identity. Browser routes accept only the owner's email.
  - ASSUMPTION: `ctx.access` is available through `platform.ctx` in the SvelteKit Cloudflare
    adapter, and it identifies service tokens. Checked in the spike task. The fallback is
    validating `Cf-Access-Jwt-Assertion` against the team's JWKS with WebCrypto, which needs no
    dependency.
- **PWA under Access:** the manifest link needs `crossorigin="use-credentials"`, or browsers fetch
  it without the Access cookie and get the login page. ASSUMPTION, based on how browsers fetch
  manifests. Checked on a phone in quickstart step 6.
- **Cost:** Access is free for up to 50 users on the Zero Trust Free plan. ASSUMPTION: not
  re-checked today; it's checked on the pricing page during setup (quickstart step 1).

## R6. Installable app and offline shell

- **Decision:** SvelteKit's native `src/service-worker.ts` (`docs/DESIGN.md`):
  - The build's app shell is precached.
  - Covers and thumbnails are cache-first, because their URLs are content hashes and so never
    change.
  - `/api/catalog` is network-first, falling back to the cache.
  - Page navigations are network-first, falling back to the cached shell.
  - A new service worker takes over on the next open (FR-021). Open readers aren't interrupted.
- **Rationale:** it's built in, with no plugin (Longshelf principle 1). Dexie is held back until
  spec 004 needs an outbox.
- **Expired session:** when Access returns its login redirect to a network-first request, the
  service worker serves the cache and the page shows "Sign in again" in the sync status. It never
  silently shows an empty library.

## R7. Deploy and migrations

- **Decision:** `pnpm run deploy` (`pnpm deploy` alone is a pnpm built-in) runs a build, then
  `wrangler d1 migrations apply longshelf --remote`, then `wrangler deploy`. Migrations are
  additive only (new tables or columns), so the version still serving works before and after
  (FR-024). `wrangler deploy` uploads a whole new version, and a failed upload leaves the old one
  in place. The Worker is renamed `longshelf`.
- **CI deploy deferred:** a GitHub Actions deploy would need a Cloudflare API token stored in
  GitHub, for one person who deploys from their laptop. Deploying locally is simpler and has
  fewer secrets. Recorded in DR-0010. `docs/PLAN.md` drops CI from Phase 1.
- **Rows written:** the first ingest writes about 670 book rows plus about 750 file rows, under
  the 100,000 a day the Free plan allows
  ([D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/)).

## R8. CLI shape

- **Decision:**
  - `packages/sync-cli` provides the `longshelf` binary (Node 24, no dependencies beyond
    `@longshelf/shared`).
  - The Calibre reader moves from `apps/web/scripts/local-calibre.ts` into the CLI package, so
    local mode and the CLI read the library the same way.
  - Configuration lives in `~/.config/longshelf/config.json` (mode 0600; macOS uses
    `~/Library/Application Support/longshelf/`), with `LONGSHELF_*` environment variables
    taking priority.
  - Files are hashed with `node:crypto` streams, and a cache keyed by path, size and mtime skips
    rehashing unchanged files (SC-002).
- **Rationale:** reusing the DR-0009 reader removes a second Calibre schema dependency. The hash
  cache is what makes a run with no changes finish in under 30 seconds. Rehashing 3.25 GB each
  run would take longer. ASSUMPTION: about 300 MB/s, so over 10 s for hashing alone.

## R9. Cost at the owner's size

| Service | Free allowance | Expected use | Source |
|---|---|---|---|
| Workers requests | 100,000 a day | Hundreds a day | [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) (ASSUMPTION: figure not re-read today) |
| Workers CPU | 10 ms a request | Catalogue and files stream. AI routes need a check (risk below) | [Limits](https://developers.cloudflare.com/workers/platform/limits/) |
| R2 storage | 10 GB-month | About 3.5 GB (files, covers, thumbnails, catalogue versions) | [R2 pricing](https://developers.cloudflare.com/r2/pricing/) |
| R2 Class A (writes) | 1 M a month | About 2,000 on the first run, then tens | same |
| R2 Class B (reads) | 10 M a month | Thousands | same |
| R2 egress | Free | Any | same |
| D1 | 5 M rows read and 100 k written a day, 500 MB per database | About 1,500 rows | [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/) |
| Images | 5,000 unique transformations a month | 670 once, then new covers | [Images pricing](https://developers.cloudflare.com/images/pricing/) |
| Workers AI | 10,000 neurons a day, guarded at 8,000 | As in spec 002 | spec 002 research R5 |
| Access | 50 users | 1 user, 1 service token | ASSUMPTION, see R5 |

**Expected recurring cost: $0.**

**Risk:** AI routes that score the whole library may exceed 10 ms of CPU on the Free plan. The
spike measures them on the real catalogue. If they do, the options are moving the work out of the
request (as spec 002 R6 did for neighbours), or Workers Paid at $5 a month, which is a fixed cost
needing the owner's agreement first (FR-025).

## R10. Saving a file to the device (FR-012)

- **Decision:** the book page's existing More menu gains "Save a copy", with one item per format.
  It links to `/api/files/<sha256>?download=<Title - Author>.<ext>`, which sets
  `Content-Disposition: attachment`.
- **Not changed:** the Download toggle (keep the book on this device) stays as spec 002 designed
  it and is built in spec 004.
- **Approval:** the owner sees a sketch of the menu before it's built
  (owner rule: preview designs before building).
