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
| [ ] | Pattern text export | Text export includes color changes and lets no-stitch cells be marked or skipped. |
| [ ] | Guide drawer | Guide opens beside the workspace, search works, jump links highlight controls, and Escape closes it. |
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
| [ ] | Header controls | Mode, grid type, Guide, and New wrap visibly with no hidden horizontal scroll. |
| [ ] | Quick actions | Library and Export groups fit without clipped button text. |
| [ ] | Touch drawing | Tapping paints the intended cell without obvious offset. |
| [ ] | One-finger pan | Pan tool allows one-finger canvas movement. |
| [ ] | Pinch zoom | Pinch zoom changes scale without leaving the app stuck painting. |
| [ ] | Modals and menus | Save/export/library controls remain reachable without horizontal scrolling. |
| [ ] | Guide drawer | Guide opens without covering the entire workflow and can be closed with Escape. |

## Accessibility Spot Checks

| Result | Check | Expected behavior |
|---|---|---|
| [ ] | Forced colors | In a forced-colors or high-contrast mode, controls, focus rings, and panels remain visible. |
| [ ] | Keyboard help | Pressing ? opens the guide; Escape returns focus to the previous control. |
| [ ] | Text wrapping | Button labels and panel text do not overlap or clip at 390 px. |

## Regression Notes

Record browser, viewport, and any failed checks here before shipping:

- Browser:
- Viewport:
- Failures:
- Follow-up tickets:
