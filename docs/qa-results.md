# Stitch Studio QA Results

## P0 Tier 1 Smoke Pass

Scope covered:

- App load from `stitch-studio.html`.
- Mobile-width responsive panel behavior.
- Square-grid painting.
- Hex-grid switching and painting.
- Knit-mode switching.
- Gauge input and redraw path.
- No-stitch selection and drawing.
- Wrong-side/follow/protect/display toggles.
- Autosave restore for chart data and display settings.

Result: Passed after fixes.

Fixes made during the pass:

- Narrow viewports now auto-collapse both side panels on entry and reopen them
  when returning to desktop width.
- Autosave snapshots now include pattern name, active color/stitch, display
  toggles, protect-filled state, wrong-side shading, and active follow row.
- Display, protect, follow, stitch/color, zoom, cell-size, and orientation
  changes now schedule autosave.

Validation:

- `python3 build.py`
- Browser load: no console errors.
- Reload after autosave: restored settings checked through DOM state.

