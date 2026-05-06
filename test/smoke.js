#!/usr/bin/env node
/**
 * Stitch Studio smoke test — no dependencies.
 *
 * Runs `python3 build.py` (unless --no-build is passed), then loads the
 * resulting stitch-studio.html and verifies:
 *
 *   1. The bundled <script> parses cleanly (catches typos, missing
 *      braces, accidental ESM-only syntax that breaks the script tag).
 *   2. Every identifier in the EXPECTED_GLOBALS list appears somewhere
 *      in the script (catches "renamed function but forgot to update
 *      the caller").
 *   3. Every DOM id in the EXPECTED_DOM_IDS list appears in the HTML
 *      shell (catches "moved an element but the JS still queries it").
 *
 * Exit code 0 on pass, 1 on any failure. Suitable for CI.
 *
 * Usage:
 *   node test/smoke.js              # build + all checks
 *   node test/smoke.js --no-build   # skip rebuild, test current bundle
 */

const fs   = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const HTML = path.join(ROOT, 'stitch-studio.html');

const EXPECTED_GLOBALS = [
  // Core
  'function init', 'function draw', 'function paintAt', 'function floodFill',
  'function setMode', 'function setGridType', 'function setTool',
  // State
  'let S =', 'const PALETTE', 'const CS', 'const CROCHET_TERMS',
  'AUTOSAVE_KEY',
  // Tier 1 features
  'function applyGauge', 'function togWS', 'function togFollow',
  'function swapColor', 'function scheduleAutosave', 'function tryRestoreAutosave',
  'function bindCanvasEvents',
  'cellHeightSq', '_spaceHeld',
  'function snapshotUndoState', 'function restoreUndoState',
  // Tablet UX features
  'function togStylus', 'function redoLast',
  'stylusMode', 'redoStack',
  'gesturePeakFingers', 'MULTI_TAP_MS',
  // Cables (ACT-021)
  'function drawCable', 'function placeCableAt',
  'function renderCables', 'function setCable',
  'CABLE_TYPES', 'S.cables', 'activeCable',
  // Repeats (ACT-020)
  'function drawRepeatBracket', 'function handleRepeatTap',
  'function openRepeatModal', 'function doRepeat',
  'S.repeats',
  // Pattern text export (ACT-012)
  'function generatePatternText', 'function exportText',
  'function copyPatternText', 'function downloadPatternText',
  // Image underlay
  'function loadUnderlay', 'function clearUnderlay',
  'function downsampleImage', 'function ensureUnderlayImg',
  'S.underlay',
  // Legend long-press
  'function bindLegendLongPress', 'function openLegendMenu',
  'function legendActionPick', 'function legendActionSwap', 'function legendActionRemove',
  // Built-in help / option finder
  'const HELP_TOPICS', 'function openHelpModal', 'function renderHelpTopics',
  'function guideJump',
  // Delegated UI action binding
  'const UI_ACTIONS', 'function bindUiActions',
];

const EXPECTED_DOM_IDS = [
  // Canvases
  'mc', 'gpc',
  // Toolbar inputs
  'sqW', 'sqH', 'sqCell', 'hexCols', 'hexRows', 'hexSize',
  // Tools (5 + repeat)
  'tool-draw', 'tool-erase', 'tool-fill', 'tool-eye', 'tool-pan', 'tool-repeat',
  // Stitch list / palette / presets / cables
  'stitchList', 'colorGrid', 'presetList', 'cablesGrid', 'cablesPanel',
  // Granny panel
  'grannyPanel',
  // Display toggles
  'gOn', 'gOff', 'lOn', 'lOff', 'sOn', 'sOff',
  'pOn', 'pOff', 'wsOn', 'wsOff', 'foOn', 'foOff', 'stOn', 'stOff',
  // Gauge
  'gaugeSt', 'gaugeRo', 'gaugeRow',
  // Modals
  'saveM', 'loadM', 'newM', 'repeatM', 'txtM', 'legendM', 'helpM',
  'helpSearch', 'helpResults',
  // Discoverability panels / jump targets
  'toolsPanel', 'stitchPanel', 'colorPanel', 'presetPanel', 'specialPanel',
  'patternPanel', 'optionMap', 'displayPanel', 'legendPanel', 'actionsPanel',
  'canvasOptionsBar', 'quickActions',
  // Underlay
  'underlayPanel', 'underlayCtrls', 'underlayFile', 'underlayOpacity',
  'underlayX', 'underlayY', 'underlayW', 'underlayH',
  // Pattern info
  'patName', 'sRows', 'sCols', 'sFill',
  // Indicator + zoom + toast
  'adot', 'alab', 'zl', 'toast',
  // Project import
  'projectFile',
  // Legend menu modal pieces
  'legendMTitle', 'legendMSwatch', 'legendMLabel', 'legendMCount',
  // Repeat modal pieces
  'repeatRegionLabel', 'repeatCount', 'repeatAxis',
];

const EXPECTED_HEAD_TAGS = [
  // PWA / iPad chrome
  'manifest.webmanifest',
  'apple-mobile-web-app-capable',
  'viewport-fit=cover',
];

function fail(msg) {
  console.error('✗ ' + msg);
  process.exitCode = 1;
}

function pass(msg) {
  console.log('✓ ' + msg);
}

const args = new Set(process.argv.slice(2));

if (!args.has('--no-build')) {
  console.log('• Building bundle…');
  const r = spawnSync('python3', ['build.py'], { cwd: ROOT, stdio: 'inherit' });
  if (r.status !== 0) {
    fail('build.py failed (exit ' + r.status + ')');
    process.exit(1);
  }
}

if (!fs.existsSync(HTML)) {
  fail('stitch-studio.html not found at ' + HTML);
  process.exit(1);
}

const html = fs.readFileSync(HTML, 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) {
  fail('no <script> block found in stitch-studio.html');
  process.exit(1);
}
const js = m[1];

// 1. Parse-check
try {
  // eslint-disable-next-line no-new-func
  new Function(js);
  pass('JS parses cleanly');
} catch (e) {
  fail('JS parse error: ' + e.message);
}

// 2. Identifiers
let missing = EXPECTED_GLOBALS.filter(id => !js.includes(id));
if (missing.length) fail('missing identifiers: ' + missing.join(', '));
else                pass('all ' + EXPECTED_GLOBALS.length + ' expected JS identifiers present');

// 3. DOM IDs
const head = html.split('</head>')[0] || '';
missing = EXPECTED_DOM_IDS.filter(id => !html.includes('id="' + id + '"') && !html.includes("id='" + id + "'"));
if (missing.length) fail('missing DOM IDs: ' + missing.join(', '));
else                pass('all ' + EXPECTED_DOM_IDS.length + ' expected DOM IDs present');

// 4. Head tags
missing = EXPECTED_HEAD_TAGS.filter(t => !head.includes(t));
if (missing.length) fail('missing <head> tags: ' + missing.join(', '));
else                pass('all PWA / iPad meta present');

// Summary
const sizeKb = Math.round(html.length / 1024 * 10) / 10;
console.log('— bundle ' + sizeKb + ' KB');
process.exit(process.exitCode || 0);
