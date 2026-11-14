# Feature Specification: Visual design system and design catalogue

**Feature Branch**: `001-visual-design`

**Created**: 2026-11-14

**Status**: Draft

**Input**: User description: "A design phase ahead of technical implementation: research-based,
calm, neurodivergent-friendly visual design for Ribbon. Each design element gets its own design
page (storybook-style); research established alternatives and custom builds for the catalogue."
(Personal health detail from the original request is deliberately kept out of the repo.)

## Context

Ribbon is a single-user private library and e-reader that mirrors a Calibre library. Its only
user is its owner, who is neurodivergent. This feature defines how Ribbon looks and behaves at
the surface — before any library, reader, or sync functionality is built — so that every later
spec builds from calm, evidence-backed parts instead of retrofitting them.

The design philosophy is the calm-ds constitution (v0.1.0, seven principles, each with a yes/no
**Check**): Quiet senses, Predictable, One thing at a time, Remember for me, No pressure, Plain
words, The person holds the dial. This feature is calm-ds's first real consumer, and its tokens
may become calm-ds's first token set.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse the design catalogue (Priority: P1)

The owner opens the design catalogue and sees a short, calm index of every design element:
tokens first (colour, type, space, radius, motion, focus), then components. Choosing one opens
its own page showing every variant and state side by side, a plain-words rationale, the sources
behind each decision (or an explicit ASSUMPTION label), and which calm-ds Checks it passes.

**Why this priority**: The catalogue is how the owner judges the design and how every later spec
finds the parts it needs. Without it, the rest is unreviewable.

**Independent Test**: Open the catalogue, pick any element, and confirm its page shows variants,
states, rationale, sources, and Check results — with nothing missing and nothing moving.

**Acceptance Scenarios**:

1. **Given** the catalogue is open, **When** the owner picks "Book card", **Then** a page for
   that element alone shows its states (default, focused, downloaded, not downloaded, missing
   cover, long title) with the rationale and sources under them.
2. **Given** an element page, **When** the owner reads the decisions on it, **Then** every
   decision carries a source link or the label ASSUMPTION.
3. **Given** the owner leaves the catalogue on an element page, **When** they return later,
   **Then** they land on the same page (Remember for me).

---

### User Story 2 - Tokens grounded in research (Priority: P1)

The owner reviews the foundation tokens — colour (light and dark), type scale and line length,
spacing, radius, motion, focus indicator — each with the evidence that set its value.

**Why this priority**: Components are built from tokens; if the tokens aren't calm and sourced,
nothing above them is.

**Independent Test**: Open each token page and verify the values, the evidence, and the
measured results (contrast ratios, line length, focus visibility) are shown and pass.

**Acceptance Scenarios**:

1. **Given** the colour token page, **When** the owner views it, **Then** every text/background
   pair is shown with its measured contrast ratio, in both light and dark themes, and every pair
   meets WCAG 2.2 AA.
2. **Given** the colour palette, **When** inspected, **Then** no text sits on pure white, no
   large area uses saturated colour, and each view uses at most one accent colour.
3. **Given** the motion token page, **When** viewed, **Then** the default is "no motion", and any
   optional motion is shown only after the owner turns it on.

---

### User Story 3 - The person holds the dial (Priority: P2)

The owner adjusts how Ribbon looks — theme (light, dark, follow system), contrast (standard,
higher), text size, text spacing, density (comfortable, compact), and motion (off, on) — from one
settings place. The change applies everywhere at once, including inside
the catalogue, and stays after closing and reopening.

**Why this priority**: calm-ds VII (non-negotiable in spirit): calm is personal; defaults are a
starting point, not a verdict. It comes after P1 because there must be a design to adjust.

**Independent Test**: Change each preference, close and reopen, confirm it persisted and that
every catalogue element still passes its contrast and layout checks at that setting.

**Acceptance Scenarios**:

1. **Given** default settings, **When** the owner sets text size to the largest step, **Then**
   every component reflows without overlapping, clipping, or horizontal scrolling.
2. **Given** the system is set to prefer reduced motion or dark mode, **When** Ribbon opens with
   no saved choice, **Then** it follows the system; **When** the owner has saved a choice,
   **Then** the owner's choice wins.
3. **Given** the owner changed settings, **When** they want the defaults back, **Then** one
   clearly named action ("Restore default appearance") resets them, after confirming.

---

### User Story 4 - Components ready for later specs (Priority: P2)

The owner (and later specs) find a designed, documented component for every surface the mirror,
read, and device-progress specs need: app frame and navigation, library grid, book card, search
field and results, book detail, reader chrome (top/bottom bars, progress, table of contents,
reading-typography controls), settings, offline and sync status, empty states, error states, and
confirm/undo patterns.

**Why this priority**: These are what the next three specs assemble; designing them here keeps
later specs to wiring rather than redesign.

**Independent Test**: For each component in the list, open its page and confirm all listed
states exist and pass the calm-ds Checks.

**Acceptance Scenarios**:

1. **Given** the sync status component, **When** shown in its states (up to date, syncing,
   offline, needs attention), **Then** it sits in the periphery, uses no colour alone to convey
   state, and never animates unless the owner turned motion on.
2. **Given** an error state, **When** read, **Then** it says what happened, whether anything was
   lost, and the one next step — with no blame and no idioms.
3. **Given** the library grid with 700 books, **When** viewed, **Then** layout does not shift as
   covers load.

---

### User Story 5 - Catalogue tool chosen on evidence (Priority: P3)

The owner can read a decision record explaining how the catalogue is hosted: at least two
established catalogue tools assessed against a custom-built catalogue, with the strongest case
against the chosen option stated and ruled on.

**Why this priority**: Required by the AI-Team constitution (adopt before building; record
decisions; challenger pass). Lower priority only because it is a record, not a surface.

**Independent Test**: The decision record exists, names ≥2 established options plus a custom
option, cites sources, and states a ruled-on counter-argument.

**Acceptance Scenarios**:

1. **Given** the decision record, **When** read, **Then** it lists the options, the criteria
   (maintenance, dependency count, fit with the app's own components, offline use), the decision,
   and the sources.

### Edge Cases

- Largest text size combined with compact density on a phone-width screen.
- Very long titles, author lists, and series names; books with no cover; books with no author.
- Dark theme with the higher-contrast setting together.
- The system asks for reduced motion and also for higher contrast at the same time.
- An element page whose component has a state that can't yet be shown with real data — it shows
  realistic sample content, never lorem ipsum.
- Saved preferences can't be read (cleared storage): Ribbon falls back to calm defaults without
  an error dialog.
- A source link stops resolving: the record keeps the citation text so the decision stays
  traceable.

## Requirements *(mandatory)*

### Functional Requirements

**Evidence**

- **FR-001**: Every token value and every component design decision MUST cite a published source
  (e.g. WCAG 2.2, W3C COGA, UK Home Office accessibility posters, British Dyslexia Association
  guidance, Calm Technology, peer-reviewed research) or be labelled ASSUMPTION.
- **FR-002**: The research behind the design MUST be kept as a readable record in the repo,
  including what was considered and rejected and why.

**Tokens**

- **FR-003**: The design MUST define tokens for colour (light and dark themes, standard and
  higher contrast), typography (families, scale, weights, line height, line length), spacing,
  radius, motion, and focus indication.
- **FR-004**: All text and meaningful non-text elements MUST meet WCAG 2.2 AA contrast in every
  theme and contrast combination; the higher-contrast setting SHOULD meet AAA for body text.
- **FR-005**: The default theme MUST avoid pure-white text backgrounds and large saturated areas,
  and MUST use at most one accent colour per view.
- **FR-006**: The default motion setting MUST be no motion. No element may move, flash, or play
  sound unless the owner started it.
- **FR-007**: Focus MUST be clearly visible on every interactive element and meet WCAG 2.2 focus
  appearance guidance.
- **FR-008**: Meaning MUST NOT rely on colour alone (state is also given by text or shape).

**Preferences (the dial)**

- **FR-009**: The owner MUST be able to set theme (light, dark, follow system), contrast
  (standard, higher), text size (at least 4 steps), text spacing (standard, wider), density
  (comfortable, compact), and motion (off, on).
- **FR-010**: Reading-surface preferences MUST also be adjustable: typeface (from a short curated
  list including at least one designed for readability), size, line spacing, margins, and
  paragraph spacing.
- **FR-011**: Preferences MUST persist across sessions on the same device, MUST be in one place,
  and MUST override both designer defaults and system preferences once set.
- **FR-012**: With no saved choice, Ribbon MUST follow the system's colour scheme, reduced-motion,
  and contrast preferences.

**Components**

- **FR-013**: The design MUST provide documented components for: app frame and navigation,
  library grid, book card, search field and results, book detail, reader chrome, table of
  contents, reading-typography controls, settings, offline and sync status, empty states, error
  states, and confirm/undo.
- **FR-014**: Each view built from these components MUST have one clearly primary action.
- **FR-015**: Components MUST NOT change context on focus or value change, and MUST NOT shift
  layout while content loads.
- **FR-016**: All copy in components MUST follow calm-ds Plain words: literal labels, buttons that
  say what happens, errors that state what happened, whether anything was lost, and the next step.
- **FR-017**: Status and notifications MUST be peripheral and silent; no badges, counts, streaks,
  or urgency by default.

**Catalogue**

- **FR-018**: Every token group and component MUST have its own catalogue page showing all its
  variants and states, its rationale, its sources, and its result against each relevant calm-ds
  Check.
- **FR-019**: The catalogue MUST render the real components, not pictures of them, so that what
  is reviewed is what ships.
- **FR-020**: The catalogue MUST respond to the same preferences as the app, so every element
  can be reviewed at any setting.
- **FR-021**: The catalogue MUST be available to the owner without any library, reader, or sync
  feature being built.
- **FR-022**: The way the catalogue is built MUST be chosen in a decision record that assesses at
  least two established catalogue tools against a custom build.

### Key Entities

- **Token**: a named design value (e.g. body text colour, spacing step) with its value per theme
  and contrast setting, rationale, and sources.
- **Component**: a reusable interface part with named variants and states, copy guidance,
  rationale, sources, and calm-ds Check results.
- **Preference**: an owner-adjustable setting with its options, default, and persistence.
- **Catalogue page**: one page per token group or component, presenting the above.
- **Source**: a citation (title, publisher, URL, date checked) or the ASSUMPTION label.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of tokens and components have a catalogue page; 100% of their decisions carry
  a source or ASSUMPTION label; ASSUMPTION labels are under 20% of decisions.
- **SC-002**: Every component passes all seven calm-ds Checks, as recorded on its page.
- **SC-003**: Every text/background pair, in every theme and contrast combination, meets WCAG 2.2
  AA, verified by measurement and an automated accessibility check with zero violations.
- **SC-004**: At the largest text size and at phone width, no component overlaps, clips, or
  scrolls horizontally.
- **SC-005**: The owner can find any element in the catalogue in under 10 seconds from its index.
- **SC-006**: In a review session, the owner uses the catalogue for 30 minutes at their own
  settings and reports nothing that moved, glared, or startled without being asked for
  (calm-ds "first user as acceptance test").
- **SC-007**: Preferences survive closing and reopening in 100% of tries.

## Assumptions

- Scope is design only: no book data, backend, sync, or reader engine. Components use realistic
  sample content (real-looking titles and authors, varied lengths, missing covers).
- Target surfaces: phone, tablet, and laptop browsers; the installed app uses the same design.
- Preferences are stored per device; syncing preferences between devices is out of scope here.
- Sound is not part of Ribbon; the motion and sound defaults are therefore "none".
- The calm-ds constitution is draft (v0.1.0, unratified). This spec follows it as written; if
  calm-ds changes, the affected Checks are re-run and this spec is amended.
- The catalogue is private to the owner like the rest of Ribbon, and ships with the app rather
  than as a public site (ASSUMPTION; the decision record may revise this).
- Reader-content typography covers Ribbon's controls around the book text; how individual EPUB
  styles are overridden is decided in the read spec.

## Dependencies

- calm-ds constitution v0.1.0 (`~/Projects/calm-ds/CONSTITUTION.md`) and its sources.
- AI-Team constitution (`.specify/memory/constitution.md`): cite or mark ASSUMPTION, adopt before
  building, record decisions, challenger before locking.
- Later specs 002 (mirror), 003 (read), 004 (device progress) consume these components.
