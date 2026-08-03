---
name: Fluxia Health — Marketing Site
description: Clinical-trust marketing site for a patient-to-clinician digestive health monitoring bridge.
colors:
  primary: "#3C7DB8"
  primary-hover: "#316499"
  primary-active: "#2A547D"
  primary-soft: "#EEF4FB"
  secondary: "#4DA078"
  secondary-hover: "#3E8463"
  secondary-soft: "#EDF7F1"
  accent: "#4DA0A2"
  accent-soft: "#ECF6F6"
  highlight-lime: "#CFD33C"
  highlight-lime-deep: "#B4B833"
  atmospheric-violet: "#8480C9"
  success: "#3F9E6E"
  warning: "#E09F3C"
  error: "#D26464"
  ink-900: "#222A2E"
  ink-800: "#2D3539"
  ink-600: "#586269"
  ink-400: "#95A0A5"
  ink-200: "#DCE2DF"
  ink-150: "#E6EAE6"
  ink-50: "#F4F7F3"
  surface: "#FFFFFF"
  surface-sunken: "#F4F7F3"
typography:
  display:
    fontFamily: "Lexend, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(2rem, 4.2vw, 3.25rem)"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Lexend, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(1.625rem, 3vw, 2.125rem)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body-lg:
    fontFamily: "Lexend, system-ui, -apple-system, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.65
  body:
    fontFamily: "Lexend, system-ui, -apple-system, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Lexend, system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.28
rounded:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "26px"
  2xl: "32px"
  3xl: "40px"
  pill: "999px"
spacing:
  sm: "16px"
  md: "24px"
  lg: "48px"
  xl: "64px"
  section: "96px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.pill}"
    padding: "0 22px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-ghost-inverse:
    backgroundColor: "transparent"
    textColor: "#FFFFFF"
    rounded: "{rounded.pill}"
    padding: "0 22px"
    height: "48px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "24px"
  price-card-featured:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "44px 32px 36px"
---

# Design System: Fluxia Health — Marketing Site

## Overview

**Creative North Star: "The Clinical Instrument Panel"**

Fluxia's marketing site reads like the trust surface of a precision instrument built for clinicians, not a consumer wellness app skinned in medical colors. The system pairs a confident, saturated brand gradient (the logo's yellow→green→teal→blue "flow") with a calm, editorial-white working surface — the gradient marks moments of arrival and conviction (hero, closing CTA, the "how it works" and "semáforo" narrative sections), while everything the clinician needs to evaluate calmly (benefits, security, pricing, FAQ) sits on flat white or barely-tinted sunken ground. Pill-shaped buttons, soft glass navigation, and a single warm lime accent for iconography keep the tone approachable rather than sterile, appropriate for an audience that includes elderly patients' caregivers as well as physicians.

The gradient itself is the signature asset and is treated as scarce: full-bleed section backgrounds and the primary CTA's colored shadow are its only expressions. Everywhere else, color does semantic work — blue for primary action and trust, green/teal as the calm "everything is fine" register, lime only as a small icon accent, and the red/amber/green semáforo triad reserved exclusively for patient-status meaning, never decoration.

**Key Characteristics:**
- One signature multi-stop brand gradient, used only for section backgrounds and the primary button's shadow — never as a text color or a small UI accent.
- Generous corner radii and pill buttons throughout; no sharp corners anywhere in the system.
- A single warm lime accent color for icons/emphasis, distinct from the cool blue/green/teal brand family.
- Soft, cool-tinted shadows only (no black shadows) — depth reads as atmosphere, not weight.
- The semáforo traffic-light triad (green/amber/red) is reserved for patient-monitoring status and must never be reused as generic UI color.

## Colors

A cool, clinical-but-warm palette anchored on the brand gradient, with a single warm accent (lime) as counterpoint.

### Primary
- **Trust Blue** (`#3C7DB8` / `--fx-blue-500`): primary action color — main CTA buttons, links, focus states, icon accents in the security section. Hover `#316499`, active/pressed `#2A547D`, soft tint background `#EEF4FB`.

### Secondary
- **Wellbeing Green** (`#4DA078` / `--fx-green-500`): secondary brand color, used in the logo gradient and as the "on track" register (semáforo green, calm section washes). Soft tint `#EDF7F1`.

### Tertiary
- **Fluid Teal** (`#4DA0A2` / `--fx-teal-500`): accent used in the gradient's midpoint and for a data/fluid connotation; soft tint `#ECF6F6`.

### Neutral
- **Ink 900/800** (`#222A2E` / `#2D3539`): primary heading and body text on light surfaces.
- **Ink 600** (`#586269`): secondary/supporting body text.
- **Ink 400** (`#95A0A5`): tertiary text — captions, pricing period labels, footnotes.
- **Ink 200/150** (`#DCE2DF` / `#E6EAE6`): borders and dividers.
- **Ink 50** (`#F4F7F3`): sunken section background and page base.
- **White** (`#FFFFFF`): elevated surfaces, cards, price cards.

### Named Rules

**The Gradient Scarcity Rule.** The full brand gradient (`--gradient-brand`) appears only as a full-bleed section background (hero, "how it works," the semáforo split section, final CTA) or as the primary button's colored ambient shadow. It never appears as a text fill, an icon color, or a small decorative accent — its rarity is what makes each appearance read as a brand moment rather than wallpaper.

**The Semáforo Reservation Rule.** Success green (`#3F9E6E`), warning amber (`#E09F3C`), and error red (`#D26464`) are reserved exclusively for patient-monitoring status (the legend dots explaining green/amber/red days-since-last-entry). Don't repurpose this triad for generic success/error UI states elsewhere on the marketing site — it would dilute the one place status color carries real product meaning.

**The One Accent Rule.** Lime (`#CFD33C` / `--fx-lime-400`) is the only warm color in the system and appears exclusively as a small icon/emphasis accent (benefit-card icons, "split-tag" callout text) — never as a background, button, or large fill.

## Typography

**Display Font:** Lexend (with system-ui, -apple-system fallback)
**Body Font:** Lexend (same family; role separation comes from size/weight, not a second typeface)

**Character:** Lexend's rounded, humanist geometry keeps a clinical, data-forward site feeling legible and calm rather than cold or corporate — it was designed for reading proficiency, which reads as intentional for a product whose secondary audience includes elderly patients.

### Hierarchy
- **Display** (700 weight, `clamp(32px, 4.2vw, 52px)`, line-height 1.12, letter-spacing -0.02em): hero `<h1>` only.
- **Headline** (600 weight, `clamp(26px, 3vw, 34px)`, line-height ~1.2, letter-spacing -0.01em): all section `<h2>`s (eyebrow-h2, split headings, pricing/FAQ/specialties titles).
- **Body Large** (400 weight, 18px, line-height 1.65): hero lede and other lead paragraphs under a headline.
- **Body** (400 weight, 16px, line-height 1.5 default / 1.65 in long-form copy): standard paragraph copy, benefit card descriptions, FAQ answers.
- **Label** (600 weight, 14px, line-height 1.28): nav links, badge text, footer column headers (footer headers add uppercase + 0.04em tracking).
- **Caption** (400–600 weight, 13–13.5px): fine print under CTAs ("30 días gratis · Sin tarjeta"), pricing period, footer legal line.

### Named Rules

**The Single-Family Rule.** Don't introduce a second typeface for "display" moments. Hierarchy comes entirely from size, weight, and color (white-on-gradient vs. ink-on-white) within one Lexend family — introducing a serif or a second sans for headlines would break the instrument-panel restraint.

## Layout

Centered container at `max-width: 1240px` (`.wrap` uses 1240px for header/hero grids; narrower content blocks — FAQ 750px, security/pricing ~1180-1200px, intro/video "center" 700px — scale down deliberately per section for reading comfort). Horizontal page padding is 24px, dropping to 20px under 640px.

Section rhythm is generous and uniform: `padding: 96px 24px` per section, compressing to `64px 20px` under the 640px breakpoint (hero compresses to `56px 20px 64px`). Alternating full-width section backgrounds (`section-brand` gradient / `section-sunken` off-white / `section-surface` pure white) are the primary structural device — there is no visible grid of cards-in-cards; each section is a single flat plane.

Two-column split layouts (hero, "patient app" and "semáforo" sections, security section) use `display: flex; flex-wrap: wrap; gap: 64px` with each side `flex: 1 1 ~380-460px`, collapsing to a single stacked column once either side drops below its min-width — no explicit breakpoint is declared for these, they reflow naturally via flex-wrap. The nav collapses to a hamburger menu at 900px. Card grids (benefits, specialties) use CSS Grid `repeat(auto-fit, minmax(...))` rather than fixed column counts.

## Elevation & Depth

Flat-by-default with soft, cool-tinted ambient shadows used only to lift specific elevated elements off the page — never a systematic card-shadow-on-everything approach. Shadows use a blue-gray tint (`rgba(40-60, 64-125, 74-184, .05-.28)`), never neutral black, so elevation reads as "floating in the same atmosphere" rather than a hard drop shadow.

### Shadow Vocabulary
- **xs** (`0 1px 2px rgba(40,64,74,0.05)`): barely-there separation; not heavily used standalone.
- **sm** (`0 2px 8px rgba(40,70,80,0.06)`): default card elevation (benefit cards).
- **md** (`0 6px 20px rgba(40,70,82,0.08)`): mid-weight lift, available for hover states.
- **lg** (`0 16px 40px rgba(38,70,90,0.10)`): the video-play button circle, video thumbnail frame.
- **xl** (`0 24px 60px rgba(34,66,100,0.12)`): hero/split image frames — the heaviest "floating photograph" treatment in the system.
- **primary** (`0 10px 28px rgba(60,125,184,0.28)`, colored): reserved for the primary CTA button and the featured pricing card — the one shadow that carries brand color instead of neutral tint, marking "this is the thing to click."

### Named Rules

**The Colored-Shadow-Means-Click Rule.** `--shadow-primary` (the blue-tinted shadow) only appears under the primary button and the featured pricing tier. If a future element needs visual weight without implying "primary action," use a neutral shadow (`sm`/`md`/`lg`/`xl`) instead.

## Shapes

Radius scale runs from 8px to a full pill (999px), and the pill/large-radius end dominates: buttons and badges are always full pill, photographic frames use the largest radii (26–40px), and cards/price-cards sit at 20–26px. No element in the system uses a sharp (0px) corner except the modal video iframe's outer container, which itself still carries a 16px radius. Borders where present are hairline (1–1.5px) and low-contrast (`--border-soft` / `--border`), used to separate content on white (price cards, dividers) rather than to add visual weight.

## Components

### Buttons
- **Shape:** full pill (`border-radius: 999px`), 1.5px border (transparent by default, visible only on ghost variants).
- **Primary:** background Trust Blue, white text, colored ambient shadow (`--shadow-primary`), min-height 48px (56px for `.btn-lg`), horizontal padding 22px (28px large), 600 weight text, -0.01em tracking.
- **Hover / Active:** hover darkens to `--color-primary-hover`; active/pressed scales to 0.98 and darkens further to `--color-primary-active`. Transition covers background/color/border/shadow/transform at 0.14s.
- **Ghost / Ghost-Inverse:** `.btn-ghost` is transparent with a soft border and primary-colored text, no shadow — used for secondary actions on white. `.btn-ghost-inverse` is transparent with a white border/text for use on the brand gradient (hero's "Ver cómo funciona"), inverting to solid white background + primary text on hover.
- **On-White:** `.btn-on-white` is a solid white pill with primary-colored text, used for the primary CTA when it sits on top of the brand gradient (final CTA section) so it still reads as the "solid, click me" affordance against a colored background.

### Badge
- Small pill (`--radius-pill`), translucent white fill (`rgba(255,255,255,.22)`) on the brand gradient, white text, 600 weight, 13px — used once per page as an eyebrow label ("Para profesionales sanitarios").

### Cards
- **Corner Style:** 26px radius (`--radius-xl`).
- **Background:** solid white on any section background.
- **Shadow Strategy:** `sm` ambient shadow only; no border.
- **Internal Padding:** 24px (`--card-pad-lg`).
- **Icon treatment:** 36px lime-colored icon above an 18px heading and 15px secondary-colored body text.

### Price Cards
- **Standard tier:** white background, 26px radius, 1px soft border, 36px/30px padding, flex column so feature lists align across tiers of unequal height.
- **Featured tier:** same shape but a 2px solid Trust Blue border, `--shadow-primary` colored shadow, and a floating pill badge (`.price-pill`) centered on the top border — the only card in the system that combines a strong border with a colored shadow, marking it as the recommended choice.

### Navigation
- Sticky, glass-blurred bar (`backdrop-filter: blur(18px)` over `--color-surface-glass-strong`), no shadow at rest; gains a soft neutral shadow (`0 2px 16px rgba(20,32,28,.08)`) only once the page scrolls past 8px, via a JS-toggled `.is-scrolled` class.
- Links are 15.5px, 700 weight, ink-800, brightening to primary blue on hover; underline is never used for nav links.
- Below 900px the link row and header CTA hide entirely in favor of a hamburger toggle revealing a stacked mobile panel with a full-width primary button at the bottom.

### FAQ Accordion
- Native `<details>/<summary>` pattern, no custom JS. Each item is a hairline-bordered row (`border-bottom: 1px solid var(--border-soft)`); the summary row shows question text plus a plus-icon that rotates 45° (into an "×") when the item is open. No background/shadow change on open — the affordance is entirely the icon rotation plus the answer text appearing.

### Specialty Tiles
- Small pill-cornered tiles (`--radius-lg`) on translucent white (`rgba(255,255,255,.14)`) over the brand gradient, each holding a centered white icon and a bold 13.5px label — a lighter-weight sibling of the card component, used only against the gradient background.

## Do's and Don'ts

### Do:
- **Do** keep the brand gradient full-bleed and section-scoped; treat it as a background material, not a foreground color.
- **Do** use pill radius (999px) for every button and badge without exception.
- **Do** pair any element sitting on the brand gradient with white or near-white text/icons at reduced opacity for secondary copy (`rgba(255,255,255,.85)` is the established secondary-on-gradient tone).
- **Do** reserve the colored `--shadow-primary` for the one primary action per section/page state.
- **Do** keep the semáforo green/amber/red triad legible and undiluted wherever patient status is shown.

### Don't:
- **Don't** introduce a second typeface; Lexend carries the entire hierarchy.
- **Don't** use sharp (0px) corners anywhere — even modal/utility chrome uses at least a 16px radius in this system.
- **Don't** use neutral black shadows; all elevation is cool-tinted blue/teal-gray.
- **Don't** repurpose lime as a background fill or button color — it is an icon/emphasis accent only.
- **Don't** imply diagnostic capability in imagery or copy near components (per `PRODUCT.md`) — visuals should read as monitoring/logging, not clinical decision-making.
