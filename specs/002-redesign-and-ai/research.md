# Research: 002 Redesigned screens and AI features

Date: 2026-11-18. Each item: Decision, Rationale, Alternatives, Sources. Claims without a source
are labelled ASSUMPTION. Prices were read on 2026-11-18 (see DR-0003 for the full table).

---

## R1. Where the screens get their data before the mirror exists (FR-007)

**Decision:** one `LibrarySource` interface ([contracts/library-source.md](contracts/library-source.md))
with a `SampleLibrary` implementation built from the licence-free Standard Ebooks set already in
`design-mocks/` (96 books, their covers, invented collections, progress and periodicals). Spec
003 (mirror) adds a second implementation backed by the real catalogue. Screens only ever talk
to the interface.

**Rationale:** the screens get built and reviewed now. Swapping the data source changes no
screen (FR-007). The fixture data is public domain, so it can be committed
(Standard Ebooks: https://standardebooks.org/about).

**Alternatives:** generate fake books (the rejected first build did this; it hid real-cover
problems). Wait for the mirror (blocks the owner's main ask for weeks). Use the owner's Calibre
library (private and copyrighted; excluded by memory rule and DR-0002).

## R2. Reader engine in this spec

**Decision:** bring the pinned foliate-js submodule and the `Reader.svelte` wrapper forward from
the read spec (now 004) into 002, enough to open a book, paginate or scroll, report position,
list the contents and apply text settings. Offline storage of books, the progress outbox and
cross-device merge stay in 004 and 005.

**Rationale:** the reader is the owner's strongest surface. Its design (typography, Night,
tap-to-hide) can only be judged on real rendered text. A fake reader would be thrown away. The
stack already names foliate-js (CLAUDE.md; docs/DESIGN.md "Client").

**Sample books:** three Standard Ebooks EPUBs. Middlemarch, Moby Dick and Meditations match the
mock. Standard Ebooks' robots.txt blocks automated downloads for AI user agents
(`Disallow: /ebooks/*/downloads/*` for `claude-user` and others, read 2026-11-18), so **the owner
downloads the three files by hand** into `apps/web/static/sample/books/`. They are CC0
(https://standardebooks.org/about).

**Challenger:** "Pulling the reader forward drags in the hardest dependency early and blurs the
spec boundary." Ruling: only the rendering wrapper moves. Storage and sync stay put. The wrapper
was always going to be built first in 004, so this is the same work earlier.

## R3. Cloudflare resources this spec needs (AI, storage for AI results)

**Decision:** add the minimum Wrangler config to `apps/web`: a Workers AI binding and one D1
database with the AI tables in [data-model.md](data-model.md). Deploy setup and CI stay in the
mirror spec (003), which extends this config.

**Rationale:** the AI features need a model binding and somewhere to keep genre suggestions,
chapter summaries, embeddings and dismissals. Both live in the owner's own account (FR-018).

**Alternatives:** keep AI results in the browser only (lost per device; can't be shared between
phone and laptop). KV (no queries; awkward for suggestions). Vectorize for embeddings (adds a
service; 700 vectors are small enough for an in-Worker scan, see R6).

**Fixed cost:** none, if usage stays inside the Workers AI free allowance (R5). ASSUMPTION: D1's
free tier covers these tables (a few MB), as docs/DESIGN.md "Cost" already assumes.

## R4. Models (FR-010 to FR-014, FR-017, FR-018)

| Job | Model (Workers AI) | Why | Price per M tokens (in / out) |
|---|---|---|---|
| Chapter summaries, genre suggestions, "why it matched" | `@cf/qwen/qwen3-30b-a3b-fp8` | Cheapest capable general model listed; mixture-of-experts | $0.051 / $0.335 |
| Recap assembly (from summaries) | `@cf/qwen/qwen3-30b-a3b-fp8`, with `@cf/openai/gpt-oss-120b` as the quality step-up if SC-004 fails | Short inputs once summaries exist; the larger model is still cheap | $0.35 / $0.75 for gpt-oss-120b |
| Embeddings (similarity, plain-language search) | `@cf/google/embeddinggemma-2` | Cheapest listed embedding model | $0.0017 |

Source: Workers AI pricing, https://developers.cloudflare.com/workers-ai/platform/pricing/ (read
2026-11-18). The model ID is configuration, so changing it needs no code change.

Context windows were not listed on the pricing page. ASSUMPTION: a single chapter (typically
under 15k tokens) fits these models. The plan avoids whole-book prompts entirely (R5).

### R4 update, 2026-11-20 (supersedes the table above for text and embeddings)

Cloudflare deprecated `qwen3-30b-a3b-fp8` and `embeddinggemma` on 2026-11-20; the first real
call failed with error 5028. Replacements, from `wrangler ai models list` (read 2026-11-20):

| Job | Model | Price per M tokens (in / out) | Why |
|---|---|---|---|
| Summaries, recaps, genres, "why it matched" | `@cf/google/gemma-4-26b-a4b-it` | $0.10 / $0.30 | Cheapest non-deprecated general model with a 256k context; mixture-of-experts |
| Recap step-up (unchanged) | `@cf/openai/gpt-oss-120b` | $0.35 / $0.75 | Still listed |
| Embeddings | `@cf/baai/bge-m3` | $0.0118 | Not deprecated, multilingual, 60k context |

Considered and rejected:
- `glm-4.7-flash` ($0.06 / $0.40): cheaper input, but a 131k context and pricier output.
- `clef-flash` ($0.038): a 24k context, which a long chapter would exceed.
- `llama-3.2-3b`: deprecated the same day.

Cost is about twice the qwen estimate, still well under $0.01 a reading day.

Findings from the first real calls:
- Gemma thinks before answering by default and spent the whole token budget doing so. The calls
  now pass `chat_template_kwargs: { enable_thinking: false }`.
- Given a heading with no text, the model answered "Please provide the text…". Chapters under 400
  characters are now skipped, and replies that aren't summaries are never stored (`looksLikeSummary`).

Measured: two Moby Dick chapters (12k and 8k characters) plus one recap used about 86 neurons,
under 1% of the free daily allowance.

## R5. Story so far: chapter summaries, spoiler-safe by construction (FR-011, SC-004)

**Decision:** when the owner finishes a chapter in the reader, the client sends that chapter's
text to `POST /api/ai/chapter-summary`. A 120–200-word summary is stored per book and chapter. A
recap combines the stored summaries of chapters up to the furthest position into 3–5 short
paragraphs. It is never built from text past that point, because no summary exists beyond it.

**Cost estimate:** a chapter of about 5k tokens in and 250 out costs about $0.0003 on qwen3-30b
(prices R4). A reading day of 10 chapters plus one recap costs well under $0.01. The Workers AI
free allowance is 10,000 neurons/day, about $0.11/day at the paid rate of $0.011 per 1,000
neurons (pricing page above). ASSUMPTION: neurons map to price linearly, as the page's per-model
prices imply. A one-off genre pass over 700 books (about 0.7M tokens in, 0.07M out) costs
about $0.06, so it fits in one day's free allowance.

**Spend guard (FR-017):** a daily neuron estimate kept in D1. AI calls stop at 8,000 neurons/day
(below the free 10,000) and the UI shows "AI paused until tomorrow". The ceiling is
configuration.

**Alternatives:** whole-book-to-cursor prompts (expensive, needs long context, harder to keep
spoiler-safe). Pre-written recaps per percentage (wasteful).

## R6. Suggestions and plain-language search (FR-010, FR-013, FR-014)

**Decision:**
- **Read next:** rules first, in this order: next in series, on the Reading List collection,
  same author as a finished book, same collection as a book in progress. Then similarity:
  cosine distance between book embeddings and the embeddings of books in progress or recently
  finished. Reasons are written from the signal that produced the suggestion ("In your Gothic
  collection", "Another by Jane Austen", "Like Meditations"). No model writes them, so they are
  always true.
- **More like this:** the same similarity on the book page, top 5, with the same kind of reason.
- **Ask your library:** an exact search first; any book whose title or author matches comes
  first (FR-013). Then an embedding search over book text profiles (title, author, description,
  genres). Each result's reason names the fields that matched. With AI off, only the exact
  search runs.
- **Vectors:** 700 × 1,024 floats (`bge-m3`, measured 2026-11-21) is about 2.9 MB. Suggestions no
  longer load them per request: see "Precomputed matches" below. Plain-language search (T060 onward)
  still needs its own check against the same CPU limit.

**Precomputed matches (2026-11-22, owner's decision, supersedes loading vectors per request):**
- **Problem:** on 631 real books, loading vectors and ranking took about 70 ms of CPU in Node. The
  Workers Free plan allows 10 ms (https://developers.cloudflare.com/workers/platform/limits/).
- **Options:** precomputed matches (free, no new service); Workers Paid ($5 a month, fixed);
  Vectorize (an established vector search service, but one more moving part for about 700 books).
- **Decision:** `pnpm ai:neighbours` compares all books on the operator's machine and stores each
  book's 24 closest matches in `book_neighbours`. Requests load only the rows they compare from.
- **Strongest counter-argument:** matches go stale until the script runs again. Accepted: the
  library changes rarely, a stale match is still a real book, and books that left are filtered out.
- **Measured (Node, 631 real books):** Read next ranking about 2 ms, More like this under 1 ms.
  Results matched an unlimited comparison for all 631 books.
- **Not yet measured:** total CPU per request on a deployed Worker, including loading the library.
  The script uses local D1 only, and needs the production database once one exists.

**Update from a real-library check (2026-11-21, owner approved, metadata only):**
- "Like X" needs a cosine of at least 0.62, the 99th percentile of random book pairs. The first
  value, 0.5, was about the level of two random books.
- Read next limits each rule on a first pass (Reading List 4, authors 3, collection 3), then
  refills spare places, so a long Reading List can't crowd out everything else.
- Similarity in Read next only finds authors not already read; those have their own rule.
- Repeat records of a work are shown once: same title with a shared author, or a cosine of at
  least 0.8. In the check, true duplicates scored 0.95 or more and different works at most 0.77.
- ASSUMPTION: one library and one agent's read are enough to set these values.

**Rationale:** template reasons can't misstate why a book was suggested (honesty, FR-015).
Embeddings are nearly free (R4).

**Alternatives:** an LLM ranking the whole library per request (costly, slow, can invent
reasons). A recommender service (overkill for one reader).

## R7. Genre promotion to Calibre (FR-012)

**Decision:** promoted genres are queued in D1 (`genre_suggestion.state = promoted`). The `ribbon`
CLI (spec 003) applies them with `calibredb set_custom` on a multi-value "Genres" column it
creates once with `calibredb add_custom_column`. Until 003, the UI shows "Waiting for sync"
and nothing touches Calibre.

**Source:** Calibre `calibredb` manual,
https://manual.calibre-ebook.com/generated/en/calibredb.html. Ribbon principle 2 (CLAUDE.md):
writes go through `calibredb`.

## R8. Tokens: oxblood accent and Night theme (DR-0002)

**Decision:** in `packages/shared/src/tokens/color.ts`:
- the accent becomes oxblood. Measured from the approved mock: light `#7A2E3A` is
  oklch(0.413 0.106 13.4), dark `#E29AA3` is oklch(0.759 0.087 11.1), and Night `#C98A92` is
  oklch(0.698 0.078 10.9). `ACCENT_HUE` becomes 12; the ±5° test still holds.
- a third theme, `night`, is added. Contrast pairs cover all three themes. Body text on Night
  measures 9.6:1 (inside the 9–13 band).
- the paper grain moves from the mock's inline SVG into a token.

**Rationale:** the token tests stay the guard. The values are measured from the approved mocks,
not chosen again.

## R9. Matching the approved design (FR-001, SC-002)

**Decision:**
- Each route is built against its mock: `design-mocks/index.html`, `library.html`,
  `author.html`, `shelf.html`, `book.html` and `reader.html`.
- A Playwright script captures app and mock at 390, 820 and 1440 px, in light and dark (plus
  Night for the reader), side by side for review.
- The Impeccable finish reviewer then audits against the direction contracts in
  `apps/web/.impeccable/surfaces/`, and the owner signs off.
- The documenter writes `apps/web/DESIGN.md`. `docs/DESIGN.md` stays the architecture doc.

**Rationale:** the build matches the composition the owner approved. The finish review is
Impeccable's FINISH line in every direction contract.

## R10. Spec 001 overlap

**Decision:** spec 001's unbuilt US4 component tasks (T037–T050) are superseded by this spec's
components. Each new component still gets its catalogue page, so the completeness test keeps
passing. 001's tasks.md gets a note pointing here. T037's generated sample books are replaced by
R1.

**Rationale:** one implementation per component, built to the approved design.
