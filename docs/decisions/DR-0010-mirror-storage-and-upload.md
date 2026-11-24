# DR-0010: Mirror storage, upload path and deploy

Status: **proposed** (spec 003 plan, 2026-11-24). Supersedes parts of `docs/DESIGN.md`: the
presigned R2 uploads (section "longshelf CLI"), the normalised metadata tables (section "Data
model") and the CI deploy (`docs/PLAN.md` Phase 1).

## Context

Spec 003 puts the owner's library online on Cloudflare's free plan. Measured on 2026-11-24:
- 670 books and 3.3 GB;
- a 419 MB largest file, with two files over 100 MB;
- a 1.3 MB catalogue.

A Worker on the Free plan accepts at most 100 MB per request body and has 10 ms of CPU per
request ([limits](https://developers.cloudflare.com/workers/platform/limits/)).

## Options

| Question | Options assessed | Chosen |
|---|---|---|
| Upload path | Presigned R2 URLs (S3 key + SigV4, `aws4fetch` or hand-written); CLI writes to R2 with S3 keys; **through the Worker's R2 binding, multipart over 95 MB** | Binding |
| Metadata | Normalised tables + FTS (DESIGN.md); **one row per book with metadata JSON, plus a catalogue document built by the CLI** | Row per book + document |
| Rendering | Server rendering; **browser only** | Browser only |
| Deploy | GitHub Actions; **`pnpm run deploy` from the laptop** | Laptop |

## Decision

- Upload through the Worker's R2 binding.
- Store one D1 row per book, holding its metadata as JSON.
- Serve the catalogue as a content-addressed blob that the CLI builds.
- Render in the browser only.
- Deploy from the laptop.

Details are in `specs/003-library-mirror/research.md` R1, R2, R3 and R7.

## Rationale

- **Upload:** no S3 keys and no signing code, and only one credential lives on the laptop.
- **Metadata:** nothing reads normalised tables today. Search runs in the browser (DR-0008), and
  shelves come from the shared snapshot code.
- **Catalogue and rendering:** streaming a stored catalogue costs the Worker almost no CPU, where
  building or parsing it would not fit in 10 ms.
- **Deploy:** one person deploys, so a laptop deploy avoids putting a Cloudflare token in GitHub.

## Challenger

**Strongest case against:** the plan moves away from a design the owner already read.
Normalised tables would let future server features (highlights, reading stats) query by author
or series without loading JSON. And presigned uploads are the documented R2 pattern, which also
keeps 3 GB of traffic off the Worker.

**Ruling:**
- Upload traffic through the Worker waits on the network and isn't billed as CPU. Free-plan
  Workers bill requests, not bytes, so the cost argument doesn't hold at this size.
- Normalised tables can be added later by a migration that reads the JSON rows, when a feature
  needs them. That's cheap to reverse.
- CI can be added when there's a second contributor or a release cadence that needs it.

## Sources

- Workers limits: https://developers.cloudflare.com/workers/platform/limits/
- R2 pricing: https://developers.cloudflare.com/r2/pricing/
- D1 pricing: https://developers.cloudflare.com/d1/platform/pricing/
- Workers and Access: https://developers.cloudflare.com/workers/configuration/cloudflare-access/
- Read 2026-11-24.
