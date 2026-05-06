# Stitch Studio Actionable Backlog

This turns the community-research notes into implementation tickets. Use it as
the working queue after `docs/community-research.md`: each item has a user pain,
scope, acceptance criteria, and likely code areas.

## Status Legend

- `Done`: implemented in the current workspace; needs regression coverage only.
- `Ready`: clear enough to build next.
- `Needs design`: behavior or UI model should be decided before coding.
- `Later`: valuable, but larger or less urgent.

## Recommended Build Order

1. Verify and harden the already-shipped Tier 1 fixes.
2. Add export/share features designers expect in real workflows.
3. Add chart-notation features that competitors handle poorly.
4. Defer backend/cloud features until the no-account promise changes.

## P0 - Verify Shipped Complaint Fixes

These are marked as shipped in the research file. Treat them as QA tasks before
adding bigger features.

### ACT-001 - Tier 1 Smoke Test Checklist

- Status: Done
- Pain addressed: new fixes are only useful if they hold together across modes,
  grid types, and browser reloads.
- Scope:
  - Test square and hex drawing after switching modes.
  - Test gauge aspect ratio on square charts.
  - Test pan tool, spacebar pan, pinch zoom, and normal drawing.
  - Test autosave restore after browser reload.
  - Test legend color swap with multiple colors.
  - Test no-stitch rendering and legend output.
  - Test wrong-side row shading and follow-mode row highlight.
  - Test narrow-screen panel collapse.
- Acceptance criteria:
  - No console errors during the checklist.
  - Autosave restores mode, grid, cells, gauge, and display toggles.
  - Touch/pan behavior does not accidentally paint cells.
  - All tested settings survive save/load or are intentionally session-only.
- Likely files:
  - `src/js/40-events.js`
  - `src/js/50-ui.js`
  - `src/js/90-io.js`
  - `src/css/styles.css`

### ACT-002 - Add Manual QA Script

- Status: Done
- Pain addressed: future changes can quietly break mobile and charting fixes.
- Scope:
  - Create a concise `docs/qa-checklist.md`.
  - Include desktop, mobile-width, autosave, export, and stitch-mode checks.
  - Record expected behavior for each high-risk workflow.
- Acceptance criteria:
  - A new contributor can run the checklist in 10 minutes.
  - Each item has a clear pass/fail result.
- Likely files:
  - `docs/qa-checklist.md`

## P1 - Export And Pattern Workflow

### ACT-010 - PDF Export With Legend

- Status: Done
- Pain addressed: makers complain that exported charts and legends are low
  quality, incomplete, or locked behind subscriptions.
- Scope:
  - Add an export action for PDF.
  - Include chart image, title, grid metadata, gauge, legend, and color list.
  - Preserve high resolution for printing.
- Acceptance criteria:
  - PDF opens offline and prints legibly on letter-size paper.
  - Legend includes only used stitches and used colors.
  - Export works for both square and hex charts.
  - Large charts are either paginated or clearly scaled with no clipped content.
- Likely files:
  - `src/index.html`
  - `src/js/90-io.js`
  - `src/js/50-ui.js`
  - `src/css/styles.css`

### ACT-011 - Plain Data Export And Import

- Status: Done
- Pain addressed: users dislike pattern lock-in and want portable files.
- Scope:
  - Export a `.json` project file.
  - Import that file back into the app.
  - Include app version and graceful handling for older data.
- Acceptance criteria:
  - Exported file restores chart cells, palette, mode, grid, gauge, and settings.
  - Import rejects invalid files with a clear message.
  - Import does not destroy current work until a valid file is parsed.
- Likely files:
  - `src/js/90-io.js`
  - `src/js/00-state.js`
  - `src/index.html`

### ACT-012 - Pattern Text Export

- Status: Done
- Pain addressed: designers often need written instructions alongside a chart.
- Scope:
  - Generate a simple row-by-row text summary from square charts.
  - Include stitch abbreviations and color changes.
  - Let users decide whether no-stitch placeholders are marked or skipped.
  - Start with a structured export rather than full natural-language pattern writing.
- Acceptance criteria:
  - Each row exports in chart order with counts grouped by consecutive stitch and
    color.
  - No-stitch cells are skipped or explicitly marked based on user choice.
  - Output can be copied as plain text.
  - Output can be downloaded as a `.txt` file.
- Likely files:
  - `src/js/90-io.js`
  - `src/js/50-ui.js`

## P1 - Chart Notation Gaps

### ACT-020 - Repeat Brackets

- Status: Ready
- Pain addressed: print patterns rely on row/column repeats, but many tools do
  not support them.
- Scope:
  - Let users mark a rectangular repeat region.
  - Render bracket lines and a repeat count label.
  - Include repeat metadata in save/load/export.
- Acceptance criteria:
  - User can add, edit, and delete at least one repeat region.
  - Repeat bracket renders above cells without hiding symbols.
  - Repeat data survives autosave and named saves.
  - PNG/PDF export includes repeat brackets.
- Likely files:
  - `src/js/00-state.js`
  - `src/js/20-render.js`
  - `src/js/40-events.js`
  - `src/js/50-ui.js`
  - `src/js/90-io.js`

### ACT-021 - Multi-Cell Cable Stitches

- Status: Ready
- Pain addressed: cable symbols span multiple stitches; single-cell symbols are
  inaccurate for real knitting charts.
- Scope:
  - Add cable stitch definitions with width and direction.
  - Let a cable consume multiple adjacent cells.
  - Render cable symbol across the consumed cells.
- Acceptance criteria:
  - User can place at least 2/2 and 4/4 left/right cable symbols.
  - Occupied cells cannot be edited independently without clearing the cable.
  - Cable data survives autosave, named saves, and export.
  - Invalid placements at row edges are blocked with a clear toast.
- Likely files:
  - `src/js/00-state.js`
  - `src/js/20-render.js`
  - `src/js/30-paint.js`
  - `src/js/50-ui.js`
  - `src/js/90-io.js`

### ACT-022 - Custom Symbol Editor

- Status: Needs design
- Pain addressed: designers want to define stitch symbols and labels that match
  their publication style.
- Scope:
  - Let users add a custom stitch with name, abbreviation, glyph, and color.
  - Store custom stitches per project.
  - Show custom stitches in the stitch list and legend.
- Acceptance criteria:
  - Custom stitches can be created, edited, and deleted.
  - Existing cells using a deleted custom stitch are handled safely.
  - Custom stitch metadata survives export/import.
- Likely files:
  - `src/js/00-state.js`
  - `src/js/50-ui.js`
  - `src/js/90-io.js`

### ACT-023 - Variable Row Widths

- Status: Later
- Pain addressed: increases and decreases can change the stitch count by row;
  rectangular grids do not model that well.
- Scope:
  - Explore a row-shape model before coding.
  - Support inserted/removed logical cells on specific rows.
  - Keep export and rendering predictable.
- Acceptance criteria:
  - A chart can represent rows with different stitch counts.
  - Labels and grid lines remain readable.
  - Existing rectangular projects still load unchanged.
- Likely files:
  - `src/js/00-state.js`
  - `src/js/20-render.js`
  - `src/js/30-paint.js`
  - `src/js/40-events.js`
  - `src/js/90-io.js`

## P2 - Mobile And Tablet Polish

### ACT-030 - Touch Interaction Guardrails

- Status: Done
- Pain addressed: users on phones/tablets accidentally paint when they meant to
  inspect, pan, or zoom.
- Scope:
  - Tighten drag threshold before painting starts.
  - Add visual feedback when touch begins as pan vs paint.
  - Re-test one-finger pan and pinch zoom.
- Acceptance criteria:
  - Slow tap selects/paints one intended cell.
  - Dragging more than the threshold pans when pan mode is active.
  - Pinch zoom does not leave the app stuck in painting state.
- Likely files:
  - `src/js/40-events.js`
  - `src/css/styles.css`

### ACT-031 - Stylus-Friendly Drawing Mode

- Status: Later
- Pain addressed: Apple Pencil users expect finger touch to pan and stylus input
  to draw.
- Scope:
  - Detect pointer type where supported.
  - Add a setting for stylus draws, finger pans.
  - Keep mouse behavior unchanged.
- Acceptance criteria:
  - Stylus/pointer drawing works on browsers that expose pointer type.
  - Finger input pans when stylus mode is enabled.
  - Unsupported browsers fall back cleanly.
- Likely files:
  - `src/js/40-events.js`
  - `src/js/50-ui.js`

## P2 - Localization And Terminology

### ACT-040 - US/UK Crochet Terms Toggle

- Status: Done
- Pain addressed: crochet names differ by region, and designers need charts to
  match their audience.
- Scope:
  - Add a terminology toggle for crochet mode.
  - Change stitch display names and abbreviations only; preserve internal ids.
- Acceptance criteria:
  - Switching terminology updates stitch list, legend, and exports.
  - Existing saved charts continue to load correctly.
  - Knitting mode is unaffected.
- Likely files:
  - `src/js/00-state.js`
  - `src/js/50-ui.js`
  - `src/js/90-io.js`

## P3 - Product Direction

### ACT-050 - Shareable Cloud Projects

- Status: Later
- Pain addressed: designers want sync and sharing, but this changes the product
  promise.
- Scope:
  - Decide whether Stitch Studio remains fully offline/no-account.
  - If yes, prefer file export/import and local saves.
  - If no, design authentication, storage, and permissions.
- Acceptance criteria:
  - Product decision is documented before any backend work begins.
  - No local/offline workflow regresses.

### ACT-051 - PDF Chart Import

- Status: Later
- Pain addressed: users want to start from existing charts, but robust import is
  an OCR/computer-vision problem.
- Scope:
  - Treat as research, not a quick feature.
  - Start with image-underlay tracing if import proves too large.
- Acceptance criteria:
  - A spike documents feasibility, accuracy, and user correction workflow.
  - The first shipped version does not imply reliable automatic OCR unless it is
    genuinely reliable.

## Done From Current Research Pass

- Gauge/aspect-ratio cells.
- One-finger pan tool and spacebar pan.
- Autosave to localStorage.
- Legend color swap.
- No-stitch placeholder.
- Wrong-side row shading.
- Active row highlight/follow mode.
- Responsive panel collapse.
