# DR-0002: Redesign with Impeccable

Status: **accepted** (owner approved the full design 2026-11-18)
Version: 1.0.0   Date: 2026-11-18   Decider: owner
Scope: the look and layout of Home, Story so far, Library (with author and shelf pages), the
book page and the reader. It does not change spec 001's foundation (tokens, catalogue,
accessibility floor), only the visual direction those tokens express.

## Context

- Spec 001 set calm, low-load defaults built on calm-ds. The owner then asked for a richer
  experience: "a serif book on textured paper", "doesn't have to be twee to be bookish",
  "modern book interior", with the reader as the strongest surface.
- A first build went straight to tokens and routes with no preview. The owner rejected it as
  "muddy and basic" and asked for design review before any code
  (memory: preview and approve before building).
- The owner also wanted to try a current industry design tool while job hunting.

## Options

| Option | Fit | Notes |
|---|---|---|
| **A. Impeccable** (impeccable.style, v0.1.24, project-scoped skill) | Structured direction rounds, a decision page, and live in-browser review (Pick + Go, variants, accept) | Self-contained binary; telemetry off; no npm dependency added to the app. Its design hook is not wired. |
| B. Keep designing by hand-written previews | Worked, but the owner asked for Impeccable only | No structured comparison of directions. |
| C. Figma or a similar canvas tool | Strong for visuals | A second source of truth outside the repo; no code-level mock. |

## Decision

**A. Impeccable**, used for the whole design pass:
1. `init` wrote `PRODUCT.md`.
2. Five direction rounds on the decision page; the owner locked Bedside Stack in round 5.
3. Each page was then shaped in live review on static HTML mocks (`design-mocks/`), one page
   at a time, until the owner approved it.

Recorded outcomes:
- **Direction:** "Now reading". Home is for reading: the current book leads, other books in
  progress follow as a ledger, then suggestions. Direction contracts live in
  `apps/web/.impeccable/surfaces/` (home, library, reader).
- **Accent:** oxblood (`#7A2E3A` light, `#E29AA3` dark, `#C98A92` Night) replaces spec 001's
  muted blue-green. FR-005 ("at most one accent colour per view") still holds. What changes is
  the token value and the `ACCENT_HUE` constant that `contrast.test.ts` checks. This happens in
  the build, with the token rationale updated.
- **calm-ds** becomes guidance rather than a binding rule (owner, 2026-11-18, recorded in
  `PRODUCT.md`). The accessibility floor stays binding: WCAG 2.2 AA, 3px focus ring, 24px+
  targets, reduced motion, light and dark.
- **Motion:** only owner-started movement: reader bars on tap, sheets opening, hover tints.
  This stays within FR-006.
- **Mock data:** the mocks use public-domain books from Standard Ebooks, never the owner's
  Calibre library, so they can be committed.
- **Rejected first build:** removed. Nothing from it remains.

## Challenger: the strongest case against

"An AI design tool converges on whatever it rolled. The owner spent a long session steering
five rounds and dozens of live edits. A plain spec plus hand-built pages would have reached the
same place with one less tool, and the static mocks will drift from the Svelte build."

Ruling: the rounds and live review produced the owner's steers on screen rather than in
prose: "keep the roll", "at least 3 books at once", the ledger, the library tabs. That was the
missing review step behind the rejected first build. The drift risk is handled by making the
mocks the approved composition that the finish review checks against, and by retiring
`design-mocks/` once the pages are built. Impeccable adds no runtime dependency, and removing
it means deleting `.claude/skills/impeccable/` and `.impeccable/`.

## Sources

- Impeccable — https://impeccable.style
- Standard Ebooks, public-domain status of texts and covers — https://standardebooks.org/about
- WCAG 2.2 — https://www.w3.org/TR/WCAG22/
- Owner steers and approvals: this session, 2026-11-18 (journal entry of the same date).

## Review note

The challenger pass was done within the same session. The owner's approval of each page is
the deciding pass.
