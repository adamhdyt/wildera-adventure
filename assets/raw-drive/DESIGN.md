---
name: Alpine Expedition
colors:
  surface: '#051424'
  surface-dim: '#051424'
  surface-bright: '#2c3a4c'
  surface-container-lowest: '#010f1f'
  surface-container-low: '#0d1c2d'
  surface-container: '#122131'
  surface-container-high: '#1c2b3c'
  surface-container-highest: '#273647'
  on-surface: '#d4e4fa'
  on-surface-variant: '#c4c6ce'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#8e9098'
  outline-variant: '#44474d'
  surface-tint: '#b6c7e7'
  primary: '#b6c7e7'
  on-primary: '#20314a'
  primary-container: '#0b1e36'
  on-primary-container: '#7586a3'
  inverse-primary: '#4e5f7a'
  secondary: '#c6c6c7'
  on-secondary: '#2f3131'
  secondary-container: '#454747'
  on-secondary-container: '#b4b5b5'
  tertiary: '#ffb4a1'
  on-tertiary: '#5d1805'
  tertiary-container: '#3f0900'
  on-tertiary-container: '#cb6a50'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#b6c7e7'
  on-primary-fixed: '#091c34'
  on-primary-fixed-variant: '#364762'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#ffdbd2'
  tertiary-fixed-dim: '#ffb4a1'
  on-tertiary-fixed: '#3c0800'
  on-tertiary-fixed-variant: '#7c2e19'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 64px
    letterSpacing: 0.08em
  display-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: 0.06em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: 0.05em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: 0.04em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: 0.03em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.12em
  label-md:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.14em
  label-sm:
    fontFamily: Space Grotesk
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.18em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 3rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system channels an expedition-grade outdoor aesthetic that bridges raw alpine ruggedness with architectural luxury. Designed for explorers, high-performance adventurers, and experiential travelers, the visual identity draws direct inspiration from the logo's stark, monolithic mountain contours set against deep nocturnal skies.

The style fuses **Modern Tactile Minimalist** with **Technical Precision**:

- **Rugged Elegance:** Pristine whitespace and deep oceanic navy surfaces provide a dramatic stage reminiscent of moonlit glaciers and vast ridge lines.
- **Architectural Utility:** High-contrast structural lines, micro-borders, and tactile controls convey reliability and expeditionary readiness without visual clutter.
- **Emotional Resonance:** Inspires awe, trust, quiet confidence, and an urge to explore untracked terrain.

## Colors

The palette is rooted in the high alpine night sky, glacial crests, and functional expedition safety accents.

- **Primary (`#0B1E36` - Midnight Navy):** The core canvas and foundational surface. Evokes the absolute stillness of sub-zero base camps and high-altitude horizons.
- **Secondary (`#FFFFFF` - Glacial White):** The primary signal, typography, and peak highlight. Crisp, unapologetic contrast representing pristine snowpack.
- **Tertiary (`#E07A5F` - Terracotta Ember):** A functional technical accent derived from thermal gear, topo contour markers, and alpine sunrises. Reserved for key calls-to-action, navigation alerts, and live tracking markers.
- **Neutral (`#94A3B8` - Slate Mist):** Provides secondary text hierarchy, low-profile outlines, technical grid dividers, and muted metadata.
- **Sub-surfaces:** Elevated cards sit on `#112642` and `#173357` with 1px border strokes tinted in `#334E68` to maintain spatial depth in full-bleed dark mode environments.

## Typography

The type system is characterized by wide-tracked, technical geometric titling paired with organic, human-friendly screen legibility.

- **Headlines (`Space Grotesk`):** Echoes the expansive letterspacing and geometric rhythm of the mountain brandmark. Display and headline levels should consistently utilize uppercase transformation and generous tracking (`0.05em` to `0.18em`) to mirror technical altimeter readouts and cartographic typography.
- **Body (`Plus Jakarta Sans`):** Engineered for high scanning speed on outdoor devices under bright glare or low light. Features open counters, sturdy stem weights, and balanced line heights.
- **Labels & Badges (`Space Grotesk`):** Always uppercase, high letter-spacing, providing clear telemetry, coordinates, and status markers.

## Layout & Spacing

Layouts follow a structured **12-column responsive fluid grid** anchored by generous margins that create the airy scale of alpine expeditions.

- **Desktop (1200px+):** 12 columns with `1.5rem` gutters and minimum `3rem` canvas margins. Content is constrained to a max-width container of `1440px`.
- **Tablet (768px - 1199px):** 8 columns with `1.25rem` gutters and `2rem` margins.
- **Mobile (< 768px):** 4 columns with `1rem` gutters and `1.25rem` outer margins.
- **Spacing Rhythm:** Micro-spacers (`space-xs`, `space-sm`) drive internal badge and button geometry. Generous component gaps (`space-lg`, `space-xl`) separate distinct data clusters and editorial route narratives, preventing visual congestion.

## Elevation & Depth

Visual hierarchy does not rely on heavy, fuzzy drop shadows. Instead, it employs **Tonal Stacking** paired with **Precision Glassmorphism and Low-Contrast Technical Borders**:

- **Ground Plane (Level 0):** Pure `#0B1E36` base canvas.
- **Level 1 (Cards & Modules):** Surface `#112642` with a crisp `1px` border of `rgba(255, 255, 255, 0.08)`.
- **Level 2 (Active States, Overlays & Navigation Drawers):** Surface `#173357` with an ambient glow: `0 8px 32px -4px rgba(0, 0, 0, 0.45)`.
- **Glacial Frosted Surfaces (HUDs, Sticky Nav, Floating Action Bars):** `rgba(11, 30, 54, 0.75)` backdrop blur of `16px` combined with a `1px` top edge highlight in `rgba(255, 255, 255, 0.18)` to mimic edge-lit mountain instruments.

## Shapes

The shape system adopts a **Level 1 (Soft / Technical)** standard:

- Primary UI elements (buttons, inputs, telemetry chips) feature a tight, engineered `0.25rem` (`4px`) radius.
- Standard modules and media cards utilize `rounded-lg` (`0.5rem` / `8px`).
- Floating modaled layers or focal expedition cards cap at `rounded-xl` (`0.75rem` / `12px`).

This subtle radius retains the structural integrity and rugged precision of technical equipment, avoiding overly playful circular pills while avoiding sterile, sharp brutalism.

## Components

### Buttons

- **Primary (Summit Action):** Pure white background (`#FFFFFF`), midnight navy text (`#0B1E36`), uppercase `Space Grotesk`, bold tracking. Hover brings a subtle glow and terracotta border accent.
- **Secondary (Technical Outline):** Transparent fill, `1px` solid `rgba(255, 255, 255, 0.3)`, white text. Hover transitions to `rgba(255, 255, 255, 0.08)` background and `100%` solid white border.
- **Tertiary Accent (Warning/Alert/Emergency Action):** Terracotta Ember (`#E07A5F`) fill with crisp white text.

### Cards & Expedition Modules

- Surfaces sit on `#112642` with `1px` border in `rgba(255, 255, 255, 0.08)`.
- Image containers within cards use an aspect ratio of `16:10` or `4:5` featuring micro-gradient overlays (`linear-gradient(180deg, transparent 50%, #112642 100%)`) for seamless copy legibility.

### Badges & Status Chips

- Compact, height `24px` to `28px`, uppercase typography (`label-sm`).
- Neutral badges: `rgba(255, 255, 255, 0.06)` background with a `1px` border of `rgba(148, 163, 184, 0.2)`.
- Active / Status badges: Tinted ember (`rgba(224, 122, 95, 0.15)`) with `#E07A5F` text and an integrated 6px circular coordinate dot.

### Inputs & Search Bars

- Dark recessed background (`#08172B`), `1px` border in `rgba(148, 163, 184, 0.25)`.
- Focus state reveals a `1px` high-contrast white border and a soft ambient glow.
- Monospaced numerical values and uppercase search placeholders.

### Outdoor Navigation & HUD Elements

- Floating bottom tab bar or top sticky bar using 16px backdrop blur, subtle inner border lines, and high-visibility mountain-inspired iconography.
- Altimeter, route difficulty tags, and weather gauges styled as compact modular instrumentation cards.
