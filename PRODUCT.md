# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
One user per deployment: the owner. They are neurodivergent. They read on a phone, a tablet and a laptop through the web app, and on a Kobo Libra 2 e-reader. Their job is to browse a Calibre library of about 700 books (mostly EPUB), read in the browser, often offline, and pick up where they left off on any device.

## Product Purpose
Ribbon is a private cloud mirror of a Calibre library. It has a web reader (an installable PWA that works offline) and syncs reading progress both ways with the e-reader, via Calibre. Success means the owner opens any book on any device at the right place without thinking about it, and Calibre on the desktop stays the only place books are managed.

## Positioning
A self-hosted mirror that keeps Calibre as the source of truth. It doesn't replace it. Progress from each device is kept separately and offered ("Kobo: 63%, ch. 12. Jump there?"), never overwritten silently.

## Operating Context
- Books are managed in Calibre on a Linux desktop (macOS wanted). The `ribbon` CLI uploads the library and syncs progress through Calibre custom columns.
- The Kobo is loaded over USB by Calibre. The web app runs on Cloudflare behind Cloudflare Access, with a long session so it works offline.
- Sessions are reading sessions: long, focused, often in low light, and on small screens as often as large ones.

## Capabilities and Constraints
- v1: library browsing and search, book detail, offline download (OPFS), an EPUB/KEPUB/PDF reader (foliate-js), and two-way progress sync.
- Not in v1: editing metadata, multi-user or public sharing, replacing Calibre's device driver.
- Follows the system light/dark and reduced-motion settings. Sizes are in `rem`, so browser zoom and text size work everywhere.
- In-app appearance settings (the "dial") are deferred to a later spec.
- Stack and architecture: see `docs/DESIGN.md` (architecture, not visual design) and `CLAUDE.md`.

## Brand Commitments
- Name: Ribbon.
- calm-ds (v0.1.0) is **guidance, not binding** (owner decision, 2026-11-18): quiet senses, predictable, one thing at a time, remember for me, no pressure, plain words, the person holds the dial. Expressive type and colour are allowed, but reading surfaces should still favour calm and focus.
- Plain-words voice: no marketing claims, no exclamation, and no "AI-ish" copy.

## Evidence on Hand
- The design catalogue at `/design` (spec 001) has token pages and rationale with sources.
- No real cover images, user testimonials or metrics exist. Don't fabricate any. Sample data (700 generated books) is planned in spec 001, T037.

## Product Principles
1. Get out of the way of reading: the book is the interface, and the chrome appears only when asked for.
2. Never lose the owner's place, and never overwrite it silently.
3. Same place, same behaviour, on every device: predictability over novelty.
4. Low maintenance: few moving parts, web standards over plugins.

## Accessibility & Inclusion
- WCAG 2.2 AA as a minimum. Text contrast is checked by tests, and axe runs in light and dark.
- Neurodivergent-friendly: low sensory load, no autoplaying or decorative motion, honour `prefers-reduced-motion`, and no time pressure.
- Visible 3px focus ring, targets of at least 24px, and plain-language labels.
