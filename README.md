# Stitch Studio

A free, install-free, account-free chart designer for knitters and
crocheters. Square grids, hex grids, granny-square stamping — opens in
any modern browser by double-clicking the HTML file.

## Try it

Open `stitch-studio.html` (or the equivalent `index.html`) in any
browser. No server, no build step required just to run it. GitHub Pages
serves `index.html` directly — both files are produced by `build.py` and
are byte-for-byte identical.

## Develop

Source lives under `src/`:

```
src/
├── index.html              # Shell with INJECT markers
├── css/styles.css          # All CSS
└── js/
    ├── 00-state.js         # S object, PALETTE, CS, constants
    ├── 10-hex.js           # Hex math (offset coords, hexAtPoint)
    ├── 20-render.js        # Canvas drawing engine
    ├── 30-paint.js         # paintAt, floodFill, undo, swapColor
    ├── 40-events.js        # Mouse, touch, keyboard, wheel
    ├── 50-ui.js            # DOM renders, toggles, setters
    ├── 60-palette.js       # Custom color picker (debounced)
    ├── 70-actions.js       # Clear / undo / mirror
    ├── 75-presets.js       # Quick-load patterns
    ├── 80-granny.js        # Granny square builder + stamper
    ├── 90-io.js            # Save / load / export / autosave
    └── 99-main.js          # init() + DOMContentLoaded boot
```

To rebuild the bundled `stitch-studio.html` and `index.html`:

```bash
python3 build.py
```

To run the lightweight bundle smoke test:

```bash
node test/smoke.js
```

The smoke test rebuilds the app, parses the bundled script, and checks
for the DOM ids and global functions that the single-file app expects.

The numeric prefix on each JS module is the bundling order — earlier
files declare globals that later files use. No imports/exports; the
bundler just concatenates.

### UI shell conventions

- Put visual rules in `src/css/styles.css`; keep `src/index.html` free of
  inline style attributes except semantic state such as `hidden`.
- Static controls use `data-action`, `data-value`, `data-target`, and
  `data-modal` instead of inline handlers. `bindUiActions()` in
  `src/js/50-ui.js` routes those actions to app functions.
- For form controls, use `data-input-action` or `data-change-action` so
  input/change behavior follows the same delegated pattern.
- Panel hierarchy uses tier classes such as `ps-primary`, `ps-core`,
  `ps-support`, `ps-quiet`, `ps-summary`, and `ps-utility`.
- Color literals should live in CSS theme tokens or the JS color token
  tables in `src/js/00-state.js`; feature code should reference named
  tokens such as `PRESET_COLORS` or `STITCH_COLORS`.

## Features

- Square and hex grids with logical-grid limits up to 9999 × 9999.
- Crochet (chain, slip, sc, hdc, dc, treble, cluster, bobble) and knit
  (knit, purl, k2tog, ssk, yarn over, M1, slip, cable) stitch sets.
- US/UK crochet terminology toggle for stitch lists, indicators, legends,
  saves, and project exports.
- "No stitch" placeholder for lace charts.
- Gauge ratio: enter stitches × rows per 4 inches and cells render
  with that aspect ratio so the chart visually matches real fabric.
- Granny square builder — eight square + hex variants, stamps
  centred on the visible canvas.
- Pan tool (one-finger on touch; spacebar on desktop) plus pinch zoom.
- Keyboard canvas editing: focus the chart, move the cursor with arrow
  keys, press Enter/Space to apply the active tool, or Delete to clear.
- Wrong-side-row shading and active-row highlight (follow mode).
- Top-toolbar shortcuts for undo/redo, named saves, and PDF/PNG/text export.
- Built-in searchable guide with jump links to the relevant controls.
- Click a colour chip in the legend to swap it globally for the
  active colour.
- Protect-filled cells: a single tap won't overwrite an
  already-coloured cell; double-click or double-tap does.
- Auto-saves continuously to localStorage; auto-restores on next open.
- Named saves library, portable JSON project import/export, PNG export, and PDF export with legend.

## Background

`docs/community-research.md` summarises what makers complain about in
existing tools (Stitch Fiddle, Stitchworks, Chart Minder, etc.) and how
this project responds to those gaps.

`docs/actionables.md` turns that research into a prioritized backlog with
acceptance criteria and likely implementation files.

`docs/qa-checklist.md` is the smoke-test checklist for drawing, mobile,
autosave, export, and the shipped Tier 1 complaint fixes.

`docs/qa-results.md` records the latest P0 smoke pass and fixes found
while running it.

## Push the local copy to GitHub

`push-to-github.command` (macOS) clones this repo to your Desktop,
mirrors the workspace folder into it, and pushes.
