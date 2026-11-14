# Implementation Plan: Visual design system and design catalogue

**Branch**: `001-visual-design` | **Date**: 2026-11-14 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-visual-design/spec.md`

## Summary

Build Ribbon's calm, evidence-backed design foundation before any features exist. That means:
- tokens (colour, type, space, radius, motion, focus, size) defined once in TypeScript and turned
  into CSS custom properties and the Tailwind theme;
- a preference system that the owner controls and that applies before the first paint;
- the component set for specs 002–004;
- a custom catalogue route inside the app, with one page per element showing its states,
  rationale, sources and calm-ds Check results.

The research behind every value is in [research.md](research.md). The catalogue-tool choice is
[DR-0001](../../docs/decisions/DR-0001-design-catalogue.md), which is proposed and awaiting the
owner's ruling.

This spec also does the minimal workspace scaffold that spec 002 had assumed: pnpm workspace,
SvelteKit app and shared package. Wrangler config, deploy and CI deploy stay in 002. The
catalogue runs locally until then.

## Technical Context

**Language/Version**: TypeScript 5, Svelte 5, Node 24

**Primary Dependencies**: SvelteKit 2, Tailwind v4, shadcn-svelte (Bits UI), Lucide. These are
already in the agreed stack (CLAUDE.md). Fonts are self-hosted files under `static/`: Atkinson
Hyperlegible Next and Literata, both OFL. They are not npm packages.

**New dependency needing approval**: `@axe-core/playwright` (dev only), for accessibility checks
([research R11](research.md#r11-accessibility-testing)).

**Storage**: browser `localStorage`, one versioned key ([contracts/preferences.md](contracts/preferences.md)). No server data.

**Testing**: Vitest (contrast pairs, preference precedence, catalogue completeness, token-only lint),
Playwright + axe across the preference matrix.

**Target Platform**: evergreen browsers on phone, tablet and laptop. The installed app (PWA) is
not part of this spec.

**Project Type**: web application (SvelteKit), part of a pnpm workspace.

**Performance Goals**: theme and preferences applied before first paint (no flash). No layout
shift while covers load (CLS ≈ 0 on the grid page).

**Constraints**:
- WCAG 2.2 AA everywhere; AAA for focus appearance and for body text in higher contrast.
- No motion by default.
- Tokens only: no raw colours, sizes or durations in components.
- Works offline once loaded: fonts are self-hosted.

**Scale/Scope**: about 7 token pages and about 14 component pages. The library grid is shown with
700 sample books.

## Constitution Check

AI-Team constitution v1.0.0. All gates are checked before and after design.

| Principle | Gate | Status |
|---|---|---|
| I Calm & low-load | honours reduced-motion, contrast and colour-scheme preferences; no autoplay or flashing; no urgency | ✅ built into the tokens (R7) and the preference contract |
| II Outcomes over ceremony | each artefact changes the outcome | ✅ the catalogue is the review surface; tests replace manual contrast checks |
| III Dual interface | operator view and user view | ✅ n/a: one person is both owner and user; the catalogue is the owner/operator view |
| IV What, not how | the spec is free of tools | ✅ tools appear only in the plan, research and DR |
| V Adopt before building | ≥1 existing solution assessed | ✅ Storybook, Histoire, Kitbook, Sveltescape and Ladle assessed (DR-0001) |
| VI Decisions recorded | DR for non-trivial choices | ✅ DR-0001. Typeface, palette and storage are recorded in research.md (R2, R3, R9) |
| VII Challenger before locking | separate opposing pass, decider rules | ⚠️ the challenger pass in DR-0001 was in-session; the DR stays **proposed** until the owner rules |
| VIII Cite or ASSUMPTION | every claim | ✅ research.md; the remaining ASSUMPTIONs are listed there |
| IX Economy | lowest-cost option that meets the need | ✅ no new runtime dependencies; one dev-only dependency |
| X Solo-operable | one laptop | ✅ everything runs locally |
| XI Honest by construction | no dark patterns | ✅ no badges, streaks or nags (FR-017) |

Re-check after design: no violations. VII remains open until the owner rules on DR-0001.

## Project Structure

### Documentation (this feature)

```text
specs/001-visual-design/
├── plan.md, research.md, data-model.md, quickstart.md
├── contracts/  preferences.md, tokens-and-catalogue.md
├── checklists/requirements.md
└── tasks.md   (/speckit-tasks)
docs/decisions/DR-0001-design-catalogue.md
```

### Source Code (repository root)

```text
pnpm-workspace.yaml, package.json
packages/shared/src/
├── tokens/            token definitions (values, rationale, sources, contrast pairs)
└── prefs.ts           preference schema + types (Zod)
apps/web/
├── src/app.html       inline head script applies prefs before paint
├── src/app.css        Tailwind v4 + generated token custom properties + @theme mapping
├── src/lib/prefs/     reactive prefs store, set/reset, system-change listeners
├── src/lib/components/ui/    shadcn-svelte primitives, restyled to tokens
├── src/lib/components/       Ribbon components (book-card, library-grid, sync-status, …)
├── src/lib/sample/           realistic sample catalogue (700 books, edge cases)
├── src/routes/design/        catalogue: +layout (index), <element>/+page.svelte + meta.ts
├── src/routes/settings/      preferences page (the real one, also catalogued)
├── static/fonts/             Atkinson Hyperlegible Next, Literata (woff2, OFL)
└── tests/                    vitest unit + playwright e2e (axe matrix)
```

**Structure Decision**: this follows the CLAUDE.md layout. `apps/web` and `packages/shared` are
created now. `packages/sync-cli` and `vendor/` wait for specs 002 and 003.

## Complexity Tracking

No violations to justify.
