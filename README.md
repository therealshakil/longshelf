# Longshelf

A private cloud mirror of a Calibre library, with a web reader you can install on your phone and
use offline. One person per deployment, on their own Cloudflare account. Calibre stays the source
of truth: Longshelf only reads it.

## Mirror your library

1. Set up a deployment: [docs/DEPLOY.md](docs/DEPLOY.md). It names every recurring cost first;
   at about 700 books it fits Cloudflare's free allowances.
2. Upload, and upload again whenever Calibre changes:

   ```sh
   pnpm longshelf library
   ```

## Develop

Node 24, pnpm via corepack.

```sh
pnpm install
pnpm dev            # sample library
pnpm dev:calibre    # your local Calibre library, read-only, AI off
pnpm test           # unit tests
```

Every command is listed in [CLAUDE.md](CLAUDE.md). The architecture is in
[docs/DESIGN.md](docs/DESIGN.md), the roadmap in [docs/PLAN.md](docs/PLAN.md), and decisions in
[docs/decisions/](docs/decisions/).
