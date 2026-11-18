---
version: 1
slug: "src-routes-read-page-svelte"
primary_target: "src/routes/read/[id]/+page.svelte"
related_targets: ["src/lib/reader/Reader.svelte"]
---

# Reader

Scope: the reader (`/read/[id]`, Read mode), wrapping foliate-js. Visitor mode: Read.
Audience and job: the owner reading for a long time, often in low light, on phone, tablet or laptop; neurodivergent-friendly defaults.
Constraints: WCAG 2.2 AA, 3px focus ring, light, dark and Night, reduced motion respected, sizes in rem.
Approved design (owner, 2026-11-18, live review): `design-mocks/reader.html`.

## Direction contract

THESIS: A typeset page first, controls second: the text column looks like a modern book interior and every control gets out of the way. Refuses the toolbar-heavy web reader and the faux page-curl.
OWN-WORLD: Same world as Home and Library. Literata 1.25rem (1.125rem on phones), line height 1.7, about 65 characters, ragged right, no hyphenation, old-style figures, first-line indents and no paragraph gaps. Chapter opening: small-caps book label, large chapter numeral, muted italic epigraph with verse indents. Night theme: #0F0E0D, no grain, text about 9.6:1.
STORY: The owner opens a book at their place, reads with nothing on screen, taps the middle to see where they are, adjusts text in one panel, and is told plainly when the Kobo is further on.
FIRST VIEWPORT: Thin top bar (back to book, title and chapter, Contents, Aa, Bookmark) and thin bottom bar (full-width progress with a Kobo tick, %, minutes left in chapter, Story so far). A tap in the middle third toggles both; edges are reserved for page turns. Kobo-ahead card above the bottom bar: "Go to Kobo's place" / "Stay here".
FORM: Extension of the Home direction (seed:2979d04dc0dbed50), shaped in live review. Aa panel: size slider, Literata / Atkinson Hyperlegible, line spacing, margins, Scroll / Turn pages, Match system / Paper / Night; applies to every book on the device. Contents opens from the left with the current chapter marked.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
