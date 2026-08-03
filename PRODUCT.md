# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Scope note

This repo holds 4 surfaces (see root `CLAUDE.md`: PW/MW patient-web and
medics-web in this Astro project, PA/MA the two Expo apps in `mobile/` and
`mobile-medics/`). The user has scoped Impeccable work to the **marketing
website only** (`src/pages/index.astro` and its supporting marketing pages —
not `/user`, not `/medics`, not the mobile apps). Product truth below covers
the whole product where it affects marketing positioning, but visual/surface
work should stay confined to the marketing site unless the user re-scopes.

## Users

Two roles, asymmetric relationship to the product:

- **Primary buyer/decision-maker (the marketing site's actual audience):**
  healthcare professionals who manage patients with digestive/urological
  conditions — gastroenterology, geriatría, urología, coloproctología,
  enfermería especializada, suelo pélvico, nutrición. They subscribe to
  Fluxia's clinical panel, invite patients, set monitoring thresholds, and
  review patient adherence/data between or during consultations.
- **End user (free, not the buyer):** patients who log daily digestive
  symptoms (Bristol stool scale, notes) via a free mobile app. They join by
  accepting an invitation from their professional; they don't pay and aren't
  who the marketing site is written to convert.

## Product Purpose

Fluxia closes the loop between a patient's daily symptom log and the
clinician's view of it in real time, so the professional can monitor
adherence and flag patients who need attention without the patient manually
exporting or sending anything.

## Positioning

Real-time patient→clinician bridge, not a generic symptom diary or nutrition
app: data entered by the patient on their phone appears immediately in the
professional's panel, pre-triaged with a traffic-light system (green/orange/red
based on days since last entry, thresholds configurable per doctor and per
patient) so the professional can scan many patients at once instead of
reconstructing history at each visit.

## Operating Context

- Professional's workflow: invite patient → configure per-patient tracking
  variables/thresholds → monitor a dashboard across all patients between
  visits → export structured reports for the clinical record before/during
  consultations.
- Patient's workflow: accept invitation → log symptoms in the free app
  (no training required) → receive automatic reminders if logging lapses.
- No installation for the professional (browser-based panel); patient uses
  the native mobile app (App Store / Google Play).

## Capabilities and Constraints

- Patient side is 100% free and always will be (`mobile/src/lib/tiers.ts`
  hardcodes unlimited access on a single free tier — no paywall to design
  around).
- Professional side is a paid subscription, cancellable anytime, no
  permanence/penalty clauses (per current FAQ copy in `index.astro`).
- Fluxia does not diagnose — it is a logging/monitoring tool; clinical
  interpretation and decisions stay with the professional. Marketing copy
  must not imply diagnostic capability.
- Data residency/compliance: GDPR ("RGPD") compliant per current site copy —
  encrypted storage on European servers, data-processing agreement (DPA)
  signed per subscribed clinic/center.

## Brand Commitments

- Product name "Fluxia" / "Fluxia Health"; professional-facing app is
  branded "Fluxia Pro" (see root `CLAUDE.md` — MA project).
- Existing marketing site is in Spanish (es); keep language consistent
  unless the user asks for i18n.
- Specialties explicitly named as target verticals (do not drop or invent
  others without confirmation): Gastroenterología, Geriatría, Urología,
  Coloproctología, Enfermería especializada, Suelo pélvico, Nutrición.

## Evidence on Hand

- Live marketing copy, FAQ, benefits, and specialty list already exist in
  `src/pages/index.astro` — treat as current product truth/voice, not
  placeholder text, unless the user says otherwise.
- `documents/` has legacy content docs (`fluxia_web_content.docx`,
  `fluxia_web_prompt.docx`) and image assets — check before assuming an
  asset must be generated from scratch.
- No testimonials, case studies, press, or usage-metrics were found in the
  repo; do not fabricate these for the marketing site.

## Product Principles

1. The professional is the buyer and the reader of the marketing site — copy
   and design should speak to clinical workflow value (faster review, fewer
   missed patients), not to the patient's daily-logging experience.
2. Never claim diagnostic capability; Fluxia is a registration/monitoring
   layer, not a decision-maker.
3. Free-for-patient / paid-for-professional is a durable structural fact —
   any pricing or CTA design must respect this asymmetry.
4. Trust signals (GDPR, EU hosting, DPA per clinic, no-diagnosis disclaimer)
   are load-bearing for a healthcare-professional audience, not optional
   compliance footnotes.

## Accessibility & Inclusion

No explicit accessibility standard was confirmed with the user; healthcare
professional audience skews toward desktop/clinical settings. Treat WCAG AA
as the sensible default until the user specifies otherwise.
