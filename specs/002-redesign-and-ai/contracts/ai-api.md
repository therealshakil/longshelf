# Contract: AI endpoints (`/api/ai/*`)

All endpoints:
- sit behind Cloudflare Access, like the rest of Ribbon;
- use Zod request and response schemas in `packages/shared`;
- return `503 { reason: 'ai_paused' | 'on_demand_paused' | 'ai_off' | 'offline' }` when the spend guard is hit, AI is
  switched off, or the model is unavailable. The UI maps each reason to its plain-words state
  (FR-016).

| Method and path | Request | Response | Notes |
|---|---|---|---|
| `POST /api/ai/chapter-summary` | `{ bookId, href, chapterLabel, ordinal, text, onDemand? }` | `{ ok: true }` | Called by the reader when a chapter is finished, or before a recap with `onDemand: true`, which counts towards a 3,000-neuron daily cap (DR-0004). The text is used once and not stored (only the summary is). Idempotent per (bookId, href). |
| `GET /api/ai/recap/:bookId` | Query: `percent`, `label`, `ordinal?`, `earlierChapters?`, `earlierChars?` | `{ state: 'ready', upto: { label, percent }, paragraphs: string[], note, earlier?: { percent, days } }` or `{ state: 'writing' \| 'too_early' \| 'unavailable', reason }` | Built only from chapter summaries up to the furthest position (FR-011). `too_early` below 5%. |
| `GET /api/ai/read-next` | — | `{ items: { bookId, reason }[] }` (at most 12) | Rules first, then similarity (research R6). Excludes in-progress, finished and dismissed books. |
| `GET /api/ai/more-like/:bookId` | — | `{ items: { bookId, reason }[] }` (at most 5) | |
| `POST /api/ai/dismiss` | `{ bookId, kind: 'not_now' \| 'never' }` | `{ ok: true }` | `DELETE` with `{ bookId }` undoes it. Both need a JSON content type and still work with AI off, because no model is called. |
| `GET /api/ai/genres/:bookId` | — | `{ genres: { name, state }[] }` | |
| `POST /api/ai/genres/:bookId` | `{ name, action: 'promote' \| 'remove' }` | `{ ok: true, state }` | Promotion is applied to Calibre by the CLI (spec 003). |
| `GET /api/ai/search?q=` | — | `{ mode: 'exact' \| 'meaning', items: { bookId, reason }[] }` | Exact matches first. `mode: 'exact'` with a one-line note when AI is unavailable (FR-013). |
| `POST /api/ai/jobs/genres` | `{ bookIds?: string[] }` | `{ queued: number }` | Operator action: suggests genres for new or all books, inside the spend guard. |
| `POST /api/ai/jobs/embeddings` | Empty JSON object | `{ total, embedded, unchanged, removed, remaining, stopped? }` | Operator action: embeds new or changed books in bounded batches inside the spend guard. Run again while `remaining` is above 0. |
| `GET /api/ai/usage` | — | `{ today: { neuronsEst, calls, ceiling }, enabled }` | Operator view (constitution III). |
| `PUT /api/ai/enabled` | `{ enabled: boolean }` | `{ ok: true }` | The owner's off switch (FR-016). |
