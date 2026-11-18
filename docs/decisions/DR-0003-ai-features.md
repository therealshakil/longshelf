# DR-0003: AI features in the design

Status: **accepted** (owner, 2026-11-18): design and provider. Model choices are made in the plan.
Version: 1.1.0   Date: 2026-11-18   Decider: owner
Scope: what the AI features do, how they appear, and which provider runs them. Model choices and
mechanics belong to the spec 002 plan.

## Context

The owner asked for AI features in the redesign ("read next, categories, genres, etc."), with
"tech implementation later". The AI-Team constitution requires honest-by-construction design
(no dark patterns, minimal data) and flags recurring costs before they are incurred. Calibre is
Ribbon's source of truth: it is never written directly, and writes go through `calibredb`.

## Features (designed and approved)

1. **Read next.** Up to 12 suggestions from the owner's own library, each with a one-line
   reason. Dismissible ("Not now", "Never"). Shown on Home.
2. **Genres.** Suggested genres for every book, browsable as a Library tab and shown on the
   book page.
3. **Story so far.** A spoiler-safe recap up to the owner's place. It is offered after a gap of
   7 or more days (ASSUMPTION: threshold to be tuned) and is always available from the ledger,
   the book page and the reader. It states its cut-off and has states for writing, unavailable
   and too early (under 5%).
4. **Ask your library.** The search field also takes plain-language requests. Results design
   is still to do.
5. **More like this.** Suggestions on the book page, each with a reason.

## Where AI-made genres live

| Option | Effect |
|---|---|
| Suggest, owner accepts, write to Calibre | One truth, but about 2,000 decisions before anything is browsable |
| Ribbon only | No effort, but invisible in Calibre and on the Kobo |
| Auto-write to Calibre | Unchecked AI output in the owner's library data |
| **Mix (chosen)** | Suggestions live in Ribbon and are browsable at once; the owner promotes the ones they agree with to a new multi-value Calibre "Genres" column via `calibredb` |

The hand-curated `collection` column is never touched.

## Honesty rules

- AI output is marked in plain words where it appears. The owner rejected boxed "AI" badges.
  The disclosure now lives in the reasons, the recap's closing note and the genre footnotes.
- Every suggestion carries its reason.
- No streaks, nudges, or suggestions from outside the owner's library.
- Spoiler safety: recaps never go past the owner's furthest read position.

## Challenger: the strongest case against

"AI features add a recurring cost and an external dependency to a single-user app whose first
principle is ease of maintenance. Suggestions from 96–700 books could be plain rules:
same author, same collection, Reading List. Recaps of public-domain classics exist already."

Ruling: the design keeps every feature optional, with a non-AI fallback: exact search, Calibre
tags, and no recap. The build decision must assess a rules-only or local option before any paid
API, and must state the monthly cost first (constitution 8).

## Provider (owner, 2026-11-18)

**Cloudflare Workers AI only, for now. No Anthropic or other external AI provider.**

| Option | Cost for Ribbon's workload | Data | Verdict |
|---|---|---|---|
| **Cloudflare Workers AI** | 10,000 neurons/day free, then $0.011 per 1,000; text models from about $0.05/M input tokens (qwen3-30b-a3b) to $0.35 (gpt-oss-120b); embeddings $0.002–0.02/M | Runs in the owner's account. "Does not use Customer Content processed by Workers AI to train AI models"; no retention after the request | **Chosen**: no new vendor, likely £0 |
| Claude API, Haiku 5.5 | $0.10 / $0.50 per M tokens; about $0.10–0.50/month | Owner's own API key | Better recaps; owner declined for now |
| OpenAI gpt-6-luna | $0.10 / $0.50 per M | Not stated on the pricing page | No gain over Claude; another vendor |
| Gemini 3.5 Flash-Lite | $0.30 / $2.50 paid; the free tier's content is used to improve Google's products | The free tier is unsuitable | Dearer for no gain |
| Local model on the laptop | £0 | Stays local | Recaps unavailable on the phone unless pre-written; weaker |
| Rules only | £0 | n/a | No recaps or plain-language search |

A Claude subscription (Pro or Max) cannot power the app. Claude Code's terms reserve subscription
login for "ordinary use of Claude Code and other native Anthropic applications". Products and
services must use API keys.

Cost-shaping idea for the plan: summarise each chapter once as the owner passes it, then build
recaps from those summaries. Prompts stay small, recaps are spoiler-safe by construction, and
small open models can handle it.

Fixed-cost flag: usage beyond the free daily allowance needs Cloudflare's Workers Paid plan.
ASSUMPTION: about $5/month, not checked this session. The mirror spec may need that plan anyway.

## Sources

- Owner steers: this session, 2026-11-18.
- Calibre `calibredb` — https://manual.calibre-ebook.com/generated/en/calibredb.html
- Workers AI pricing (read 2026-11-18) — https://developers.cloudflare.com/workers-ai/platform/pricing/
- Workers AI data usage (read 2026-11-18) — https://developers.cloudflare.com/workers-ai/platform/data-usage/
- Gemini pricing (read 2026-11-18) — https://aistudio.google.com/docs/pricing
- OpenAI pricing (read 2026-11-18) — https://developers.openai.com/api/docs/pricing
- Claude Code legal and compliance (subscription vs API keys) — https://code.claude.com/docs/en/legal-and-compliance
- Claude model prices: Anthropic's model table, as cached 2026-11-03
