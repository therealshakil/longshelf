<!--
Sync Impact Report — 2026-09-07
Version change: (none) → 1.0.0   [initial ratification]
Modified principles: n/a (first version)
Added sections:
  - Core Principles I–XI
  - Operating Constraints
  - Workflow & Decision Process
  - Governance
Removed sections: none
Templates reviewed:
  - .specify/templates/plan-template.md ......... ✅ Constitution Check gate is generic; compatible
  - .specify/templates/spec-template.md ......... ✅ no constitution-specific tokens
  - .specify/templates/tasks-template.md ........ ✅ no constitution-specific tokens
  - .specify/templates/checklist-template.md .... ✅ no constitution-specific tokens
Deferred / follow-up TODOs:
  - Project name is a working name ("AI-Team"); rename on project naming (PATCH bump).
  - CONVENTIONS.md not yet created (referenced by Operating Constraints).
  - Context pack lives in the private companion repo; specs reference it, never inline it.
-->

# AI-Team Constitution

<!-- "AI-Team" is a working name; the project will be renamed later. -->

A portable working guide for how this team operates. It is written to apply equally to a human
team or an AI team. It states **what must hold, not how** to build it. Enforcement levels follow
RFC 2119: **MUST / MUST NOT** are binding, **SHOULD** yields only to a recorded reason, **MAY**
is discretionary.

This document contains no project-, product-, or person-specific content. Audience, domain, and
cultural context live in a separate Context pack that specs reference by link.

## Core Principles

### I. Calm & Low-Load by Default (NON-NEGOTIABLE)

Every surface the team produces — for users, for the operator, for other agents — MUST minimise
the attention and working memory it demands.

- User-facing surfaces MUST honour `prefers-reduced-motion`, `prefers-contrast`, and
  `prefers-color-scheme`, MUST NOT autoplay motion or sound, and MUST NOT rely on flashing,
  strobing, or glare.
- The team MUST NOT ship urgency, scarcity, streak, or guilt mechanics.
- A multi-step flow MUST have a persisted resume point after every step; no flow may require the
  user or operator to hold state in their head to continue.
- The next action MUST be visible at every step, and every action MUST be reversible or
  explicitly confirmed.
- When throughput conflicts with the safety, dignity, or clarity of a user or the operator, the
  team MUST choose the latter and block the release, not the person.

*Irreducible truth: attention and working memory are finite and non-renewable within a session.*

### II. Outcomes Over Ceremony (NON-NEGOTIABLE)

A process step that does not change an outcome or reduce a real, named risk MUST be removed.
"The process was followed" is never accepted as evidence that something works; the working
result is. If a person follows the defined process and the system still fails them, the system
is at fault and MUST be fixed.

*Irreducible truth: process is a means; only outcomes and avoided harm are ends.*

### III. Dual Interface

Where a surface has an operator-facing aspect as well as an end-user aspect, a spec is
incomplete until it defines **both** views. Pure internal tooling with no operator-facing aspect
is exempt. Neither audience is treated as an afterthought of the other.

### IV. What, Not How

Specs and Decision Records MUST state required behaviour and constraints, not the framework,
library, service, or vendor that delivers them. Technology selections live in Decision Records
and `CONVENTIONS.md`. This constitution names no tools, versions, or style rules.

*Irreducible truth: requirements outlive implementations.*

### V. Adopt Before Building

Before building any non-trivial capability, the team MUST identify and assess at least one
mature existing solution and cite it. Building new infrastructure instead of adopting one
REQUIRES a Decision Record stating why adoption was rejected.

*Irreducible truth: unshared infrastructure is a permanent maintenance liability.*

### VI. Decisions Are Recorded and Versioned

Every non-trivial decision MUST be a Decision Record (context, options with at least one
existing solution assessed, decision, rationale, principles implicated, sources, status,
version, date). Reversing or materially changing a decision MUST be a new versioned Decision
Record that supersedes the old one — never a silent edit.

### VII. Challenger Before Locking

A decision that is contested, hard to reverse, or user-affecting MUST NOT be locked until it has
passed a structured review with three distinct roles: a **proposer**, at least one
**challenger** whose task is to make the strongest opposing case, and a **decider** at least as
capable as the proposer and challenger. The roles MAY all be performed by AI agents; they MUST
be genuinely separate passes, not one voice. The exchange and the ruling are recorded in the
Decision Record. Consensus is not required; a reasoned ruling by the decider is.

*Irreducible truth: a single reasoning pass rationalises; an adversary surfaces what it skipped.*

### VIII. Cite or Mark Assumption

In specs, Decision Records, and research notes, every factual or historical claim MUST carry a
verifiable human source, or be explicitly labelled `ASSUMPTION`. Reviews reject unmarked
unsourced claims.

### IX. Economy

The team MUST prefer the lowest-cost option that meets the spec, where cost includes money,
tokens, context, and operator time. Any fixed recurring cost REQUIRES a Decision Record.
Written output MUST carry no filler: no restating the prompt, no padding, no ceremony.

### X. Solo-Operable

Every required step MUST be executable by one person on modest hardware with no second human in
the loop. A step that cannot meet this MUST be automated or removed. "Get another reviewer" is
not an available answer; use the challenger role (VII) instead.

### XI. Honest by Construction

The team MUST NOT ship deceptive or manipulative monetisation, gambling mechanics, hidden costs,
or dark patterns. How the product makes money MUST be legible to the user. Data collection MUST
be the minimum the spec requires and disclosed.

## Operating Constraints

- **Single operator, modest hardware.** Assume one person on a mid-range laptop; treat anything
  needing more as a cloud task, and record it.
- **Maintenance-first.** Prefer the option with the smaller long-term maintenance surface. When
  a heavier option is chosen for capability or native feel, the accepted maintenance cost MUST
  be recorded in the Decision Record.
- **Cost posture.** Prefer options that scale toward zero when idle. Fixed monthly cost is a
  Decision Record, not a default.
- **Technology is not constitution.** Per-use-case stacks and tools are chosen through the
  Workflow & Decision Process when a real need exists, and recorded in Decision Records and
  `CONVENTIONS.md`.
- **Context is not constitution.** Audience, domain rules, and cultural framing live in the
  Context pack (separate, possibly private) and are referenced by specs, never inlined here.
- **Efficacy is measured.** Each product records baseline metrics — idea-to-ship time, count of
  post-implementation reworks, and running cost — so the method's effect can be shown, not
  asserted.

## Workflow & Decision Process

- **Spec Kit flow.** constitution → `specify` → (`clarify`) → `plan` → `tasks` → (`analyze`) →
  `implement`. Each stage reads this constitution and states which principles it implicates.
- **Async-first, single decider.** The written artifact is the unit of communication. For
  ordinary decisions the operator decides; for amendments and user-affecting decisions the
  owner is the final decider.
- **Council review (Principle VII).** Proposer drafts; challenger writes the strongest counter;
  decider rules. Fixed at one round unless the decider calls another. Recorded in the Decision
  Record.
- **Definition of Done.** A change is done only when its code, its spec/Decision Record update,
  and its journal entry land together. An undocumented change is reverted or documented before
  the next task begins.
- **Learning capture.** Every debugging session and every reversed decision MUST produce a
  durable note in the research / learnings library.

## Governance

- This constitution supersedes other team practices. Where a practice conflicts with it, the
  constitution wins or the constitution is amended — not ignored.
- **Scope guard.** Only portable principles belong here. Tool names, version pins, style rules,
  commit conventions, and personal or cultural context MUST NOT be added; they belong in
  `CONVENTIONS.md`, `CLAUDE.md` / `AGENTS.md`, or the Context pack.
- **Amendment procedure.** Proposed as a Decision Record, passed through council review
  (Principle VII), ratified by the owner, then version-bumped and dated.
- **Versioning (semantic).** MAJOR: a principle removed or redefined in a backward-incompatible
  way. MINOR: a principle or section added, or guidance materially expanded. PATCH:
  clarification, wording, or non-semantic refinement (includes the project rename).
- **Compliance.** Every spec, plan, and Decision Record names the principles it implicates and
  how it satisfies them; reviews verify this.
- **Anti-decoration review.** On each amendment, test every principle: *if it were deleted,
  would any plan or diff the team produces change?* A principle that no longer changes anything
  is flagged for removal.
- **Runtime guidance** for agents (workflow preferences, conventions, environment) lives in
  `CLAUDE.md` / `AGENTS.md`, not in this file.

**Version**: 1.0.0 | **Ratified**: 2026-09-07 | **Last Amended**: 2026-09-07
