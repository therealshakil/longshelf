# DR-0011: Showcase library uses the US public-domain rule

Status: **accepted** (owner, 2026-11-24). Applies to the public showcase library (`docs/PLAN.md`
Phase 2), not the private mirror.

## Context

The showcase is a public deployment that anyone can open from anywhere. Its first collection is
public-domain books by authors of African descent (`docs/showcase/african-descent.md`). Whether
a book is in the public domain depends on the country:
- **US:** anything published in 1930 or earlier is public domain in 2026. Works from 1931 join
  on 1 January 2027. Some books from 1931–1963 are also free because their copyright was never
  renewed ([Cornell copyright term chart](https://guides.library.cornell.edu/copyright/publicdomain)).
- **Many other countries:** a book stays protected until 70 years after its author died, so only
  authors who died in 1955 or earlier are free in 2026.

The two rules give different collections. Under the 70-year rule we would lose, for example,
*The Souls of Black Folk* (Du Bois died 1963), *Cane* (Toomer, 1967), *Quicksand* (Larsen, 1964)
and *The Weary Blues* (Hughes, 1967).

## Options

| Option | What it means |
|---|---|
| **US rule** | Books that are public domain in the US. |
| 70-year rule | Only authors who died in 1955 or earlier. |
| Both, by region | Serve some books only to US visitors. This needs geolocation and a second catalogue, so it breaks Longshelf principle 1 (few moving parts). |
| Adopt others' clearance (assessed existing solution) | Standard Ebooks and Project Gutenberg each check US copyright before publishing a book ([Gutenberg policy](https://www.gutenberg.org/policy/permission.html), [Standard Ebooks: about](https://standardebooks.org/about)). Reusing their check means we don't have to research each title. |

## Decision

The showcase uses the **US rule**, and books are checked this way:
- **Standard Ebooks and Project Gutenberg** books are accepted on those sites' own US check.
- **Other sources** (Internet Archive, HathiTrust, Wikisource): a book is accepted only if its
  first edition was published in 1930 or earlier. Each year on 1 January, the cutoff moves
  forward one year.
- **Translations** follow the publication date of the translation, not the original.

## Rationale

- The owner asked for the US rule and for as complete a collection as possible.
- The US rule keeps the Harlem Renaissance, which is the core of the collection.
- Reusing the Standard Ebooks and Gutenberg checks removes most of the per-title copyright work.

## Challenger

**Strongest case against:** the site is served worldwide, so a book that is free in the US can
still be under copyright where a visitor lives. In 2018, a German court case led Project
Gutenberg to block every visitor from Germany for about three years (ASSUMPTION: details are from
memory and have not been checked). A rights holder could take the same route.

**Ruling:** accept the risk. It is low for a single-person, non-commercial site that shows a
small set of books. Two mitigations:
1. The site gives a takedown contact.
2. The candidate list records each author's death year where it is known, so post-1955 authors
   can be pulled quickly if a request arrives.

Revisit this decision if a takedown request arrives or if the site starts making money.

## Sources

- Cornell University Library, "Copyright Term and the Public Domain in the United States".
- Project Gutenberg, "Permissions: How to Use Project Gutenberg eBooks".
- Standard Ebooks, "About".
