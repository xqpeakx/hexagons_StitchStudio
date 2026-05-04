# Stitch Studio — Community Research & Improvement Plan

A scan of the knit/crochet design-software ecosystem in 2025–2026, what
makers complain about, and where Stitch Studio can actually be the better
tool. Focus areas: **mobile/tablet usability** and **charting features**.

---

## 1. Tools we benchmarked against

| Tool | Stack | Mobile? | Notable gaps users complain about |
|---|---|---|---|
| Stitch Fiddle | Web | Partial (touch pan) | Tiny symbols, fiddly click-to-place workflow, copy/paste lands in random spots, low-res free PDFs, only 2-finger pan |
| Chart Minder | Web | Partial | No multi-cell cable symbols, limited customization |
| Stitchworks / Crochet Charts | Desktop (Win/Mac) | No | Crashes constantly, no auto-save, last build 2015, can't re-order legend, no US/UK toggle |
| Stitchmastery | Desktop | No | Excellent for charts but desktop-only; expensive |
| EnvisioKnit | Desktop | No | Powerful but Windows-centric |
| Intwined | Desktop | No | Company gone dark; no repeat brackets, no right-click menus |
| Patternum | iOS | Yes | Closed ecosystem; pattern lock-in |
| KnitCompanion / My Row Counter | iOS | Yes | Counters only — no chart authoring |
| Crochet Chart (iOS) | iOS | Yes | Solid color-swap-from-legend feature; otherwise basic |
| Knit Foundry | Old desktop | No | Abandonware, won't run on modern OS |

The desktop incumbents are powerful but ageing and crash-prone. The mobile
apps either don't author charts at all or trap your patterns inside the
app. The web tools panic on anything with a multi-cell stitch (cables) or
a non-square gauge ratio. There is real room here.

---

## 2. Recurring complaints, by theme

### A. Mobile / tablet usability

1. **Two-finger pan is the only pan.** Stitch Fiddle requires two fingers
   to scroll, which fights with the natural touch idiom of "drag = move".
   Users on a phone end up hitting random cells.
2. **Tap precision.** Hex/dense grids are miss-prone on small screens;
   most tools don't differentiate between a "tap" and the start of a
   drag, so users accidentally repaint cells they only meant to inspect.
3. **No Apple Pencil affordance.** None of the web tools treat pencil
   input differently from finger touch (no palm rejection, no pressure).
4. **Crashing on tablets.** Stitchworks crashes "constantly" and doesn't
   auto-save; lost-work complaints dominate its reviews.
5. **UI not responsive.** Side panels stay full width on phones, eating
   the canvas. Modals overflow.
6. **Round/non-square shapes don't fit.** One Crochet Charts review:
   "spent four hours getting a simple round pattern into the program."

### B. Charting features

1. **Square cells lie about gauge.** Knit stitches are wider than tall
   (e.g. 5×7 per inch). Tools that draw square cells produce charts
   that look nothing like the finished fabric. Stitch Fiddle and Gauge
   Genie offer aspect-ratio cells; most others don't.
2. **No multi-cell stitches.** Cables span multiple stitches and the
   symbol must straddle the cells it consumes. Chart Minder and Stitch
   Fiddle can't draw a 4/4 cable correctly.
3. **No "no-stitch" placeholder.** Lace charts need shaded "no stitch"
   cells where decreases pull subsequent stitches inward. Without them,
   the chart visual desyncs from the actual row.
4. **No repeat brackets.** Marking "rows 3–8 repeat 4×" or column
   repeats with brackets is standard in print but missing in tools.
5. **Wrong-side row marking.** Charts conventionally shade or flip
   wrong-side rows; few tools support this.
6. **Limited symbol library.** Stitch Fiddle restricts complex stitches
   to paid tier. Designers want to define their own symbols.
7. **Color swap from legend.** Wanting to recolor every cell of color X
   at once. Crochet Chart (iOS) does this; nobody else does well.
8. **Legend export issues.** Can't reorder, rename, or hide unused
   legend entries.
9. **PDF/print quality.** Free tiers downscale to unreadable; paid
   tiers gate it behind a subscription.
10. **Increases/decreases that change row width.** Most tools assume a
    rectangular grid forever; you can't sneak an extra cell into row 3.

### C. Workflow / data

1. **No autosave.** Users lose work to crashes, browser refresh, etc.
2. **Localization.** US vs UK crochet terms (single = double, etc.)
   isn't toggleable in most tools.
3. **Pattern lock-in.** Mobile apps make it hard to export plain text
   or PNG.
4. **No follow-along mode.** Chart authors want a "now editing row 12"
   highlight; chart followers want the same when knitting from one.

---

## 3. Where Stitch Studio already wins

- **Built-in hex grid** — most chart tools are square-only; hex granny
  squares are first-class here.
- **Granny square stamper** — a unique offering. No competitor stamps
  multi-round hex shapes onto a chart.
- **Plain HTML, no install, no account, no paywall.** Just opens.
- **Both knit and crochet stitches in one tool** with mode switching.
- **Recently shipped:**
  - Color picker debounce (only commits final color, not every slider stop).
  - Protect-filled-cells toggle (prevents the "drag accidentally
    repainted half my chart" complaint that plagues Stitch Fiddle).

---

## 4. Prioritized improvements

Ranked by `(impact on real complaints) ÷ (build effort)`.

### Tier 1 — should do now

1. **Gauge / aspect-ratio cells.** Let users set stitch:row gauge so
   square-grid cells become wider-than-tall to match real knitting.
   Hits the #1 charting complaint. ~30 LoC.
2. **One-finger pan tool.** Add a Pan tool to the toolbar so phone
   users don't need two fingers. Plus a `space-bar to pan` for desktop.
   ~40 LoC.
3. **Auto-save to localStorage.** Continuous, every change. Single
   biggest "lost my work" complaint. ~15 LoC.
4. **Color swap from legend.** Click a color chip in the legend to
   replace it everywhere with the active color. Crochet Chart (iOS)
   feature; nobody else has it on the web. ~25 LoC.
5. **No-stitch placeholder cell type.** Reserved gray cell that visually
   marks "no stitch here" for lace. ~20 LoC.
6. **Mark wrong-side rows.** Toggle to shade WS rows in square grids.
   ~20 LoC.
7. **Active row highlight (follow mode).** Highlight a single row as
   "current"; tap row label to move it. Helps when knitting from your
   own chart. ~30 LoC.
8. **Responsive panels on narrow screens.** Auto-collapse side panels
   below ~720 px; floating "open panel" buttons. ~20 LoC of CSS.

### Tier 2 — high value, more work

9.  **Multi-cell cable stitches.** A "cable" cell type that consumes
    N adjacent cells and renders the cross symbol over them. ~100 LoC.
10. **Repeat brackets.** Mark rows or columns with `[ ... ] ×4`.
    ~80 LoC.
11. **Custom symbol editor.** Let designers map their own glyphs to
    stitch IDs. ~60 LoC.
12. **PDF export with legend.** Currently PNG only. ~50 LoC + jsPDF.
13. **US/UK terminology toggle.** Affects crochet stitch names only.
    ~15 LoC.

### Tier 3 — long term

14. **Pencil + palm-rejection.** Distinguish stylus from finger; only
    paint with the stylus. Touch-events Force/Touch APIs.
15. **Pattern import (read existing PDF charts).** Hard problem; OCR.
16. **Cloud sync / sharing.** Requires backend, breaks the "no
    account" promise — defer.
17. **Live collaboration.** Same.

---

## 5. What this session ships

This pass implements the entire **Tier 1** list along with the requested
refactor into `src/`. The features added:

- Gauge / aspect-ratio cells (Display panel → "Gauge").
- Pan tool in the toolbar; spacebar-to-pan on desktop; one-finger pan
  while pan tool active on touch.
- Auto-save to localStorage on every change (debounced) + auto-restore
  on load.
- Click-a-legend-swatch to swap that color for the active color.
- "No stitch" placeholder cell type accessible from the stitches list.
- Wrong-side-row shading toggle.
- Active row highlight + tap-row-label-to-move.
- Responsive layout with collapsing panels on narrow screens.

Tier 2 features (cables, repeats, custom symbols, PDF) are scaffolded as
next steps.

---

## 6. Sources

Direct quotes and complaint patterns came from:

- [Best Knitting Chart Makers — Knitgrammer](https://www.knitgrammer.com/blog/best-knitting-chart-makers/)
- [In Search of Crochet Charting Software, Part 2 — Edie Eckman](https://www.edieeckman.com/2016/07/31/in-search-of-crochet-charting-software-part-2/)
- [Crochet Designing Apps — Crochet Hygge](https://crochethygge.medium.com/crochet-designing-apps-5b466497070f)
- [Stitchworks Software Review — Jenny Viray Crafts](https://jennyviraycrafts.com/crochet-charts-stitchworks-software-review/)
- [The Mathematics of Knitting — knitting.today](https://knitting.today/the-mathematics-of-knitting/)
- [Charting Cables — Stitchmastery](https://stitchmastery.com/charting-cables/)
- [Knitting Chart Maker — Gauge Genie](https://gaugegenie.com/knitting-chart-maker-free/)
- [Reading Knitting Charts — Brooklyn Tweed](https://brooklyntweed.com/pages/reading-charts)
- [Charting Woes — Niki Knits](https://nikiknits.wordpress.com/2016/05/10/charting-woes/)
- [Knitting chart tools rant — nerdknitter](https://nerdknitter.wordpress.com/2015/10/08/knitting-chart-tools-part-2-rant/)
- [Patternum App](https://rowcounterapp.com/patternum-pattern-creator-app.html)
- [Stitch Fiddle scroll/zoom docs](https://www.stitchfiddle.com/en/help/1pep-8f683s/scroll-zoom)
- [Stitch Fiddle gauge proportions docs](https://www.stitchfiddle.com/en/help/1pe1-ftobtg/gauge-proportions)
- [My Row Counter App store page](https://apps.apple.com/us/app/my-row-counter-knit-crochet/id1342608792)
