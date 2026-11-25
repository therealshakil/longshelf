# DR-0012: GitHub Actions checks and per-PR previews on Worker Previews

Status: **accepted** (owner, 2026-11-25). Production deploys stay as in DR-0010.

## Context

There was no CI. The only way to try a change on Cloudflare was to deploy it to production,
which holds the owner's library. The owner wants every pull request checked and testable
somewhere that is not production.

Requirements:
- Lint, type checks, unit tests and a build on every pull request and push to `main`.
- Each pull request gets its own address that runs on Cloudflare, signed-in only.
- A preview must never read or write production data (D1, R2).
- Production is still deployed only by `pnpm run deploy`.
- No new recurring cost; one person can run it.

## Options

| Option | For | Against |
|---|---|---|
| Version URLs (`wrangler versions upload --preview-alias pr-N`) | Simple, long available | Run "against your production resources" ([Version URLs](https://developers.cloudflare.com/workers/configuration/previews/)). Fails the main requirement. |
| **Worker Previews** (`wrangler preview`, existing solution) | Previews "do not inherit production settings"; bindings can point at separate D1 and R2 ([Previews configuration](https://developers.cloudflare.com/workers/previews/configuration/)). Free plan: 100 previews per Worker ([Previews](https://developers.cloudflare.com/workers/previews/)) | Open beta (`wrangler preview --help`, wrangler 4.161.0). Needs `preview_urls` on to get a URL. |
| Separate `longshelf-preview` Worker via `--env` | Full isolation, mature | A second Worker, Access app and set of secrets to keep in step. One URL, not one per PR. |
| Run previews with Cloudflare Workers Builds (existing solution) | No API token in GitHub; posts the PR comment itself ([Previews examples](https://developers.cloudflare.com/workers/previews/examples/)) | Config lives in the dashboard; builds everything a second time; free plan allows 1 build at a time and 3,000 minutes a month ([Builds limits](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/)) |
| **GitHub Actions** for checks and previews | Free for public repositories ([GitHub billing](https://docs.github.com/en/billing/managing-billing-for-your-products/managing-billing-for-github-actions/about-billing-for-github-actions)); everything is in the repo; the preview runs only after checks pass | A Cloudflare API token is stored in GitHub |

## Decision

- **GitHub Actions** runs `.github/workflows/ci.yml` on every pull request and push to `main`:
  install, lint, typecheck, unit tests and the mirror build. Playwright and the accessibility
  matrix stay on demand (as before).
- For pull requests from branches in this repository, the same job applies D1 migrations to the
  preview database and runs `wrangler preview --name pr-<N>`. It posts the link as one PR comment,
  updated on each push. `preview-cleanup.yml` deletes the preview when the PR closes.
- Previews bind `longshelf-preview` (D1) and `longshelf-preview` (R2), seeded once with the
  licence-free test library. All previews share them; migrations only ever add (DEPLOY.md).
  Migrations go through `apps/web/wrangler.preview-migrations.jsonc`, the pattern from
  [Previews resources](https://developers.cloudflare.com/workers/previews/resources/).
- Previews sit behind the Worker's existing **All traffic** Access app
  ([Cloudflare Access for Workers](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)),
  which already covered them: a preview's sign-in redirect carries the same AUD as the custom
  domain's (checked 2026-11-25). Previews get the production Access values as secrets. The app's
  own check (`access.ts`) still fails closed.

## Challenger

Strongest case against: **Workers Builds** needs no long-lived Cloudflare token in a public
repository, and a leaked token could touch production. Ruling: GitHub Actions. The token is
scoped to one account and to Workers, D1 and R2 only. Secrets never reach pull requests from
forks, and the workflows use `pull_request`, never `pull_request_target`. Keeping the checks and
the preview in one place, with the preview gated on the checks, is worth that remaining risk.
Revisit if the repository gains collaborators.

Second case against: Previews are in open beta. Ruling: accept. If they change or go away, the
fallback is the `--env` preview Worker above. Production does not depend on them.

## Consequences

- `preview_urls` is on for the Worker. This also gives production versions their own
  workers.dev URLs. They run against production data but leak nothing: the Worker refuses any
  request without a valid Access token for the production AUD (`access.ts`, SC-004).
  `workers_dev` stays off, so `longshelf.<subdomain>.workers.dev` doesn't exist.
- Version URLs also sit behind that Access app (anonymous request to a production version URL
  redirected to sign-in, 2026-11-25).
- Owner setup: one API token, two GitHub secrets, three preview secrets (`docs/DEPLOY.md`
  section 7). No second Access app was needed.
