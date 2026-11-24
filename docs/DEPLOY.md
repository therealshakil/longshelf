# Deploying Longshelf

One person, one laptop, one Cloudflare account. Every step is a repository command or one
dashboard screen. Written for spec 003 (`specs/003-library-mirror/`). Decisions are in DR-0010.

## 1. Check the cost first (FR-025)

Expected recurring cost at about 700 books (3.5 GB): **$0 a month**. Everything fits Cloudflare's
free allowances. Check that these still hold before you start; if any page now shows a charge
for your size, stop.

| Service | Free allowance (read 2026-11-24) | Source |
|---|---|---|
| Workers | 100,000 requests a day, 10 ms CPU each | [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [limits](https://developers.cloudflare.com/workers/platform/limits/) |
| R2 | 10 GB-month, 1 M writes and 10 M reads a month, free egress | [R2 pricing](https://developers.cloudflare.com/r2/pricing/) |
| D1 | 5 M rows read and 100 k written a day, 500 MB per database | [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/) |
| Images | 5,000 unique transformations a month (fails rather than bills) | [Images pricing](https://developers.cloudflare.com/images/pricing/) |
| Workers AI | 10,000 neurons a day; Longshelf stops at 8,000 | [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/) |
| Access | Free for up to 50 users (ASSUMPTION: not re-read on 2026-11-24) | [Zero Trust plans](https://www.cloudflare.com/plans/zero-trust-services/) |

R2 may ask for a payment method once, even on the free allowance.

The only possible fixed cost is **Workers Paid at $5 a month**, needed only if a request regularly
needs more than 10 ms of CPU. Longshelf is built to avoid it (spec 003 spike log in `docs/PLAN.md`).

## 2. Create the resources

From the repository root, with Node 24 and `pnpm install` done:

```sh
pnpm --filter web exec wrangler login
pnpm --filter web exec wrangler d1 create longshelf     # copy the id into apps/web/wrangler.jsonc
pnpm --filter web exec wrangler r2 bucket create longshelf
```

In `apps/web/wrangler.jsonc`, set `routes` to your own domain (the owner's is
`library.longshelf.app`). The domain must be a zone in the same Cloudflare account. workers.dev
and preview URLs stay off, so the domain is the only way in.

## 3. Deploy

```sh
pnpm run deploy
```

This builds the mirror app, applies D1 migrations to the live database, and deploys the Worker.
Use `pnpm run deploy`, not `pnpm deploy` (a pnpm built-in). Migrations only ever add, so the
version still serving keeps working; a failed deploy leaves it in place.

Until step 4 is done, every request is refused with "Sign in to Longshelf to continue." That's
the Worker failing closed, not an error.

## 4. Lock it down with Cloudflare Access (US3)

In the [Cloudflare dashboard](https://dash.cloudflare.com):

1. **Workers & Pages → longshelf → Settings → Domains & Routes.** Next to your domain, choose
   **Enable Cloudflare Access** (or the Worker's **Access** tab → **Protect this Worker behind
   Access → All traffic**). If asked to set up Zero Trust, pick a team name and the **Free** plan.
2. **Manage Access app.** Keep one **Allow** policy with your email only. Set the application
   **session duration** to 1 month if offered (the Worker-level dialog stops at 7 days).
3. **[Zero Trust](https://one.dash.cloudflare.com) → Access → Service credentials → Service
   Tokens → Create.** Name it `longshelf-cli`. Copy the Client ID and Client Secret (shown once).
4. Back in the Access app → **Policies → Create new policy**: name `Upload command`, action
   **Service Auth**, include **Service Token** `longshelf-cli`. Add it to the app and save.
   Without it, the token is sent to the sign-in page like an anonymous request.
5. Give the Worker its three secrets. Read the team domain and AUD tag from the Access app's
   **Application values** (or from the `kid` in the sign-in redirect):

   ```sh
   cd apps/web
   pnpm exec wrangler secret put ACCESS_TEAM_DOMAIN   # e.g. yourteam.cloudflareaccess.com
   pnpm exec wrangler secret put ACCESS_AUD           # the app's AUD tag
   pnpm exec wrangler secret put CLI_CLIENT_ID        # the service token's Client ID
   ```

6. Configure the upload command on your laptop (stored with mode 0600):

   ```sh
   pnpm longshelf config set url https://library.example
   pnpm longshelf config set client-id <id>
   pnpm longshelf config set client-secret <secret>
   ```

**Rotate the upload key** (FR-017) without a redeploy: create a new service token, add it to the
`Upload command` policy, run `wrangler secret put CLI_CLIENT_ID` with its id, update the CLI
config, then delete the old token.

## 5. Prove nothing leaks (SC-004)

```sh
pnpm --filter web test:access https://library.example
```

Every route must send an anonymous visitor to sign-in, the upload key must reach only the upload
routes, and nothing may carry library data. Run it after every change to Access.

## 6. Upload your library

```sh
pnpm longshelf library --dry-run   # what would change
pnpm longshelf library
```

Run it again whenever Calibre changes. A run with nothing changed uploads nothing. If a run would
remove more than 10% of the mirror, it lists the books and asks first.

## Local development

`pnpm dev` and the e2e tests reach Workers AI through Access with the same service token, read
from the CLI config. See `CLAUDE.md` for every command.
