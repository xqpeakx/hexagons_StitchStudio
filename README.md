# Stitch Studio

A free, install-free, account-free chart designer for knitters and
crocheters. Square grids, hex grids, granny-square stamping — opens in
any modern browser by double-clicking the HTML file.

## Try it

Open `stitch-studio.html` in any browser. No server, no build step
required just to run it.

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

To rebuild the bundled `stitch-studio.html`:

```bash
python3 build.py
```

The numeric prefix on each JS module is the bundling order — earlier
files declare globals that later files use. No imports/exports; the
bundler just concatenates.

## Features

- Square and hex grids with logical-grid limits up to 9999 × 9999.
- Crochet (chain, slip, sc, hdc, dc, treble, cluster, bobble) and knit
  (knit, purl, k2tog, ssk, yarn over, M1, slip, cable) stitch sets.
- "No stitch" placeholder for lace charts.
- Gauge ratio: enter stitches × rows per 4 inches and cells render
  with that aspect ratio so the chart visually matches real fabric.
- Granny square builder — eight square + hex variants, stamps
  centred on the visible canvas.
- Pan tool (one-finger on touch; spacebar on desktop) plus pinch zoom.
- Wrong-side-row shading and active-row highlight (follow mode).
- Click a colour chip in the legend to swap it globally for the
  active colour.
- Protect-filled cells: a single tap won't overwrite an
  already-coloured cell; double-click or double-tap does.
- Auto-saves continuously to localStorage; auto-restores on next open.
- Named saves library, PNG export.

## Background

`docs/community-research.md` summarises what makers complain about in
existing tools (Stitch Fiddle, Stitchworks, Chart Minder, etc.) and how
this project responds to those gaps.

`docs/actionables.md` turns that research into a prioritized backlog with
acceptance criteria and likely implementation files.

## Push the local copy to GitHub

`push-to-github.command` (macOS) clones this repo to your Desktop,
mirrors the workspace folder into it, and pushes.
