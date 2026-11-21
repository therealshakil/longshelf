# DR-0004: How recaps summarise chapters not read in Ribbon

Status: **accepted** (owner, 2026-11-21)
Refines: DR-0003 ("summarise each chapter once as the owner passes it")

## Context

Ribbon only had summaries for chapters finished in Ribbon, so recaps of books read on a Kobo
left out most of the story. The owner chose to summarise on demand, then asked for a cheaper way
after a first recap of a long book was estimated to use most of the daily AI limit (8,000
neurons, of 10,000 free).

## Options

Measured on five long chapters from three sample books with `gemma-4-26b`, 120-word summaries.
"Names kept" is the share of proper names in the full-text summary that also appear. It is a
crude proxy, so the summaries were also read side by side.

| Text sent per chapter | Cost vs full | Names kept | What was lost |
|---|---|---|---|
| Full text | 100% | 100% | Baseline |
| First 800 words | 29% | 31% | Everything after the opening |
| First and last 400 words | 29% | 50% | Middle-of-chapter turning points |
| 8 evenly spaced slices, 800 words | 28% | 50% | Bulstrode's confession and offer (*Middlemarch* LXI), Lucy's transfusion (*Dracula* XII) |
| 5 evenly spaced slices, 400 words | 18% | 41% | As above, plus invented links between scenes |

Estimated neurons for a first recap near the end of a book, from extracted chapter lengths:

| Plan | *Dracula* | *Middlemarch* | *Moby Dick* |
|---|---|---|---|
| Every chapter, 200-word summaries | 2,175 | 4,791 | 3,920 |
| Every chapter, 120-word summaries | 2,087 | 4,530 | 3,514 |
| Short chapters merged into blocks | 2,149 | 4,515 | 3,120 |
| **Newest 40,000 words before the place** | **467** | **574** | **658** |

Existing approaches assessed: hierarchical merging, which Ribbon already uses (chapter summaries,
then a recap), and incremental updating, which keeps one running summary. BooookScore found
hierarchical merging more coherent and incremental updating more detailed. Incremental updating
would need every earlier chapter in order, so it doesn't reduce this cost.

## Decision

1. Never slice chapters. Send full chapter text.
2. Summarise newest first, working back from the owner's place, up to 40,000 words automatically.
3. The recap says which chapters it covers.
4. Earlier chapters are summarised only when the owner asks, with the estimated cost shown first.
5. On-demand summarising stops at 3,000 neurons per UTC day, so other AI features keep working.
   Finished chapters are kept and it resumes on the next request.

## Challenger

Strongest case against: "A recap that skips the start of the book can misread who people are,
which is the thing a returning reader most needs. The owner chose on demand so nothing is
missing, and a whole book is still inside the free allowance."

Ruling: the risk is real, so the recap must state its coverage and offer the earlier chapters in
one tap. The default still stands because a returning reader most needs the recent story, and
the full-book cost stays available as the owner's explicit choice. T053 must check whether
recaps from a recent window confuse characters. If they do, revisit this decision.

## Update: quality check parked (2026-11-21)

The owner parked recap work as not worth more effort for now. SC-004 is **not** met: 10 of 20
recaps were built and the owner has not judged them. No later-only names were flagged, and an
agent read of those 10 found no spoilers. It found two problems:

- The *Middlemarch* recap at chapter 69 says Bulstrode married Will's mother. He married Will's
  grandmother. The error comes from the summary of chapter LXI.
- The *Middlemarch* recap at chapter 19 never mentions Dorothea, because the recent window holds
  none of her chapters. This is the risk named in the challenger above.

Story so far is hidden while parked, and the reader sends no chapters for summarising. Both are
controlled by `RECAPS_ENABLED` in `apps/web/src/lib/ai/features.ts`.

To resume: run `pnpm eval:recaps` from `apps/web`. It reuses the local cache in `.eval/recaps/`
if that still exists. Then consider the step-up model and a short "who's who" from earlier chapters.

## Limits of the evidence

- ASSUMPTION: five chapters and one reviewer are enough to reject slicing. The losses were large
  and consistent, but this is not a formal evaluation.
- Neuron figures are estimates from token counts, as in `models.ts`.
- Full-text summaries also make errors. One said Bulstrode married Will's mother; in the novel
  he married Will's grandmother. T053 remains the quality gate.
- No published study of spoiler-safe recaps by reading position was found.

## Sources (read 2026-11-21)

- BooookScore — https://arxiv.org/abs/2310.00785
- FABLES, faithfulness in book-length summaries — https://arxiv.org/abs/2404.01261
- On Context Utilization in Summarization (middle-of-document neglect) — https://aclanthology.org/2024.acl-long.153.pdf
- On Positional Bias of Faithfulness for Long-form Summarization — https://arxiv.org/abs/2410.23609
- NarraSum (salient content spread through narratives) — https://arxiv.org/pdf/2212.01476
- Workers AI pricing — https://developers.cloudflare.com/workers-ai/platform/pricing/
