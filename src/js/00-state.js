// ═══════════════════════════════════════════════════════════
// STATE, COLOR TOKENS & CONSTANTS
// All globals live here; later modules read/mutate them via
// the shared `S` object plus the named tables (CS, PALETTE, etc.).
// ═══════════════════════════════════════════════════════════

// Color tokens are intentionally centralized here so stitch catalogs,
// presets, canvas fallbacks, and export code do not grow their own
// accidental mini-palettes. CSS owns the live theme; these JS tokens are
// stable data colors and no-DOM fallbacks.
const UI_COLORS = Object.freeze({
  theme:'#7c4f31',
  bg:'#faf8f5',
  surface:'#fffdf9',
  s2:'#f3f0eb',
  s3:'#ebe6df',
  border:'#e2ddd7',
  border2:'#cec8c0',
  text:'#2a2520',
  text3:'#73685f',
  accent:'#7c4f31',
  rose:'#943c50',
});

const CSS_COLOR_FALLBACKS = Object.freeze({
  '--theme-color': UI_COLORS.theme,
  '--bg': UI_COLORS.bg,
  '--surface': UI_COLORS.surface,
  '--s2': UI_COLORS.s2,
  '--s3': UI_COLORS.s3,
  '--border': UI_COLORS.border,
  '--border2': UI_COLORS.border2,
  '--text': UI_COLORS.text,
  '--text3': UI_COLORS.text3,
  '--accent': UI_COLORS.accent,
  '--rose': UI_COLORS.rose,
  '--canvas-ws-row': 'rgb(95 67 141 / 0.07)',
  '--canvas-hairline': 'rgb(42 37 32 / 0.08)',
});

const CANVAS_FONT_STACK = '"Avenir Next", "Segoe UI", "Helvetica Neue", Arial, sans-serif';

const YARN_COLORS = Object.freeze({
  peachMist:'#fdf0e6',
  peach:'#f5d0a8',
  coralLight:'#e8a878',
  coral:'#d4734a',
  rust:'#b05028',
  bark:'#6e3018',
  roseMist:'#fce8ee',
  roseLight:'#f0a8bc',
  rose:'#d4688a',
  berry:'#a04060',
  mintMist:'#e8f4f0',
  mint:'#8ecfc0',
  teal:'#3a8870',
  pine:'#245e50',
  linen:'#f8f0e8',
  straw:'#e8d4b8',
  gold:'#c8a870',
  umber:'#906830',
  blueMist:'#e8eaf8',
  blue:'#a8b0d8',
  indigo:'#6070b8',
  navy:'#303880',
  lilacMist:'#f0e8f8',
  lilac:'#c8a8e0',
  violet:'#8858c0',
  eggplant:'#502880',
  ivory:'#fffff0',
  fog:'#e8e8e8',
  silver:'#b0b0b0',
  charcoal:'#606060',
  graphite:'#303030',
  ink:'#101010',
  apricot:'#d4956a',
  cream:'#f5e6d3',
  fabricMint:'#e8f4f1',
  fabricRose:'#faeef0',
  leaf:'#5a8b5a',
  clay:'#8b5a3c',
  denim:'#3c5a8b',
});

const STITCH_COLORS = Object.freeze({
  chain:'#6f5437',
  neutral:'#5a5a5a',
  single:'#8b5e3c',
  rose:'#9b3f5b',
  teal:'#2f7064',
  plum:'#7a5a9a',
  gold:'#8a610f',
  copper:'#9c4828',
  absent:'#6f675d',
  blueGreen:'#3d7a8b',
  cable:'#6b4fa0',
});

const PRESET_COLORS = Object.freeze({
  granny:[YARN_COLORS.rose, YARN_COLORS.teal, STITCH_COLORS.gold, STITCH_COLORS.cable],
  shell:[YARN_COLORS.apricot, STITCH_COLORS.rose, STITCH_COLORS.teal],
  ripple:[YARN_COLORS.cream, YARN_COLORS.apricot, STITCH_COLORS.rose, STITCH_COLORS.plum, STITCH_COLORS.teal],
  stockinette:YARN_COLORS.fabricMint,
  ribPurl:UI_COLORS.bg,
  seedPurl:YARN_COLORS.fabricRose,
  checker:[STITCH_COLORS.teal, STITCH_COLORS.rose],
});

const GRANNY_ROUND_COLORS = Object.freeze([
  YARN_COLORS.rose,
  YARN_COLORS.teal,
  STITCH_COLORS.gold,
  STITCH_COLORS.cable,
  YARN_COLORS.apricot,
  YARN_COLORS.leaf,
  YARN_COLORS.clay,
  YARN_COLORS.denim,
]);

// Stitch catalogues. `_no` is the lace "no stitch" placeholder —
// renders as a dimmed cell with a dash, never counts toward gauge.
const CS = {
  crochet: [
    {id:'ch', sym:'o', name:'Chain',         abbr:'ch',  col:STITCH_COLORS.chain},
    {id:'sl', sym:'•', name:'Slip Stitch',   abbr:'sl',  col:STITCH_COLORS.neutral},
    {id:'sc', sym:'×', name:'Single Crochet',abbr:'sc',  col:STITCH_COLORS.single},
    {id:'hdc',sym:'T', name:'Half Double',   abbr:'hdc', col:STITCH_COLORS.rose},
    {id:'dc', sym:'┤', name:'Double Crochet',abbr:'dc',  col:STITCH_COLORS.teal},
    {id:'tr', sym:'╪', name:'Treble',        abbr:'tr',  col:STITCH_COLORS.plum},
    {id:'cl', sym:'♦', name:'Cluster',       abbr:'cl',  col:STITCH_COLORS.gold},
    {id:'bb', sym:'●', name:'Bobble/Puff',   abbr:'bb',  col:STITCH_COLORS.copper},
    {id:'_no',sym:'–', name:'No stitch',     abbr:'—',   col:STITCH_COLORS.absent},
  ],
  knit: [
    {id:'k',  sym:'—', name:'Knit',          abbr:'k',   col:STITCH_COLORS.teal},
    {id:'p',  sym:'·', name:'Purl',          abbr:'p',   col:STITCH_COLORS.single},
    {id:'k2t',sym:'/', name:'K2tog',         abbr:'k2t', col:STITCH_COLORS.rose},
    {id:'ssk',sym:'\\',name:'SSK',           abbr:'ssk', col:STITCH_COLORS.plum},
    {id:'yo', sym:'O', name:'Yarn Over',     abbr:'yo',  col:STITCH_COLORS.gold},
    {id:'m1', sym:'+', name:'M1 Inc',        abbr:'m1',  col:STITCH_COLORS.blueGreen},
    {id:'sl1',sym:'>', name:'Slip 1',        abbr:'sl1', col:STITCH_COLORS.neutral},
    {id:'cb', sym:'⧖', name:'Cable',         abbr:'cb',  col:STITCH_COLORS.cable},
    {id:'_no',sym:'–', name:'No stitch',     abbr:'—',   col:STITCH_COLORS.absent},
  ]
};

// Default colorway. PALETTE is mutable: addCustomColor() unshifts new
// picks onto the front, renderPalette() renders from this array.
const PALETTE = [
  YARN_COLORS.peachMist,YARN_COLORS.peach,YARN_COLORS.coralLight,YARN_COLORS.coral,
  YARN_COLORS.rust,YARN_COLORS.bark,YARN_COLORS.roseMist,YARN_COLORS.roseLight,
  YARN_COLORS.rose,YARN_COLORS.berry,YARN_COLORS.mintMist,YARN_COLORS.mint,
  YARN_COLORS.teal,YARN_COLORS.pine,YARN_COLORS.linen,YARN_COLORS.straw,
  YARN_COLORS.gold,YARN_COLORS.umber,YARN_COLORS.blueMist,YARN_COLORS.blue,
  YARN_COLORS.indigo,YARN_COLORS.navy,YARN_COLORS.lilacMist,YARN_COLORS.lilac,
  YARN_COLORS.violet,YARN_COLORS.eggplant,YARN_COLORS.ivory,YARN_COLORS.fog,
  YARN_COLORS.silver,YARN_COLORS.charcoal,YARN_COLORS.graphite,YARN_COLORS.ink,
];

const PRESETS_DEF = {
  crochet:[
    {name:'Classic Granny', fn:'presetClassicGranny'},
    {name:'Shell Rows',     fn:'presetShell'},
    {name:'Ripple',         fn:'presetRipple'},
    {name:'Solid Block',    fn:'presetSolid'},
    {name:'Blank',          fn:'presetBlank'},
  ],
  knit:[
    {name:'Stockinette',    fn:'presetStockinette'},
    {name:'2×2 Rib',        fn:'presetRib'},
    {name:'Seed Stitch',    fn:'presetSeed'},
    {name:'Fair Isle Check',fn:'presetChecker'},
    {name:'Blank Chart',    fn:'presetBlank'},
  ]
};

// Crochet terminology differs between US and UK patterns. Internal ids stay
// stable; only user-facing names/abbreviations change.
const CROCHET_TERMS = {
  us: {
    ch:  { name:"Chain",          abbr:"ch" },
    sl:  { name:"Slip Stitch",    abbr:"sl" },
    sc:  { name:"Single Crochet", abbr:"sc" },
    hdc: { name:"Half Double",    abbr:"hdc" },
    dc:  { name:"Double Crochet", abbr:"dc" },
    tr:  { name:"Treble",         abbr:"tr" },
    cl:  { name:"Cluster",        abbr:"cl" },
    bb:  { name:"Bobble/Puff",    abbr:"bb" },
    _no: { name:"No stitch",      abbr:"—" },
  },
  uk: {
    ch:  { name:"Chain",          abbr:"ch" },
    sl:  { name:"Slip Stitch",    abbr:"sl" },
    sc:  { name:"Double Crochet", abbr:"dc" },
    hdc: { name:"Half Treble",    abbr:"htr" },
    dc:  { name:"Treble",         abbr:"tr" },
    tr:  { name:"Double Treble",  abbr:"dtr" },
    cl:  { name:"Cluster",        abbr:"cl" },
    bb:  { name:"Bobble/Puff",    abbr:"bb" },
    _no: { name:"No stitch",      abbr:"—" },
  },
};

// Shared mutable application state.
let S = {
  mode:'crochet', gridType:'square', tool:'draw',
  crochetTerms:'us',
  textNoStitch:'mark',
  sqW:200, sqH:200, cellSize:26,
  hexCols:300, hexRows:300, hexSize:26, hexFlat:true,
  cells:{},
  activeColor: PALETTE[2],
  activeStitch:'dc',
  showGrid:true, showLabels:true, showSyms:true,
  protectFilled:true,
  // Gauge ratio: stitches × rows per 4 inches. When stitches !== rows
  // square cells render with cellSize × (stitches/rows) height so the
  // chart visually matches finished knit fabric.
  gaugeStitches: 0, gaugeRows: 0, // 0 = disabled (square cells)
  // Wrong-side row shading (square grid only). When on, even rows
  // (when knitting bottom-up) get a subtle tint.
  shadeWS:false,
  // Active row highlight ("follow" mode). null = off, otherwise
  // 0-indexed row that gets a colored outline.
  activeRow: null,
  // Stylus mode. When true, finger touches always pan and stylus
  // touches use the selected tool. Auto-enables the first time a
  // stylus touch is detected; can be toggled manually after that.
  stylusMode:false,
  // Cables (square-grid only). Each entry is
  //   { r, c, w, dir:'L'|'R', color }
  // The record covers cells [r, c..c+w-1]; the underlying S.cells
  // entries are left intact so the cable rides on top of whatever
  // base colour was painted.
  cables: [],
  // Selected cable type to place on next click, or null for normal
  // single-cell painting. e.g. { w: 4, dir: 'L' } for a 2/2 L cable.
  activeCable: null,
  // Repeat brackets (square-grid only). Each entry is
  //   { r0, c0, r1, c1, count, axis:'across'|'down'|'both' }
  // r0<=r1 and c0<=c1 always. axis controls which brackets render.
  repeats: [],
  // Image underlay (square-grid only). When set, an image renders
  // behind the cells at low opacity so the user can trace cells over
  // a reference photo. Stored as { src:dataURL, x, y, w, h, opacity }
  // where x/y/w/h are in chart cells.
  underlay: null,
  panX:0, panY:0,
};

// Cached HTMLImageElement built from S.underlay.src. Not persisted.
let _underlayImg = null;

// Long-press tracking on the legend. Tap = quick-swap (existing
// behaviour); long-press = open the legend popover (color stored on
// the popover element's dataset, not here).
let _legendLongPressTimer = null;

// Repeat-tool selection state. The first tap stores an anchor; the
// second tap opens the modal that captures count + axis. While the
// modal is open _repeatPendingRegion holds the rectangle.
let _repeatAnchor = null;        // {r, c} | null
let _repeatPendingRegion = null; // {r0,c0,r1,c1} | null

// Has a stylus event been observed in this session yet? Used to
// auto-suggest enabling stylusMode on first Pencil contact.
let _stylusSeenAuto = false;

// Painting / interaction state, shared across event handlers.
let undoStack = [];
let redoStack = [];
const MAX_UNDO = 40;
let painting=false, lastKey=null, isPan=false;
let panSt={x:0,y:0}, panOr={x:0,y:0};
let t2Start=null, t2ZoomSt=1, t2PanSt={x:0,y:0};

// Touch double-tap tracking (mirrors dblclick on mouse).
let _lastTapKey = null, _lastTapTime = 0;

// Spacebar-to-pan (desktop). When held, takes precedence over
// the active tool and behaves like the Pan tool.
let _spaceHeld = false;

// Keyboard canvas fallback. Arrow keys move this cell cursor when the
// canvas has focus; Enter/Space apply the active tool there.
let _keyboardCell = { row: 0, col: 0 };

// Custom-color picker debounce timer.
let _customColorCommitTimer = null;

// Auto-save debounce timer.
let _autosaveTimer = null;
const AUTOSAVE_KEY = 'ss_autosave_v1';

// Display-mode preference. Persists via localStorage independently of
// the per-pattern autosave: theme is a per-device preference, not a
// per-project setting. 'light' or 'dark'; defaults to light.
const THEME_KEY = 'ss_theme_v1';

// Granny-square round colours (preview state only).
let gRoundCols = [...GRANNY_ROUND_COLORS];

// Canvas refs are populated once `init()` runs, after the DOM exists.
let canvas, ctx, gCanvas, gCtx;
