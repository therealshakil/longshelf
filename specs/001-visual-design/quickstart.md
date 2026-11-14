# Quickstart: validating 001

Prerequisites: Node 24 and pnpm. The repo is scaffolded by this spec's tasks.

1. `pnpm install`, then `pnpm --filter web dev`, then open `/design`.
   - **Expect:** an index of token groups, then components. Nothing on it moves.
2. Open any component page.
   - **Expect:** every state is shown side by side.
   - **Expect:** the rationale, sources (or ASSUMPTION) and seven Check results appear below.
   - (US1, FR-018)
3. Go to Settings and change the theme, contrast, text size (to the largest), spacing, density and
   motion. Then reopen the catalogue.
   - **Expect:** every page reflects the new settings.
   - **Expect:** at phone width, there is no overlap, clipping or horizontal scrolling.
   - (US3, SC-004)
4. Close the browser and reopen it.
   - **Expect:** your settings are kept (SC-007).
   - **Expect:** you're back on the last catalogue page you had open (US1 scenario 3).
5. Run `pnpm --filter web test`.
   - **Expect:** the unit tests pass. They cover:
     - every contrast pair meets its minimum ratio in each theme and contrast setting (SC-003, FR-004),
     - preference precedence and fallback (FR-011, FR-012),
     - every catalogue entry is complete (SC-001, contracts/tokens-and-catalogue.md).
6. Run `pnpm --filter web test:e2e`.
   - **Expect:** zero axe violations on every catalogue page across the preference matrix (SC-003).
7. **Owner review (SC-006):** 30 minutes in the catalogue at your own settings.
   - Note anything that moved, glared or startled you without being asked for.
   - **Pass:** you note nothing.
