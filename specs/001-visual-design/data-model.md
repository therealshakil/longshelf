# Data model: 001 Visual design

These are design-time entities only. Nothing is stored on a server.

## Token
| Field | Type | Rule |
|---|---|---|
| name | string | kebab-case, grouped (`color-text`, `space-3`); stable once used by a component |
| group | enum | color, type, space, radius, motion, focus, size |
| value | per (theme × contrast) for colour; single value otherwise | colour in OKLCH |
| rationale | short text | plain words (calm-ds VI) |
| sources | Source[] | ≥1 source, or `assumption: true` |

Validation: every colour token that is used as text or interface paired with a background is listed in a
**contrast pair** (`fg`, `bg`, `minRatio`), and tests check every pair in every theme × contrast
(FR-004, SC-003).

## Component
| Field | Type | Rule |
|---|---|---|
| id | string | kebab-case, matches its catalogue folder |
| title | string | plain name ("Book card") |
| states | State[] | every state named in spec 001 for this component; ≥1 |
| copy | text | labels and messages, following calm-ds VI |
| rationale, sources | as Token | as Token |
| checks | Check result × 7 | one per calm-ds principle: `pass` + one-line reason, or `n/a` + reason |

**State**: `{ name, props, sampleContent }`. Sample content is realistic: no lorem ipsum (spec edge cases).

## Preference
| Key | Values | Default | System preference that applies if unset |
|---|---|---|---|
| theme | light, dark, system | system | `prefers-color-scheme` |
| contrast | standard, more | system → standard | `prefers-contrast: more` |
| textSize | 0, 1, 2, 3 (100/112.5/125/150 %) | 0 | none |
| textSpacing | standard, wide | standard | none |
| density | comfortable, compact | comfortable | none |
| motion | off, on | off | `prefers-reduced-motion: reduce` forces off unless the owner chose on |
| readerFont | publisher, literata, atkinson | publisher | none |
| readerSize, readerLineHeight, readerMargins, readerParagraphSpacing | small set of steps | middle step | none |

Precedence: the owner's saved choice beats the system preference, which beats the default (FR-011, FR-012).
State transitions: unset → set (saved on change); set → unset only through "Restore default
appearance" after confirmation (US3 scenario 3).

## Catalogue page
One per token group and per component: `{ id, title, kind: token|component, order }` plus the
rationale, sources and checks of what it documents. The index lists pages grouped by kind, in
`order`.

## Source
`{ title, publisher?, url?, checked: date }` or `{ assumption: true, note }`. If a URL stops
working, the title stays, so the decision can still be traced.
