# DR-0001: How the design catalogue is built

Status: **accepted** (owner ruled 2026-11-14)
Version: 1.0.0   Date: 2026-11-14   Decider: owner
Scope: spec 001, FR-018–FR-022. The catalogue is the browsable page set with one page per
design element.

## Context

Each token group and component needs its own page showing:
- its variants and states,
- the rationale behind it,
- its sources,
- its calm-ds Check results.

Requirements from spec 001:
- **R1:** render the real components (FR-019).
- **R2:** respond to the app's own preferences, so every element can be reviewed at any setting
  (FR-020).
- **R3:** be usable before any library, reader or sync feature exists (FR-021).
- **R4:** few moving parts and few dependencies (Ribbon principle 1).
- **R5:** works for a solo owner on a laptop.

## Options

Facts were checked against the npm registry on 2026-11-14 ([research R1](../../specs/001-visual-design/research.md#r1-catalogue-tool-fr-018fr-022)).

| Option | R1 | R2 | R3 | R4 | Notes |
|---|---|---|---|---|---|
| **A. Storybook 10.6.7** (`@storybook/sveltekit`, Svelte CSF) | ✅ | ⚠️ preferences have to be rebuilt as toolbar globals plus a decorator | ✅ | ❌ a second app: its own dev server, build and config; 22 MB core, 17 deps | Established and active: last release 2026-11-13. Its accessibility addon runs axe-core in the browser. |
| B. Histoire 1.0.0-beta.1 | ❌ no Svelte 5 support (plugin peer `svelte ^3 \|\| ^4`) | — | — | — | Ruled out. |
| C. Kitbook 1.0.0-beta.31 | ❌ no Svelte 5 support; last release 2024-04 | — | — | — | Ruled out. |
| **D. Custom route inside the app** | ✅ | ✅ uses the app's own preference system directly | ✅ | ✅ no new dependencies | We write the shell: index, page layout, states grid, sources block. |

## Proposal

**D. Custom route inside the app.**
- Each element is one Svelte page in its own folder under the catalogue route. Its metadata
  (sources, checks) sits next to it.
- The index is generated from those folders.
- The catalogue sits behind Cloudflare Access like the rest of Ribbon, and ships with the app.
  The design shown is the design that runs.

## Challenger: the strongest case against D

"You are rebuilding Storybook badly.
- Storybook gives you, for free and well maintained: controls to switch states, an accessibility
  panel per story, docs pages, visual regression tooling, and conventions that any future
  contributor already knows.
- A homegrown catalogue grows. First a states grid, then controls, then search, then a viewport
  toggle. Each one is code the owner maintains alone.
- And 'it lives in the app' means catalogue code ships in the production bundle."

## Ruling

**Owner, 2026-11-14:** accepted D: build our own, with the limits below.

D, with limits that answer the challenge:

1. **Scope cap.** The catalogue does three things:
   - an index,
   - one page per element showing all its states at once (no interactive controls; seeing every
     state together is calmer than toggling between them),
   - a metadata block for rationale, sources and Checks.

   Anything more, such as controls or visual diffing, is a new decision. If that need appears,
   adopting Storybook is the default answer.
2. **Accessibility checks.** Run in CI with `@axe-core/playwright` across a preference matrix.
   That is stricter than a per-story panel, which only checks the settings currently shown.
3. **Bundle.** Catalogue routes are their own pages and are split out by default, so they never
   load into library or reader pages. They're only reachable behind Access, so no one but the
   owner sees them.
4. **Exit path.** Elements are plain Svelte components with props. Moving to Storybook later
   means writing story files, not rewriting components.

The main reason for D over A is **R2**. Seeing each element at the owner's own settings is the
point of the catalogue (calm-ds VII, "first user as acceptance test"). In Storybook that would
mean keeping a second copy of the preference system in step with the real one.

Accepted maintenance cost: roughly one page shell, one index and one states-grid component.
ASSUMPTION: a few hundred lines in total.

## Sources

- npm registry (`npm view`), 2026-11-14: storybook, @storybook/sveltekit, @storybook/addon-svelte-csf,
  @storybook/addon-a11y, histoire, @histoire/plugin-svelte, kitbook, axe-core, @axe-core/playwright.
- Storybook SvelteKit docs — https://storybook.js.org/docs/get-started/frameworks/sveltekit
- Kitbook, "Why not use an existing alternative?" — https://kitbook.vercel.app/docs/why
- Histoire / Ladle / Storybook comparison — https://www.pkgpulse.com/guides/storybook-8-vs-ladle-vs-histoire-2026

## Review note

The challenger pass was done within the same session, not by a separate reviewer. Under the
AI-Team constitution (VII), the owner's ruling (2026-11-14, accepted) is the deciding pass.
