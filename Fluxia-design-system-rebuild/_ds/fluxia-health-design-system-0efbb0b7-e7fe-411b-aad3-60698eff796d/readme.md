# Fluxia Health — Design System

> A calm, accessible design system for **Fluxia**, a healthcare app for tracking bowel movements and urination. Built for patients (including older adults and people with low digital confidence) **and** healthcare professionals. The system must feel modern, soft, trustworthy and technological — clinical but never cold — while making an intimate topic feel private, respectful and completely normal.

---

## 1 · Product & brand context

**Fluxia** lets a person log a bowel movement or urination event in **under 20 seconds**, add symptoms/notes/medication, see daily and weekly trends, and share a clean report with their doctor. Two audiences share one product:

- **Patients** — daily logging, reassurance, plain language, large targets. Many are older or anxious about the topic. The design reduces embarrassment.
- **Healthcare professionals** — clinical summaries, trends, exportable reports, alert flags (blood/mucus, dehydration, irregularity).

**Brand personality:** calm · clear · human · clinical-but-warm · soft technology (not aggressive SaaS) · reassuring for older users · precise enough for medical use, simple enough for daily logging.

**Sample sources provided (for reference — reader may not have access):**
- `uploads/Fluxia_logo.jpg` — the official Fluxia logo (flowing stacked-"F" mark, yellow→green→teal→blue gradient + charcoal "Fluxia" wordmark). Exact brand colors were sampled from this file.
- 5 dashboard inspiration screenshots (FundFlow, SugarCRM, Creative Juice, QuickBooks, Salesforce) — used **only** as visual-mood reference: soft pastel backgrounds, translucent/glass cards, large rounded modules, subtle atmospheric gradients, generous spacing, calm data viz. These are not Fluxia products.

UI copy across the system is **Spanish**, warm and direct (see Content Fundamentals).

---

## 2 · Content fundamentals (voice & copy)

How Fluxia writes:

- **Language:** Spanish (España). Warm, plain, direct. No jargon, no clinical coldness.
- **Person:** Speaks *to* the user with implicit/explicit "tú" but mostly **imperative + neutral nouns** for actions: "Registrar deposición", "Compartir informe". Reassurance uses "tu/tus": "Tus registros", "Empieza con tu primer registro".
- **Tone:** Reassuring, never clinical-scary, never jokey. The subject is normalised — we say "deposición" and "micción", never euphemisms, baby-talk or toilet humour.
- **Casing:** Sentence case everywhere (buttons, titles, labels). No ALL-CAPS shouting. Headings can be title-like but stay sentence case.
- **Length:** Short. Buttons are 1–3 words. Helper text is one calm sentence.
- **Questions** invite input gently: "¿Cómo ha sido?", "¿Notaste algo?".
- **Errors** are calm, direct, helpful — never blame: "No se pudo guardar. Vuelve a intentarlo." / "Revisa la hora antes de continuar."
- **Empty states** encourage, never nag: "No hay registros todavía", "Empieza con tu primer registro".
- **Emoji:** **None.** The topic is sensitive; emoji would feel childish. Status is shown with calm color + icon + words, never 💩.
- **Numbers/units:** Spanish formatting — decimal comma ("1,4 L"), 24h time ("11:24 h").

Canonical phrases: *Registrar deposición · Registrar micción · ¿Cómo ha sido? · Añadir síntoma · Resumen de hoy · Resumen semanal · Compartir informe · No hay registros todavía · Empieza con tu primer registro · Guardado · Hace 5 minutos.*

---

## 3 · Visual foundations

**Overall feel:** soft, airy, fluid, medical-premium. Lots of white/pale space; nothing dense; nothing harsh.

- **Backgrounds:** pale green-white (`--color-bg` #F4F7F3) washed with a very subtle multi-stop **atmospheric gradient** (`--gradient-page`) — blurred blobs of green, lime, blue and a hint of violet at low opacity, bled off the edges. Never a flat white app, never a loud gradient.
- **Color:** anchored on the **logo gradient** — yellow `#D4D62F` → green `#78AD89` → teal `#539D9F` → blue `#467CB3`. Primary = blue (trust/action), secondary = green (wellbeing), accent = teal (fluid/data), lime = sparing energy highlight only, violet = atmospheric only. Text is **charcoal** (`--ink-800` #2D3539), never pure black.
- **Typography:** **Lexend** throughout — a typeface engineered to reduce reading fatigue and improve reading proficiency, ideal for older / low-confidence users. Weights 300–700; headings semibold with gentle negative tracking; body defaults to **18px** for readability (never below 16px). Tabular figures for metrics/times.
- **Cards:** generously **rounded** (radius-xl 26px, large modules 32px), **white or translucent glass**, **lightly elevated** with soft cool-tinted shadows (never black). Glass cards add a 1px white inner ring + 18px backdrop blur. No colored-left-border cards, no harsh outlines.
- **Spacing:** 4px grid, generous. Default screen gutter 20px, comfortable card padding 20–24px. The UI breathes.
- **Borders:** hairline, soft (`--border` #DCE2DF). Used lightly; elevation/shadow does most separation work.
- **Shadows / elevation:** soft, diffuse, cool-tinted (blue-green). xs→xl scale; colored glows (`--shadow-primary`) reserved for the main action only.
- **Gradients:** subtle, blurred, atmospheric — the signature flow for hero/header panels and the FAB; data fills use low-opacity green/blue washes. Never decorative for its own sake.
- **Motion:** calm and gentle. Soft ease-out (`--ease-out` cubic-bezier(.16,1,.3,1)), 140–340ms, **no bounce, no spring**. Entrances fade + small rise. Respects `prefers-reduced-motion`.
- **Hover:** subtle — primary darkens (500→600), surfaces gain a touch more shadow, ghost items get a pale fill. **Press:** slight scale-down (0.98) + color deepen, never jarring.
- **Transparency & blur:** used for glass surfaces (bottom sheets, sticky headers, floating nav) over atmospheric backgrounds — purposeful, not everywhere.
- **Imagery vibe:** soft, warm-cool, calm. Avoid stock-clinical hospital imagery. Prefer abstract fluid gradient shapes and human, low-saturation photography if any.

**Avoid:** childish toilet/poop icons or jokes, bluish-purple crypto gradients, emoji cards, colored-left-border cards, finance/crypto-dashboard density, tiny complex data panels, aggressive hospital blue, pure black.

---

## 4 · Iconography

- **System:** [Lucide](https://lucide.dev) — rounded, friendly, consistent **1.75px** stroke, open and legible at small sizes. Loaded from CDN (`unpkg.com/lucide`); icons referenced by name (`droplets`, `activity`, `calendar-days`, `pill`, `heart-pulse`, `file-text`, `trending-up`, `bell`, `circle-check`, `triangle-alert`…). **Substitution flagged:** no Fluxia icon set was provided, so Lucide is used as the closest calm, medical-appropriate match. Replace with a bespoke set if one exists.
- **Usage:** always **icon + text label** together (accessibility + clarity for older users). Active/selected icons tint with `--color-primary`; default icons use `--ink-700`.
- **Sizing:** 20–26px inline, 26–28px in nav. Touch target around any icon button ≥ 48px.
- **Emoji / unicode as icons:** never. The Bristol stool scale is rendered with tasteful abstract shapes, never literal/cartoon imagery.
- **Logo asset:** `assets/logo/fluxia-mark.svg` (scalable, transparent, recreated from the brand gradient) + `assets/logo/fluxia-logo-full.jpg` (original supplied lockup).

---

## 5 · Repository index

| Path | What |
|---|---|
| `styles.css` | **Entry point** — `@import`s every token file. Consumers link this only. |
| `tokens/` | `colors · gradients · fonts · typography · spacing · radius · shadows · motion · base` — CSS custom properties. |
| `guidelines/*.card.html` | Foundation specimen cards (Colors, Type, Spacing, Brand) shown in the Design System tab. |
| `assets/logo/` | Fluxia mark (SVG) + original lockup (JPG). |
| `components/` | Reusable React UI primitives (see below). |
| `ui_kits/fluxia-app/` | High-fidelity mobile app screens (onboarding, home, quick logs, timeline, weekly, trends, profile, settings, export, empty state). |
| `SKILL.md` | Agent-Skill manifest for downloadable use. |

**Components** — all compile to `window.FluxiaHealthDesignSystem_0efbb0` and style from the CSS tokens.

| Group (dir) | Components |
|---|---|
| `components/buttons/` | `Button` (primary/secondary/ghost/quiet/destructive), `IconButton` |
| `components/forms/` | `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`, `RadioCard`, `Slider`, `SegmentedControl`, `DatePicker`, `TimePicker` |
| `components/surfaces/` | `Card` (surface/glass/flow), `Badge`, `Tag` |
| `components/feedback/` | `AlertBanner`, `Toast`, `Modal`, `BottomSheet`, `EmptyState`, `ProgressBar`, `Spinner` + `Skeleton` + `LoadingBlock` |
| `components/navigation/` | `TopBar`, `BottomNav` (with FAB) |
| `components/data/` | `MetricCard`, `CalendarStrip`, `TimelineItem`, `MedicalNoteCard` |
| `components/health/` | `QuickLogCard`, `BristolScaleSelector`, `UrgencySelector`, `PainSelector`, `BloodMucusSelector`, `FluidIntakeSelector`, `MedicationField`, `SymptomTags`, `DailySummaryCard`, `WeeklyTrendCard`, `ClinicalAlertCard`, `ExportReportButton`, `ProfessionalReviewCard`, `BowelLog`, `UrinationLog` |

Internal: `components/_internal/fxStyle.js` (`injectStyle` helper — not part of the public API).

**UI kit:** `ui_kits/fluxia-app/index.html` — interactive recreation. Shell `app.jsx`; screens `screens-main.jsx` (Home, Empty, Timeline, Weekly, Trends) + `screens-account.jsx` (Onboarding, Profile, Settings, Export); log flows `logflows.jsx` (choose / bowel / urination bottom sheets).

---

## ⚠ Caveats / open questions
- **Fonts:** Lexend is loaded from Google Fonts. For production, self-host the woff2 files. (No font binaries were provided.)
- **Logo:** the SVG mark is a faithful recreation of the supplied JPG logo using sampled gradient stops — swap in the official vector if available.
- **Icons:** Lucide substituted for an unspecified Fluxia icon set.
