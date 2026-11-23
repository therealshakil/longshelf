# DR-0006: Product name is Longshelf

Status: **accepted** (owner, 2026-11-23). The codebase rename is a separate, later step.

## Context

The working name, Ribbon, is crowded: its domains, npm name and GitHub name are all taken, and
Netflix has a well-known `ribbon` library. The project needs a name for an open-source and hosted
book library service. The owner asked for an English name that evokes books, and later allowed
Swahili words.

## Options

Checked 2026-11-23 through RDAP, npm, GitHub and web search. About 80 names were screened.

| Option | Result | Verdict |
|---|---|---|
| **Longshelf (chosen)** | `.org`, `.app`, `.dev`, GitHub name, npm, PyPI and crates.io free. No repo or book product found. `.com` is for sale by a reseller | Clear, easy to spell, evokes books |
| Utepe (Swahili, "ribbon") | `.org`, `.app`, `.dev` and npm free. GitHub name held by an individual | Good story, harder to spell, does not evoke books |
| Tailband (bookbinding term) | `.org`, `.app`, `.dev`, npm and GitHub free. `tailband.com` is a music act | Sounds like a wearable |
| Endleaf, Lampleaf, Shelfmark, Bindery, Folio | Already used by book or reading software | Rejected |

Sources: [Glosbe, "ribbon" in Swahili](https://glosbe.com/en/sw/Ribbon),
[Endleaf](https://alternativeto.net/software/endleaf/about/), [Lampleaf](https://lampleaf.com/),
[Shelfmark](https://github.com/calibrain/shelfmark), [Bindery](https://github.com/vavallee/bindery),
[Netflix Ribbon](https://github.com/Netflix/ribbon), [Tailband](https://www.tailband.com/).

## Decision

Use **Longshelf**. It suggests a library kept for the long term and echoes "long shelf life".

## Challenger

Strongest case against: "Without the `.com`, some visitors will land on the wrong site, and the
name could be bought by someone else first."

Ruling: accepted risk. `.org` for the project and `.app` for the hosted service are credible homes
for open-source software. The `.com` can be bought later if the project earns it.

## Open before public launch

- Official trademark registers (USPTO, UKIPO, EUIPO) have **not** been searched.

## Update: domains registered (2026-11-23)

The owner registered both domains through Cloudflare. Each is a recurring annual cost.

- `longshelf.app`: the hosted version, starting with the owner's own library.
- `longshelf.org`: the open-source project.

Both sites will be specified separately later.
