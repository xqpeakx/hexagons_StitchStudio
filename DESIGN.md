---
name: Stitch Studio
description: Free, install-free chart designer for knit and crochet patterns.
colors:
  canvas-bg: "#faf8f5"
  surface: "#fffdf9"
  surface-muted: "#f3f0eb"
  surface-pressed: "#ebe6df"
  border: "#e2ddd7"
  border-strong: "#cec8c0"
  text: "#2a2520"
  text-muted: "#5f554d"
  text-soft: "#73685f"
  primary: "#7c4f31"
  primary-hover: "#6e452b"
  primary-soft: "#f4e8db"
  teal: "#21695e"
  teal-soft: "#e2f2ee"
  rose: "#943c50"
  rose-soft: "#faedf0"
  gold: "#755512"
  gold-soft: "#fbf0d3"
  purple: "#5f438d"
  purple-soft: "#f0ebfa"
typography:
  display:
    fontFamily: "\"Iowan Old Style\", \"Palatino Linotype\", Palatino, Georgia, serif"
    fontSize: "20px"
    fontWeight: 500
    lineHeight: 1.2
  body:
    fontFamily: "\"Avenir Next\", \"Segoe UI\", \"Helvetica Neue\", Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.42
  label:
    fontFamily: "\"Avenir Next\", \"Segoe UI\", \"Helvetica Neue\", Arial, sans-serif"
    fontSize: "10px"
    fontWeight: 800
    letterSpacing: "1px"
rounded:
  sm: "8px"
  md: "12px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    padding: "7px 16px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
    padding: "7px 9px"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "11px 10px"
---

# Design System: Stitch Studio

## 1. Overview

**Creative North Star: "The Studio Table"**

Stitch Studio should feel like a warm, orderly work surface for real chart-making. The interface is dense because the job is dense, but each control should earn its space through clear grouping, predictable shape, and craft-specific language.

The system rejects marketing-page drama, generic SaaS gloss, dark neon maker tools, and novelty controls. Its best state is calm, useful, and tactile: a maker can glance, choose, draw, save, and export without wondering where their work went.

**Key Characteristics:**
- Warm neutral surfaces with restrained brown primary actions.
- Compact product typography with a craft-literate display accent only for the brand and pattern name.
- Clear grouped controls, visible focus, and no hidden primary mobile actions.
- Export and save language that emphasizes ownership and portability.

## 2. Colors

The palette is warm, textile-adjacent, and restrained. Accent colors label meaning and modes, not decoration.

### Primary
- **Walnut Primary** (#7c4f31): Primary actions, active toggles, current selections, focus rings, and brand emphasis.
- **Parchment Primary Soft** (#f4e8db): Low-intensity selected groups and export emphasis.

### Secondary
- **Maker Teal** (#21695e): Square grid and knit-friendly status color.
- **Pattern Rose** (#943c50): Destructive or caution actions when softened through #faedf0.
- **Notation Purple** (#5f438d): Hex-grid and wrong-side-row cues.
- **Print Gold** (#755512): Guide and summary accents.

### Neutral
- **Canvas Warmth** (#faf8f5): App background and canvas-adjacent surface.
- **Paper Surface** (#fffdf9): Panels, toolbars, dialogs, and raised controls.
- **Threaded Border** (#e2ddd7): Dividers and control strokes.
- **Ink Brown** (#2a2520): Primary text.
- **Muted Ink** (#5f554d): Secondary text.

### Named Rules

**The Useful Accent Rule.** Accent color marks state, mode, or action priority. Do not add color just to decorate a panel.

## 3. Typography

**Display Font:** Iowan Old Style with Palatino and Georgia fallbacks  
**Body Font:** Avenir Next with Segoe UI, Helvetica Neue, Arial, and sans-serif fallbacks  
**Label/Mono Font:** SF Mono, Menlo, Consolas for code-like labels where needed

**Character:** Product UI is compact and practical. The serif display face is a small craft signal for the logo and pattern name, not a general label font.

### Hierarchy

- **Display** (500, 20px, 1.2): Logo and pattern title only.
- **Title** (700 to 800, 12px to 14px): Buttons, panel controls, and important state labels.
- **Body** (400 to 500, 10.5px to 13px, 1.42): Hints, row labels, modal copy, and control context.
- **Label** (800, 9px to 10px, 1px tracking, uppercase): Panel labels and compact section labels.

### Named Rules

**The Serif Ration Rule.** Do not use the display serif for buttons, dense labels, status text, or data.

## 4. Elevation

Depth is a hybrid of soft shadows, tonal layers, and borders. Resting panels should feel structured, not floaty. Shadows are allowed for active toolbar controls, overlays, hover states, and canvas affordances that need separation from the grid.

### Shadow Vocabulary

- **Small Surface** (`0 1px 0 color-mix(in srgb,var(--text) 4%,transparent)`): Quiet panel separation.
- **Raised Control** (`0 2px 12px color-mix(in srgb,var(--text) 7%,transparent)`): Selected buttons and compact overlays.
- **Floating Overlay** (`0 8px 32px color-mix(in srgb,var(--text) 13%,transparent)`): Zoom controls and dialogs.

### Named Rules

**The No Glass Rule.** Use solid paper surfaces and borders. Do not introduce decorative blur or transparent glass panels.

## 5. Components

### Buttons

- **Shape:** Pill for primary toolbar actions, 8px radius for compact tool buttons.
- **Primary:** Walnut background, paper text, bold label, compact padding.
- **Hover / Focus:** Slight tonal shift, restrained shadow, visible 2px focus outline.
- **Secondary / Ghost:** Paper or transparent background with clear border and walnut hover.

### Chips

- **Style:** Mode and export groups use pill containers with compact nested buttons.
- **State:** Active chips use solid walnut or paper-on-muted depending on contrast needs.

### Cards / Containers

- **Corner Style:** 8px to 12px. Avoid nested card stacks.
- **Background:** Paper, muted paper, or soft accent wash based on task priority.
- **Shadow Strategy:** Most containers use borders and tonal layers. Use shadows sparingly for active or floating elements.
- **Internal Padding:** 8px to 12px in panels, 12px to 16px in larger overlays.

### Inputs / Fields

- **Style:** Paper background, warm border, 8px radius, compact numeric widths for grid controls.
- **Focus:** Border shifts to walnut and receives the global 2px focus outline.
- **Error / Disabled:** Use rose for destructive or invalid states, but pair color with text.

### Navigation

- **Style:** Top header carries mode, grid type, guide, and new pattern. Side panels carry creation controls and settings.
- **Mobile Treatment:** Primary header controls must wrap or segment into visible rows. Do not rely on hidden horizontal scroll for essential actions.

### Chart Canvas

The canvas is the product center. Keep overlays small, readable, and non-blocking. Any guide, export, or settings interaction should return the user to the chart without losing context.

## 6. Do's and Don'ts

### Do:

- **Do** keep the canvas visually dominant and controls compact.
- **Do** group save, library, project, and print/export actions by user intent.
- **Do** use standard buttons, toggles, tabs, fields, and menus.
- **Do** keep touch targets comfortable across mouse, trackpad, finger, and stylus use.
- **Do** pair color with labels, symbols, outlines, or text for accessibility.

### Don't:

- **Don't** make the product feel like a generic SaaS dashboard or marketing page.
- **Don't** bury primary workflows inside modals when a side sheet, panel, or inline control works.
- **Don't** use dark neon craft aesthetics, glassmorphism, gradient text, or decorative side stripes.
- **Don't** hide primary mobile controls in invisible horizontal overflow.
- **Don't** use the display serif for dense UI labels, buttons, or data.
