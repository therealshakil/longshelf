# Research: 001 Visual design

Date: 2026-11-14. Each item: Decision, Rationale, Alternatives, Sources. Claims without a source
are labelled ASSUMPTION. Source numbers refer to the list at the end.

**Evidence quality, stated up front.** The evidence for calm and neurodivergent-friendly design is
mostly guidance and small studies, not large controlled trials ([9], [10], [12]). Where research is
thin, this file says so. In those places the design leans on standards (WCAG 2.2) and on the
owner's own judgement, which calm-ds names as the acceptance test ("first user").

---

## R1. Catalogue tool (FR-018–FR-022)

**Decision (accepted 2026-11-14):** a custom catalogue built into the app as its own route. One page per
token group or component. Full record and challenger pass: `docs/decisions/DR-0001-design-catalogue.md`.

**Rationale:** checked against the npm registry on 2026-11-14.

| Option | Svelte 5? | Maintained | Fit |
|---|---|---|---|
| Storybook 10.6.7 + `@storybook/sveltekit` | Yes (peer `svelte ^5`) | Yes, released 2026-11-13 | Mature: addons for accessibility, controls and docs. It runs as a second app with its own dev server, build and config (~22 MB core, 17 deps). App preferences would have to be rebuilt as Storybook toolbar globals (FR-020). |
| Histoire 1.0.0-beta.1 | **No** (`@histoire/plugin-svelte` peer `svelte ^3 \|\| ^4`) | Last release 2026-01-07 | Ruled out: it can't run our components. |
| Kitbook 1.0.0-beta.31 | **No** (peer `svelte ^3 \|\| ^4`) | Last release 2024-04-27 | Ruled out: no Svelte 5 support and apparently no longer updated. |
| Sveltescape | Unknown | Unknown | Ruled out: too little evidence that it is maintained [14]. |
| Ladle | React only [14] | — | Ruled out. |
| **Custom in-app route** | Native | Our own code | The pages are real app components. They read the app's own preferences (FR-020), work offline, and add no dependencies. Cost: we write the page shell, a navigation index and a states grid. |

## R2. Typefaces

**Decision:**
- **Interface text:** Atkinson Hyperlegible Next.
- **Reading surface:** a short list of options:
  - the book's own font (default),
  - Literata (serif, designed for reading on screens),
  - Atkinson Hyperlegible Next.

Font files are hosted with the app so they work offline. Both fonts are open-licensed (SIL OFL).

**Rationale:**
- Atkinson Hyperlegible was designed so that no two letters can be mistaken for each other, using
  feedback from low-vision readers [6]. No controlled reading-speed study was found, so treat the
  benefit as plausible, not proven. Version "Next" (2025) adds 7 weights and a monospace [6].
- So-called dyslexia fonts show no benefit:
  - OpenDyslexic: no gain in reading rate or accuracy [7].
  - Dyslexie: neither helps nor hinders. Children preferred Arial, and preference did not predict
    performance [8].
- The FocusView study found that customisation options can themselves become a distraction, so
  the list of options stays short [12].
- Literata was commissioned for e-reading. ASSUMPTION: this rests on Google Fonts' description,
  not a reading study.

**Alternatives:**
- OpenDyslexic as an option: rejected, because there is no evidence of benefit [7][8]. It can be
  added later if the owner asks; the font list is the owner's to change.
- The operating system's own fonts only: rejected, because they look different on each device,
  which breaks "Predictable".

## R3. Light or dark (polarity), and backgrounds

**Decision:**
- With no saved choice, Ribbon follows the system setting.
- If the system has no preference, the default is light: dark text on an **off-white** background,
  never pure white.
- The dark theme uses dark grey, not black, with off-white text.

**Rationale:**
- Dark-on-light text gave smaller pupils and better proofreading accuracy [4].
- Later work suggests the difference is small and depends on the lighting around you [5]. So this
  is the person's choice (calm-ds VII), and system settings are followed.
- calm-ds I says no pure-white fields behind text. The British Dyslexia Association and autism
  guidance recommend cream or soft backgrounds [2][10].
- ASSUMPTION: pure black behind off-white text causes text "halation" for some readers. Dark grey
  is the common mitigation.

**Alternative rejected:** dark as the default. The polarity evidence favours light.

## R4. Contrast

**Decision:**
- Every theme and contrast combination meets **WCAG 2.2 AA**:
  - text 4.5:1, large text 3:1 (SC 1.4.3),
  - interface parts and graphics 3:1 (SC 1.4.11) [1].
- With the higher-contrast setting, body text reaches **7:1** (AAA, SC 1.4.6).
- Contrast is measured in automated tests from the token values (see `quickstart.md`).
- The default stays below maximum contrast. Body text aims for about 9–12:1 rather than 21:1, to
  avoid glare (calm-ds I). ASSUMPTION: the exact target is tuned by the owner during review.

**Alternative:** APCA, the contrast method drafted for WCAG 3. Rejected as the pass/fail rule
because WCAG 3 is still a draft and not a standard. ASSUMPTION: this is the draft's status as of
2026-11; check it again before relying on it.

## R5. Colour use

**Decision:**
- Muted, low-saturation neutrals.
- **One** accent per view (calm-ds I), a desaturated blue-green.
- No bright red or yellow areas. Errors use text plus an icon and a muted tone, never red alone
  (SC 1.4.1).
- Colour tokens are defined in OKLCH so lightness can be adjusted predictably.

**Rationale:**
- Autism guidance recommends soft colours and advises against bright, saturated ones [2][10].
- Meaning must not rely on colour alone [1] (FR-008).
- A reported preference against bright red and yellow among autistic people could not be traced
  to a primary study, so it is not cited as evidence [10].
- The accent hue is an ASSUMPTION, open to owner review.

## R6. Line length, spacing and text size

**Decision:**
- **Reading surface:**
  - lines of about 60–70 characters at most (`max-inline-size: 66ch`),
  - line height 1.5 by default and 1.8 with "wider" spacing,
  - paragraph spacing at least 2× the font size when "wider" spacing is on.
- **Interface:** body text at least 16 px, sized with `rem` so every size follows the browser and
  the owner's text-size setting.
- **Text-size setting:** 4 steps, 100 / 112.5 / 125 / 150 % of the root size.
- **Layout:** must hold up under the WCAG text-spacing overrides (SC 1.4.12) and reflow at
  320 CSS px without sideways scrolling (SC 1.4.10).

**Rationale:**
- Readers found about 55 characters per line easiest. Longer lines were read faster but rated
  harder, and the findings are not fully consistent across studies [11].
- The BDA is cited (secondary source) as recommending 60–70 characters [11]. Its guidance also
  recommends 1.5 line spacing and left-aligned, unjustified text [2] — ASSUMPTION, because the
  BDA style-guide page itself returns 404 (noted in the calm-ds sources).
- The comfort reported by readers counts here because this is a calm product: people's
  preference for moderate line lengths is weighted above raw reading speed.

## R7. Motion and sound

**Decision:**
- No motion by default. All transitions are 0 ms unless the motion setting is "on".
- Even with motion on, nothing moves on its own; things move only in response to the owner.
- No sound at all.

**Rationale:**
- calm-ds I.
- WCAG 2.2 SC 2.2.2 (pause, stop, hide), SC 2.3.1 (flashes) and SC 2.3.3 (animation from
  interactions) [1].
- Respect the system's reduced-motion setting [3].

## R8. Focus, target size and density

**Decision:**
- Focus ring: a solid 3 px outline offset from the element, with at least 3:1 contrast against
  both the element and its background. This meets SC 2.4.13 Focus Appearance (AAA), not only AA.
  Focused items are never hidden behind other content (SC 2.4.11).
- Targets:
  - "Comfortable" density: at least 44×44 px (SC 2.5.5, AAA).
  - "Compact" density: at least 24×24 px (SC 2.5.8, AA).

**Rationale:**
- WCAG 2.2 [1].
- A clearly visible focus ring supports "find my way with eyes half-closed" (calm-ds II).

## R9. Saving preferences (FR-011, FR-012)

**Decision:**
- Preferences are stored in the browser's per-device storage (`localStorage`), under one
  versioned key.
- A tiny inline script in the document head applies them before the first paint, so there's no
  flash of the wrong theme.
- If storage can't be read, Ribbon uses the calm defaults and the system's settings, silently.
  This follows the spec's edge cases.

**Rationale:**
- There are only a few small values, and they're needed before the first paint. IndexedDB (via
  Dexie, which the project already uses) can't be read synchronously in time.
- Syncing preferences between devices is out of scope (spec Assumptions).

**Alternative rejected:** Dexie. It's asynchronous, which would cause a flash of the default theme
on load.

## R10. Status, errors and copy

**Decision:**
- Sync and offline status is a small, still, text-plus-icon indicator in the app frame, never a
  pop-up notification.
- Errors follow calm-ds VI: what happened, whether anything was lost, and the one next step.
- No badges or counts.

**Rationale:**
- Calm Technology: information lives in the periphery [13].
- calm-ds V and VI.
- Home Office anxiety and autism posters: tell people what will happen, use plain words and
  descriptive buttons [2].

## R11. Accessibility testing

**Decision:**
- Automated checks run axe-core through Playwright on every catalogue page, across a matrix of
  preference combinations.
- Contrast is unit-tested from the token values.
- A 30-minute review by the owner (SC-006) is the final gate.

**Rationale:**
- axe-core (Deque) is the established engine: 4.14.0, no dependencies of its own.
- Playwright is already part of the stack.
- **New dependency, needs owner approval** (CLAUDE.md principle 4): `@axe-core/playwright`
  (dev only).

---

## Sources

1. W3C, *WCAG 2.2* — https://www.w3.org/TR/WCAG22/ (SC 1.4.1, 1.4.3, 1.4.6, 1.4.10, 1.4.11,
   1.4.12, 2.2.2, 2.3.1, 2.3.3, 2.4.11, 2.4.13, 2.5.5, 2.5.8).
2. UK Home Office, *Dos and don'ts on designing for accessibility* (autism, dyslexia, anxiety
   posters) — https://ukhomeoffice.github.io/accessibility-posters/ ; British Dyslexia Association
   — https://www.bdadyslexia.org.uk/advice/employers/creating-a-dyslexia-friendly-workplace
3. W3C, *Media Queries Level 5* — https://www.w3.org/TR/mediaqueries-5/
4. Piepenbrock, Mayr & Buchner (2014), "Smaller pupil size and better proofreading performance
   with positive than with negative polarity displays", *Ergonomics* —
   https://informahealthcare.com/doi/abs/10.1080/00140139.2014.948496
5. Dobres et al. (2017), cited in "My Rhodopsin!" — https://arxiv.org/pdf/2203.16546 ; overview:
   https://cogsci.nl/blog/is-bright-text-on-a-dark-background-a-good-idea
6. Atkinson Hyperlegible — https://github.com/googlefonts/atkinson-hyperlegible ;
   https://en.wikipedia.org/wiki/Atkinson_Hyperlegible ; Next (2025):
   https://ophthalmologymanagement.com/news/2025/applied-design-and-braille-institute-partner-to-launch-typeface-for-making-reading-easier/
7. Wery & Diliberto (2017), "The effect of a specialized dyslexia font, OpenDyslexic, on reading
   rate and accuracy", *Annals of Dyslexia* — https://pmc.ncbi.nlm.nih.gov/articles/PMC5629233
8. Kuster et al. (2018), "Dyslexie font does not benefit reading in children with or without
   dyslexia", *Annals of Dyslexia* 68(1) — https://pubmed.ncbi.nlm.nih.gov/30094714/ (related
   record); summary: https://dyslexiahelp.umich.edu/latest/does-dyslexie-font-help-dyslexic-readers/
9. De Los Rios Perez (2020), web design guidelines for autistic users (thesis), Curtin University —
   https://espace.curtin.edu.au/bitstream/20.500.11937/80127/1/De%20Los%20Rios%20Perez%20C%202020.pdf
10. Scope, *Designing for people on the autism spectrum* —
    https://business.scope.org.uk/designing-for-people-on-the-autism-spectrum/ ; HS2 design system,
    autistic spectrum — https://designsystem.hs2.org.uk/accessibility/designing-accessible-services/autistic-spectrum
11. Dyson (2004), "How physical text layout affects reading from screen" —
    https://stu.westga.edu/~ssynan1/literacy/Dyson.pdf ; line length overview:
    https://en.wikipedia.org/wiki/Line_length
12. FocusView: customising video for viewers with ADHD (2025) — https://arxiv.org/html/2511.01248
13. Amber Case, *Calm Technology* — https://calmtech.com/
14. Storybook alternatives overview — https://www.pkgpulse.com/guides/storybook-8-vs-ladle-vs-histoire-2026 ;
    Sveltescape — https://github.com/AlessioGr/sveltescape
15. npm registry (`npm view`), checked 2026-11-14: storybook 10.6.7, @storybook/sveltekit 10.6.7,
    @histoire/plugin-svelte 1.0.0-beta.1, kitbook 1.0.0-beta.31, axe-core 4.14.0.
