# Contract: tokens and catalogue entries

## Tokens
- Tokens are defined once, in a single TypeScript source (values, rationale, sources, contrast pairs). From it come:
  1. CSS custom properties (`--color-text`, `--space-3`, …), switched by the `<html>` data
     attributes in [preferences.md](preferences.md);
  2. the Tailwind v4 `@theme` mapping, so utility classes use the tokens;
  3. the token catalogue pages and the contrast tests.
- Components MUST use tokens only: no raw colours, sizes or durations. A lint/test check enforces this.
- Every transition duration resolves to `0ms` unless `data-motion="on"`.

## Catalogue entry
Each element is a folder under the catalogue route containing:
- `+page.svelte`: renders every state side by side, at the current preferences;
- `meta.ts`: exports `{ id, title, kind, order, rationale, sources, checks }` as in
  [data-model.md](../data-model.md).

The index is built from all `meta.ts` files. A test fails if:
- a component lacks an entry,
- an entry lacks sources, or is not labelled ASSUMPTION,
- an entry is missing any of the 7 Check results.
