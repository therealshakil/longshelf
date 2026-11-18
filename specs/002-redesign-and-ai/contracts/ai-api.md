# Contract: AI endpoints (`/api/ai/*`)

All endpoints:
- sit behind Cloudflare Access, like the rest of Ribbon;
- use Zod request and response schemas in `packages/shared`;
- return `503 { reason: 'ai_paused' | 'ai_off' | 'offline' }` when the spend guard is hit, AI is
  switched off, or the model is unavailable. The UI maps each reason to its plain-words state
  (FR-016).

| Method and path | Request | Response | Notes |
|---|---|---|---|
| `POST /api/ai/chapter-summary` | `{ bookId, href, chapterLabel, ordinal, text }` | `{ ok: true }` | Called by the reader when a chapter is finished. The text is used once and not stored (only the summary is). Idempotent per (bookId, href). |
| `GET /api/ai/recap/:bookId` | — | `{ state: 'ready', upto: { label, percent }, paragraphs: string[], note }` or `{ state: 'writing' \| 'too_early' \| 'unavailable', reason }` | Built only from chapter summaries up to the furthest position (FR-011). `too_early` below 5%. |
| `GET /api/ai/read-next` | — | `{ items: { bookId, reason }[] }` (at most 12) | Rules first, then similarity (research R6). Excludes in-progress, finished and dismissed books. |
| `GET /api/ai/more-like/:bookId` | — | `{ items: { bookId, reason }[] }` (at most 5) | |
| `POST /api/ai/dismiss` | `{ bookId, kind: 'not_now' \| 'never' }` | `{ ok: true }` | `DELETE` with `{ bookId }` undoes it. |
| `GET /api/ai/genres/:bookId` | — | `{ genres: { name, state }[] }` | |
| `POST /api/ai/genres/:bookId` | `{ name, action: 'promote' \| 'remove' }` | `{ ok: true, state }` | Promotion is applied to Calibre by the CLI (spec 003). |
| `GET /api/ai/search?q=` | — | `{ mode: 'exact' \| 'meaning', items: { bookId, reason }[] }` | Exact matches first. `mode: 'exact'` with a one-line note when AI is unavailable (FR-013). |
| `POST /api/ai/jobs/genres` | `{ bookIds?: string[] }` | `{ queued: number }` | Operator action: suggests genres for new or all books, inside the spend guard. |
| `GET /api/ai/usage` | — | `{ today: { neuronsEst, calls, ceiling }, enabled }` | Operator view (constitution III). |
| `PUT /api/ai/enabled` | `{ enabled: boolean }` | `{ ok: true }` | The owner's off switch (FR-016). |
