---
version: 1
slug: "src-routes-library-page-svelte"
primary_target: "src/routes/library/+page.svelte"
related_targets: ["src/routes/library/authors/[id]", "src/routes/library/shelf/[id]"]
---

# Library

Scope: the library page (`/library`, Operate) plus the author page and the shelf page (one collection or genre). Same world as Home.
Audience and job: the owner finding a book that is not in progress, by recency, author, genre, collection or title, plus news issues fetched by Calibre.
Constraints: WCAG 2.2 AA, 3px focus ring, light and dark, no decorative motion, sizes in rem.
Approved design (owner, 2026-11-18, live review): `design-mocks/library.html`, `design-mocks/author.html`, `design-mocks/shelf.html`, and the book page `design-mocks/book.html` (route `/library/book/[id]`).

## Direction contract

THESIS: One calm library with plain tabs, ordered by how the owner actually looks for books; covers carry the page, notes stay quiet. Refuses filter-panel catalogues and dashboard counts.
OWN-WORLD: Home's world unchanged: grained paper, near-black ink, one oxblood accent for progress and links, Literata headings and titles, Atkinson apparatus, hairline rules, no cards. Read status on every tile: nothing at 0%, "N% read" in oxblood, "Finished" plain.
STORY: The owner opens the library, sees what arrived recently, or goes by author, genre, collection, news or the full A–Z list, and opens a book, an author or a shelf.
FIRST VIEWPORT: Header shared with Home (Library current). "Library" heading with book count. Tabs in this order: Recently added (default, grouped This week / Earlier), Authors (three-column list of names with counts, linking to author pages), Genres (AI-suggested, quiet promote note at the bottom), Collections (fanned three-cover stacks, quiet Calibre note at the bottom), News & magazines (one row per publication, issues newest first, New marks), All Books (title A–Z with a vertical scrubbable letter rail on the right).
FORM: Extension of the Home direction (seed:2979d04dc0dbed50), shaped in live review. Author page: portrait, life dates, short sourced bio, "In your library" grid, bibliography with owned / not-owned states. Shelf page: breadcrumb, name, count, Title / Author / Recently added sort, grid. Book page: cover, title, author link, subtitle, publication line; the Home progress table; Continue reading, Downloaded (toggle), Story so far, more menu; description from Calibre; genres as solid (Calibre) and dashed (AI, Promote / remove) chips; details; More like this with reasons.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
