# DR-0007: Longshelf logo

Status: **accepted** (owner, 2026-11-23).

## Context

The app shipped the default Svelte favicon and had no app icons or web manifest. Longshelf
(DR-0006) needs one mark that works from a 16px browser tab to an installed app icon.

## Options

Existing tools assessed on 2026-11-23, by reading their code and docs:

| Tool | Result | Verdict |
|---|---|---|
| **[logo-design-skill](https://github.com/kaankiziltug/logo-design-skill) (chosen)** | MIT, standard-library Python, size tests and web icon export | Used at commit `e9eaddc`, installed outside the repo |
| [brand-identity-skill](https://github.com/fatihaydost/brand-identity-skill) | MIT, designs a whole identity, installs Python dependencies | More than needed, the visual design is already approved |
| [TryOpenData svg-design](https://skills.sh/tryopendata/skills/svg-design) | General SVG guidance | Not a logo pipeline |

The skill's reference logos are their owners' trademarks and are not in this repo.

Concepts shown to the owner: Folded Ribbon, **Bookend (chosen)** and Bookmark.

## Decision

- **Mark:** an L-shaped bookend holding a leaning book.
- **Colour:** ink and the oxblood accent, using the app's tokens in the header. The app icon is a
  paper-coloured mark on oxblood.
- **Small sizes:** a heavier cut aligned to the 16px grid.
- **Wordmark:** Literata, the app's title font, so no font is added.
- **Sources:** master SVGs are in `docs/brand/`. Generated icons are in `apps/web/static/`.

## Challenger

Strongest case against: "The tilted book is the mark's weakest part at 16px, and the Folded Ribbon
was the more distinctive option."

Ruling: accepted by the owner's choice. Bookend links directly to the name, and the L still reads
at 16px when the book softens.

## Open before public launch

- No trademark or reverse-image search has been run on the mark.
- Icons have not been checked on a real phone or tablet install.
