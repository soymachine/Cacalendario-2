---
target: marketing homepage (src/pages/index.astro)
total_score: 23
max_score: 32
na_heuristics: 7,9
p0_count: 1
p1_count: 2
timestamp: 2026-08-03T08-49-04Z
slug: src-pages-index-astro
---
Method: dual-agent (A: design review · B: detector + browser evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Only status cues are the nav `.is-scrolled` shadow and the FAQ rotate icon; the video modal's Vimeo iframe has no loading state |
| 2 | Match System / Real World | 3 | Semáforo/Bristol language is accurate and domain-correct; the security section's icon (generic shield-in-circle) doesn't visually differentiate from any generic-security SaaS |
| 3 | User Control and Freedom | 3 | Video modal closes correctly; no section has `scroll-margin-top`, so every `#anchor` nav click lands the target heading under the sticky nav |
| 4 | Consistency and Standards | 3 | Token system is applied consistently almost everywhere; detector confirms 2 literal colors and 14 literal font-sizes drift off the documented DESIGN.md scale, concentrated in secondary chrome (step numbers, footer, pricing fine print, video modal inline styles) |
| 5 | Error Prevention | 3 | No form inputs beyond a mailto link; nothing to prevent |
| 6 | Recognition Rather Than Recall | 2 | Semáforo legend (green/amber/red) is defined once in the clinical-panel section and never reinforced near pricing or FAQ, where a buyer re-evaluates it from memory |
| 7 | Flexibility and Efficiency | n/a | Persuade-mode single-path landing page; no power-user path is expected |
| 8 | Aesthetic and Minimalist Design | 3 | Mostly clean; the tagline "Datos reales. Decisiones mejores." is copy-pasted verbatim in 3 places rather than varied, and the 14 off-ramp font sizes the detector found are mostly harmless one-offs but signal the type scale is thinner in practice than documented |
| 9 | Error Recovery | n/a | No user-input error states exist on this page |
| 10 | Help and Documentation | 2 | FAQ is the only help surface; present but thin — the most legally/emotionally important question ("¿Fluxia realiza diagnósticos?") sits at position 8 of 10 instead of near the top |
| **Total** | | **23/32** | **72% — Good** |

## Design Specificity Verdict

**Design review (source-level):** The copy is genuinely specific to this product — the semáforo legend, Bristol-adjacent language, RGPD/DPA phrasing, and the named-specialty grid are not stock SaaS filler. But the *component vocabulary* wrapping that copy is templated: icon-top-title-body benefit cards, numbered-circle "3 steps," a plain 3-tier pricing table, and a details/summary FAQ are all interchangeable with any B2B analytics landing page. Strip the Spanish medical copy and the shell reads as generic. The one place the product's real visual identity shows through is the semáforo legend dots and the dashboard/app screenshots — everything else is a clinical color story wrapped around a default layout.

**Deterministic scan:** `detect.mjs` returned exit code 2 with 16 advisory findings, all `category: quality`: 2 `design-system-color` (line 143 nav-shadow rgba; line 673 the video-modal's inline `#000`/`rgba(0,0,0,0.5)`) and 14 `design-system-font-size` (lines 202, 205, 237, 280, 284, 285, 309, 310, 320, 326, 414, 416, 487, plus one more — spanning step numbers, price amounts, footer labels, and body copy). These corroborate the design review's point independently: the *documented* type ramp (display/headline/body-lg/body/label) only captures 5 sizes, but the live page actually uses well over a dozen fine-tuned sizes for secondary chrome. That's not necessarily a defect — several are pre-existing, reasonable micro-adjustments (e.g. 40px price amount, 20px step-number) — but it means DESIGN.md's five named roles under-describe the real scale in use, and the video modal's inline `#000`/`rgba(0,0,0,.5)` values are literally hand-rolled outside the token system entirely rather than referencing `--fx-ink-900` or similar.

**Visual overlays:** Browser inspection could not run — the Claude-in-Chrome extension was not connected in this environment, so no live screenshots, computed-style sampling, or injected-detector console output are available. No overlay is visible in a `[Human]` tab. Findings above are source-code-only; visual/responsive rendering, image-404 checks (`/dashboard-screenshot.png`, `/fluxia-logo.png`), and contrast measurements were **not verified live** and should be treated as unconfirmed until a browser pass is possible.

## Overall Impression

The copy has real conviction and the semáforo legend is a genuinely on-brief moment — but the layout around it is safe, default B2B composition, and the page's two highest-stakes moments for its actual buyer (a paying, skeptical clinician) — the Security section and the pricing tier hierarchy — are also its most generic passages. The single biggest opportunity is making the semáforo/color-coded triage idea the throughline of the whole page instead of a one-time aside, and giving the Security section the specificity its own PRODUCT.md says it needs.

## What's Working

- **Semáforo legend integration**: pairing the three status dots with plain-language explanations directly in the clinical-panel narrative is the one place UI *is* the product story, not decoration.
- **Lime "split-tag" callouts**: short lime-colored payoff lines after longer body paragraphs create a genuine second-read scan pattern specific to this design system's "One Accent Rule," not a generic pull-quote.
- **Pricing feature honesty**: the tier feature lists name concrete deliverables (PDF export, shared history, permission management) instead of vague "everything you need" filler, respecting a professional buyer's evaluation process.

## Priority Issues

**[P0] Scroll-anchor occlusion**
- **Why it matters**: every nav link and footer link is a `#anchor` jump; without `scroll-margin-top`, the sticky nav (backdrop-blur bar) covers the top of whatever heading the user just clicked to reach — on a page whose entire top nav is anchor links, this breaks the primary navigation pattern for every single link.
- **Fix**: add `scroll-margin-top: ~90px` to each section id (`#how`, `#benefits`, `#security`, `#pricing`, `#faq`) or set `html { scroll-padding-top: 90px }` once, globally.
- **Suggested command**: `$impeccable harden`

**[P1] Semáforo legend never reinforced (recognition-over-recall gap)**
- **Why it matters**: the traffic-light triage system is Fluxia's actual differentiator per PRODUCT.md, introduced once and then never repeated — a buyer skimming pricing or FAQ has to recall green/amber/red from memory instead of recognizing it in context, weakening the product's core pitch exactly where it should be reinforcing it.
- **Fix**: repeat a small persistent color-key chip near the FAQ's "sistema de colores" answer and/or fold it into a benefit card ("Revisión más rápida") instead of leaving it as a single mid-page aside.
- **Suggested command**: `$impeccable layout`

**[P1] Security section is the most generic passage at the highest-stakes moment**
- **Why it matters**: PRODUCT.md explicitly flags GDPR/DPA/EU-hosting messaging as load-bearing, not a footnote, for a healthcare-professional buyer handling clinical data — yet this section uses a stock shield-in-circle icon and a single generic RGPD sentence with no named certification, audit cadence, or incident-response commitment, right where a skeptical clinician needs the most concrete reassurance.
- **Fix**: replace the generic icon treatment with something that names a specific, honest claim (EU region, DPA signing step, audit cadence) as a fourth security-point item rather than only atmosphere.
- **Suggested command**: `$impeccable clarify`

**[P2] Free-tier and paid-tier pricing cards carry equal visual weight**
- **Why it matters**: "Inicio" (the free 30-day tier) reads with nearly the same card weight as "Equipo" (the top paid tier) even though the free tier lists the same "panel clínico con código de colores" feature the paid tiers do — a buyer has to read all three cards side-by-side to understand what's actually gated behind payment, adding friction at the exact moment of the purchase decision.
- **Fix**: visually de-emphasize "Inicio" (lighter card, smaller type, or an explicit "prueba" framing) so its role as a time-limited trial rather than a parallel offering is legible at a glance.
- **Suggested command**: `$impeccable layout`

**[P3] Copy-pasted tagline and off-ramp font sizes dilute polish**
- **Why it matters**: "Datos reales. Decisiones mejores." repeats verbatim at hero, mid-page tag, and footer — a repeated line that should land as a memorable closing beat instead reads as copy-paste filler; separately, the detector's 14 font-size findings confirm the documented 5-role type scale doesn't capture the ~14 secondary sizes actually in use, which is more a documentation gap than a visual defect but worth reconciling.
- **Fix**: vary the tagline's phrasing or placement so the ending escalates instead of recycling; extend DESIGN.md's typography section with a couple more named steps (e.g. a "caption-sm" ~13px, "stat" ~40px) to match reality, or move to the documented ramp exactly where a stray size has no real reason to differ.
- **Suggested command**: `$impeccable typeset`

## Persona Red Flags

**The skeptical clinician** (project-specific, derived from PRODUCT.md's professional-buyer audience): arrives at the Security section expecting audit/certification specifics and finds a stock icon plus one generic RGPD sentence — no ISO reference, no named EU region, no incident-response commitment. Then notices the free "Inicio" card already lists "panel clínico con código de colores," the same feature the paid tiers charge for, and has to read all three cards to understand what payment actually buys.

**Riley (Stress-Tester)**: the two hero CTAs ("Pruébalo gratis" and "Ver cómo funciona") are both `.btn-lg` size with only fill-vs-outline differentiating them — under fast scanning there's no unambiguous single primary action in the first viewport.

**Casey (Distracted Mobile User)**: the 6-card benefits grid and 7-tile specialties grid both collapse to single-column stacks below their `auto-fit minmax` breakpoints, producing a long undifferentiated scroll of 13 total icon-tiles back-to-back with no pacing break — high scroll fatigue for someone skimming one-handed.

## Minor Observations

- `.hero-tag` and the footer tagline give the identical string two different typographic treatments — inconsistent emphasis for a repeated phrase.
- The video thumbnail reuses the dashboard screenshot a second time instead of a distinct video-specific still, weakening the "watch a 1-minute demo" promise before the click.
- FAQ ordering buries the no-diagnosis disclaimer at position 8 of 10 rather than near the top, where a legally/emotionally load-bearing answer (per PRODUCT.md) would reassure earliest.
- Detector-flagged colors/sizes are concentrated in low-visibility chrome (nav shadow, video modal inline styles, footer/price fine print) — none are in primary brand-carrying elements, so this is a documentation/consistency debt rather than a visible defect today.

## Questions to Consider

- If the semáforo legend is the single most product-specific visual asset on the page, why does it appear only once instead of anchoring the whole narrative arc from hero through pricing?
- Is the Security section's genericness a copy gap or a content gap — does Fluxia have a named certification/audit cadence to point to, or is "cifrado en Europa" honestly the ceiling of what can be claimed today?
- Given "Inicio" and "Profesional" currently look like near-equal siblings, should the free tier be visually demoted to read clearly as a trial gate rather than a parallel option?
