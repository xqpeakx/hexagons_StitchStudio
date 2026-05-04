# Stitch Studio QA Checklist

Use this checklist before shipping changes that touch drawing, layout, saving,
export, or mobile interaction. It is designed to take about 10 minutes.

## Setup

- Rebuild the bundle with `python3 build.py`.
- Open `stitch-studio.html` in a modern browser.
- Open the browser console and keep it visible during testing.

## Desktop Smoke Test

| Result | Check | Expected behavior |
|---|---|---|
| [ ] | App loads | Canvas, side panels, toolbar, palette, and legend render with no console errors. |
| [ ] | Crochet square drawing | Draw, erase, fill, and mirror work on the square grid. |
| [ ] | Knit mode | Switching to Knit updates stitches, presets, badge, active stitch, and legend labels. |
| [ ] | Hex grid drawing | Switching to Hex keeps square chart data intact and paints hex cells accurately. |
| [ ] | Gauge controls | Square-grid gauge changes cell height; clearing gauge returns to square cells. |
| [ ] | Pan and zoom | Pan tool drags the canvas; wheel zoom and zoom buttons keep the chart usable. |
| [ ] | Spacebar pan | Holding space temporarily pans without changing the selected tool. |
| [ ] | Protect filled cells | A filled cell is not overwritten by a single click when protection is on. |
| [ ] | No-stitch cell | No-stitch renders distinctly and appears in the legend when used. |
| [ ] | Wrong-side rows | Wrong-side row shading toggles on/off on square grids only. |
| [ ] | Follow mode | Active row highlight appears; arrow keys step the active row. |
| [ ] | Legend color swap | Clicking a used color in the legend swaps all matching cells to the active color. |
| [ ] | PNG export | Exported PNG opens and includes the visible chart. |

## Save And Restore

| Result | Check | Expected behavior |
|---|---|---|
| [ ] | Autosave restore | After drawing and changing settings, reloading restores chart, mode, grid, gauge, and toggles. |
| [ ] | Named save | Save creates an entry in the library and loading it restores the project. |
| [ ] | Clear and undo | Clear removes only the active grid type; undo restores cleared cells. |
| [ ] | Browser refresh safety | Refreshing after a save or autosave does not show an empty unexpected state. |

## Mobile-Width Test

Run this in responsive mode around 390 px wide.

| Result | Check | Expected behavior |
|---|---|---|
| [ ] | Layout fits | Panels collapse or stack without blocking the canvas. |
| [ ] | Touch drawing | Tapping paints the intended cell without obvious offset. |
| [ ] | One-finger pan | Pan tool allows one-finger canvas movement. |
| [ ] | Pinch zoom | Pinch zoom changes scale without leaving the app stuck painting. |
| [ ] | Modals and menus | Save/export/library controls remain reachable without horizontal scrolling. |

## Regression Notes

Record browser, viewport, and any failed checks here before shipping:

- Browser:
- Viewport:
- Failures:
- Follow-up tickets:

