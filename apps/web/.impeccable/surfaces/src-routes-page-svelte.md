---
version: 2
slug: "src-routes-page-svelte"
primary_target: "src/routes/+page.svelte"
related_targets: ["src/routes/library"]
---

# Home (Now reading)

Scope: the home page (`/`, Operate). The library is its own page (`/library`, separate brief to follow); the reader gets its own round.
Audience and job: the owner, picking up a book on phone, tablet or laptop, often in low light.
Constraints: WCAG 2.2 AA, a 3px focus ring, follows the system light/dark setting, no decorative motion, sizes in rem.
Feel-wrong list (owner): generic SaaS, busy or loud, twee bookishness, unpredictable layout.
Approved design: `design-mocks/index.html` (owner approved 2026-11-18 after live review). It is the composition the build matches.
Story so far panel approved 2026-11-18: side sheet (desktop) / bottom sheet (phone) opened from the ledger pill, at `design-mocks/index.html#recap`, with Ready, Writing, Unavailable and Too early states. Build it on the Bits UI Sheet (shadcn-svelte); the dashed mock-state switch is review chrome only.

## Direction contract

THESIS: Home is for reading, not browsing: the current book leads, the other books in progress follow as a quiet ledger, then suggestions. Refuses the cover-grid-first library home and the dashboard of stats.
OWN-WORLD: Neutral grained paper (#F7F7F5 light, #1D1C1A dark), near-black ink, one oxblood accent (#7A2E3A light, #E29AA3 dark) for progress and links only. Literata for titles and headings, Atkinson Hyperlegible Next for apparatus. Hairline rules, soft offset shadows on covers, 2px cover corners, no cards. Wordmark "Ribbon." with an oxblood full stop.
STORY: The owner sees where they are in the current book on every device, resumes in one tap, sees the other two or three books in progress, and gets a short shelf of suggestions from their own library, each with its reason.
FIRST VIEWPORT: Header: wordmark, Home · Library switch, search ("Search, or ask your library"), sync status. Current book "Spread": 15rem cover left; right column with large title and author, a rule, a labelled table (Progress with % and chapter and bar, Elsewhere, Last read), and "Continue reading" aligned to the cover's bottom. Below: "Also reading" ledger rows (cover, title, author, % and chapter right, full-width bar, grey Kobo bar when present, Story so far pill, round resume cue); each row is one click target.
FORM: Code-led build of the round-5 pick (Bedside Stack, since reworked in live review), seed:2979d04dc0dbed50. Below the fold: Read next, two rows of six with reasons and a not-now menu, then "Browse the library", then Latest news & magazines (newest issue per publication, New marks, link to the library tab; added 2026-11-18).
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
