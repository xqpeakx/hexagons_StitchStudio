// ═══════════════════════════════════════════════════════════
// STATE & CONSTANTS
// All globals live here; later modules read/mutate them via
// the shared `S` object plus the named tables (CS, PALETTE, etc.).
// ═══════════════════════════════════════════════════════════

// Stitch catalogues. `_no` is the lace "no stitch" placeholder —
// renders as a dimmed cell with a dash, never counts toward gauge.
const CS = {
  crochet: [
    {id:'ch', sym:'o', name:'Chain',         abbr:'ch',  col:'#8b7355'},
    {id:'sl', sym:'•', name:'Slip Stitch',   abbr:'sl',  col:'#5a5a5a'},
    {id:'sc', sym:'×', name:'Single Crochet',abbr:'sc',  col:'#8b5e3c'},
    {id:'hdc',sym:'T', name:'Half Double',   abbr:'hdc', col:'#c4687a'},
    {id:'dc', sym:'┤', name:'Double Crochet',abbr:'dc',  col:'#3d8b7a'},
    {id:'tr', sym:'╪', name:'Treble',        abbr:'tr',  col:'#7a5a9a'},
    {id:'cl', sym:'♦', name:'Cluster',       abbr:'cl',  col:'#c4963a'},
    {id:'bb', sym:'●', name:'Bobble/Puff',   abbr:'bb',  col:'#c46a3c'},
    {id:'_no',sym:'–', name:'No stitch',     abbr:'—',   col:'#c8c2b9'},
  ],
  knit: [
    {id:'k',  sym:'—', name:'Knit',          abbr:'k',   col:'#3d8b7a'},
    {id:'p',  sym:'·', name:'Purl',          abbr:'p',   col:'#8b5e3c'},
    {id:'k2t',sym:'/', name:'K2tog',         abbr:'k2t', col:'#c4687a'},
    {id:'ssk',sym:'\\',name:'SSK',           abbr:'ssk', col:'#7a5a9a'},
    {id:'yo', sym:'O', name:'Yarn Over',     abbr:'yo',  col:'#c4963a'},
    {id:'m1', sym:'+', name:'M1 Inc',        abbr:'m1',  col:'#3d7a8b'},
    {id:'sl1',sym:'>', name:'Slip 1',        abbr:'sl1', col:'#5a5a5a'},
    {id:'cb', sym:'⧖', name:'Cable',         abbr:'cb',  col:'#6b4fa0'},
    {id:'_no',sym:'–', name:'No stitch',     abbr:'—',   col:'#c8c2b9'},
  ]
};

// Default colorway. PALETTE is mutable: addCustomColor() unshifts new
// picks onto the front, renderPalette() renders from this array.
const PALETTE = [
  '#fdf0e6','#f5d0a8','#e8a878','#d4734a',
  '#b05028','#6e3018','#fce8ee','#f0a8bc',
  '#d4688a','#a04060','#e8f4f0','#8ecfc0',
  '#3a8870','#245e50','#f8f0e8','#e8d4b8',
  '#c8a870','#906830','#e8eaf8','#a8b0d8',
  '#6070b8','#303880','#f0e8f8','#c8a8e0',
  '#8858c0','#502880','#fffff0','#e8e8e8',
  '#b0b0b0','#606060','#303030','#101010',
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
  panX:0, panY:0,
};

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

// Custom-color picker debounce timer.
let _customColorCommitTimer = null;

// Auto-save debounce timer.
let _autosaveTimer = null;
const AUTOSAVE_KEY = 'ss_autosave_v1';

// Granny-square round colours (preview state only).
let gRoundCols = ['#d4688a','#3a8870','#c4963a','#6b4fa0','#d4956a','#5a8b5a','#8b5a3c','#3c5a8b'];

// Canvas refs are populated once `init()` runs, after the DOM exists.
let canvas, ctx, gCanvas, gCtx;
