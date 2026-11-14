# Contract: preferences

> **Deferred** (2026-11-14, owner): spec 001 ships good defaults only. Until this contract is
> picked up, CSS follows `prefers-color-scheme` and `prefers-reduced-motion` directly.

Later specs consume this contract. Changing it means a new version of the key.

- **Storage**: `localStorage["ribbon.prefs.v1"]` = JSON object of the keys in
  [data-model.md](../data-model.md#preference). Missing keys mean "unset". The object is validated
  with a schema; if validation or reading fails, it is treated as empty, with no error shown.
- **Applied as**: attributes on `<html>`, set by an inline head script before first paint and
  updated live:
  `data-theme="light|dark"` (already resolved from system), `data-contrast="standard|more"`,
  `data-text-size="0..3"`, `data-text-spacing`, `data-density`, `data-motion="off|on"`.
  CSS reads only these attributes, never the raw media queries, so there is one source of truth.
- **System changes**: while a key is unset, a change in the matching media query updates the
  attribute live.
- **API (TypeScript, `packages/shared` type + app store)**: `prefs` (reactive, resolved values),
  `setPref(key, value)`, `resetPrefs()` (the caller confirms first).
- **Reader keys** (`reader*`) are stored with the rest. How they are applied inside book content is
  defined in spec 003.
