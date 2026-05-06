// ═══════════════════════════════════════════════════════════
// UI RENDERS, INDICATORS, TOGGLES
// Everything that pushes state → DOM lives here.
// ═══════════════════════════════════════════════════════════

function setPressed(el, on) {
  if (!el) return;
  el.classList.toggle('on', !!on);
  el.setAttribute('aria-pressed', on ? 'true' : 'false');
}

const UI_ACTIONS = {
  setMode: el => setMode(el.dataset.value),
  setGridType: el => setGridType(el.dataset.value),
  openHelpModal: () => openHelpModal(),
  closeHelpDrawer: () => closeHelpDrawer(),
  openNewModal: () => openNewModal(),
  setTool: el => setTool(el.dataset.value),
  previewCustomColor: el => previewCustomColor(el.value),
  addCustomColor: el => addCustomColor(el.value),
  toggleGranny: () => toggleGranny(),
  toggleLP: () => toggleLP(),
  toggleRP: () => toggleRP(),
  applySqSize: () => applySqSize(),
  applyCellSize: () => applyCellSize(),
  applyHexSize: () => applyHexSize(),
  setHexOrient: el => setHexOrient(el.dataset.value),
  undoLast: () => undoLast(),
  redoLast: () => redoLast(),
  openSaveModal: () => openSaveModal(),
  openLoadModal: () => openLoadModal(),
  exportPDF: () => exportPDF(),
  exportCanvas: () => exportCanvas(),
  exportText: () => exportText(),
  adjZoom: el => adjZoom(Number(el.dataset.value || 0)),
  resetZoom: () => resetZoom(),
  onGStyleChange: () => onGStyleChange(),
  buildRoundRows: () => buildRoundRows(),
  drawGrannyPreview: () => drawGrannyPreview(),
  stampToCanvas: () => stampToCanvas(),
  exportGranny: () => exportGranny(),
  guideJump: el => guideJump(el.dataset.target),
  togGrid: el => togGrid(el.dataset.value === 'true'),
  togLabels: el => togLabels(el.dataset.value === 'true'),
  togSyms: el => togSyms(el.dataset.value === 'true'),
  togProtect: el => togProtect(el.dataset.value === 'true'),
  togWS: el => togWS(el.dataset.value === 'true'),
  togFollow: el => togFollow(el.dataset.value === 'true'),
  setCrochetTerms: el => setCrochetTerms(el.dataset.value),
  togStylus: el => togStylus(el.dataset.value === 'true'),
  applyGauge: () => applyGauge(),
  openUnderlayFile: () => document.getElementById('underlayFile').click(),
  setUnderlayOpacity: el => setUnderlayOpacity(el.value),
  updateUnderlayBounds: () => updateUnderlayBounds(),
  clearUnderlay: () => clearUnderlay(),
  exportProject: () => exportProject(),
  openProjectImport: () => openProjectImport(),
  clearAll: () => clearAll(),
  mirrorH: () => mirrorH(),
  mirrorV: () => mirrorV(),
  closeModal: el => closeM(el.dataset.modal),
  renderHelpTopics: el => renderHelpTopics(el.value),
  doSave: () => doSave(),
  doNew: () => doNew(),
  legendActionPick: () => legendActionPick(),
  legendActionSwap: () => legendActionSwap(),
  legendActionRemove: () => legendActionRemove(),
  copyPatternText: () => copyPatternText(),
  downloadPatternText: () => downloadPatternText(),
  updatePatternTextOptions: () => updatePatternTextOptions(),
  cancelRepeat: () => cancelRepeat(),
  doRepeat: () => doRepeat(),
  importProjectFile: el => importProjectFile(el),
  loadUnderlay: el => loadUnderlay(el),
};

function runUiAction(el, actionName) {
  if (!el || !actionName) return;
  const action = UI_ACTIONS[actionName];
  if (typeof action === 'function') action(el);
}

function bindUiActions() {
  if (bindUiActions._wired) return;
  bindUiActions._wired = true;
  document.addEventListener('click', event => {
    const el = event.target.closest('[data-action]');
    if (!el || el.disabled) return;
    runUiAction(el, el.dataset.action);
  });
  document.addEventListener('input', event => {
    const el = event.target.closest('[data-input-action]');
    if (!el || el.disabled) return;
    runUiAction(el, el.dataset.inputAction);
  });
  document.addEventListener('change', event => {
    const el = event.target.closest('[data-change-action]');
    if (!el || el.disabled) return;
    runUiAction(el, el.dataset.changeAction);
  });
}

function syncThemeChrome() {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', canvasToken(meta.dataset.themeToken || '--theme-color'));
  const customColor = document.getElementById('customColor');
  if (customColor) customColor.value = S.activeColor;
}

function renderStitches() {
  const list = CS[S.mode];
  const root = document.getElementById('stitchList');
  root.textContent = '';
  list.forEach(s => {
    const active = S.activeStitch === s.id;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sit' + (active ? ' on' : '');
    btn.style.setProperty('--stitch-color', s.col);
    btn.style.setProperty('--stitch-ink', symbolInkForColor(s.col));
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    btn.addEventListener('click', () => setStitch(s.id));

    const sym = document.createElement('span');
    sym.className = 'ssym';
    sym.textContent = s.sym;

    const label = document.createElement('span');
    label.textContent = stitchLabel(s).name;
    btn.append(sym, label);
    root.append(btn);
  });
}

function renderPalette() {
  const root = document.getElementById('colorGrid');
  root.textContent = '';
  PALETTE.forEach(c => {
    const active = S.activeColor === c;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'csw' + (active ? ' on' : '');
    btn.style.setProperty('--swatch-color', c);
    btn.setAttribute('aria-label', 'Use yarn colour ' + c);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    btn.addEventListener('click', () => setColor(c));
    root.append(btn);
  });
  const add = document.createElement('button');
  add.type = 'button';
  add.className = 'cadd';
  add.setAttribute('aria-label', 'Add custom yarn colour');
  add.textContent = '+';
  add.addEventListener('click', () => document.getElementById('customColor').click());
  root.append(add);
}

function renderPresets() {
  const ps = PRESETS_DEF[S.mode];
  const root = document.getElementById('presetList');
  root.textContent = '';
  ps.forEach(p => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pit';
    btn.addEventListener('click', () => {
      const fn = globalThis[p.fn];
      if (typeof fn === 'function') fn();
    });
    btn.append(document.createTextNode(p.name));
    const tag = document.createElement('span');
    tag.className = 'ptag';
    tag.textContent = S.mode;
    btn.append(tag);
    root.append(btn);
  });
}

// Cable picker — square-grid only. Renders a 2×4 grid of width/direction
// buttons plus a "no cable" reset.
const CABLE_TYPES = [
  { w: 2, dir: 'L', label: '1/1 L' }, { w: 2, dir: 'R', label: '1/1 R' },
  { w: 4, dir: 'L', label: '2/2 L' }, { w: 4, dir: 'R', label: '2/2 R' },
  { w: 6, dir: 'L', label: '3/3 L' }, { w: 6, dir: 'R', label: '3/3 R' },
  { w: 8, dir: 'L', label: '4/4 L' }, { w: 8, dir: 'R', label: '4/4 R' },
];

function renderCables() {
  const el = document.getElementById('cablesGrid');
  if (!el) return;
  const isOn = (t) => S.activeCable && S.activeCable.w === t.w && S.activeCable.dir === t.dir;
  el.textContent = '';
  CABLE_TYPES.forEach(t => {
    const active = isOn(t);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cab' + (active ? ' on' : '');
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    btn.textContent = t.label;
    btn.addEventListener('click', () => setCable(t.w, t.dir));
    el.append(btn);
  });
  const none = document.createElement('button');
  none.type = 'button';
  none.className = 'cab cab-none';
  none.setAttribute('aria-pressed', S.activeCable ? 'false' : 'true');
  none.textContent = 'No cable (single cells)';
  none.addEventListener('click', () => setCable(null));
  el.append(none);
}

// ── LEGEND LONG-PRESS MENU ──
// Tap a legend colour row → swap with active (existing inline onclick).
// Long-press (~500 ms) → open an action sheet with pick / swap / remove.
function bindLegendLongPress() {
  const legend = document.getElementById('legend');
  if (!legend || legend._lpWired) return;
  legend._lpWired = true;

  const HOLD_MS = 500;

  const colorFromSwap = el => {
    if (el.dataset && el.dataset.color) return el.dataset.color;
    const m = (el.getAttribute('onclick') || '').match(/swapColor\('([^']+)'\)/);
    return m ? m[1] : null;
  };

  const start = (el) => {
    const color = colorFromSwap(el);
    if (!color) return;
    cancel();
    _legendLongPressTimer = setTimeout(() => {
      _legendLongPressTimer = null;
      legend._lpFired = true;
      openLegendMenu(color);
    }, HOLD_MS);
  };
  const cancel = () => {
    if (_legendLongPressTimer) {
      clearTimeout(_legendLongPressTimer);
      _legendLongPressTimer = null;
    }
  };

  legend.addEventListener('mousedown', e => {
    const el = e.target.closest('.li.swap');
    if (el) start(el);
  });
  ['mouseup', 'mouseleave'].forEach(ev => legend.addEventListener(ev, cancel));

  legend.addEventListener('touchstart', e => {
    const el = e.target.closest('.li.swap');
    if (el) start(el);
  }, { passive: true });
  ['touchend', 'touchcancel', 'touchmove'].forEach(ev =>
    legend.addEventListener(ev, cancel, { passive: true }));

  // Suppress the click that follows a long-press so swapColor doesn't
  // fire on top of the menu open.
  legend.addEventListener('click', e => {
    if (legend._lpFired) {
      legend._lpFired = false;
      e.stopPropagation();
      e.preventDefault();
    }
  }, true);
}

function openLegendMenu(color) {
  _legendMenuColor = color;
  const count = Object.values(S.cells).filter(c => c.color === color).length;
  const cableCount = (S.cables || []).filter(cb => cb.color === color).length;
  document.getElementById('legendMSwatch').style.setProperty('--swatch-color', color);
  document.getElementById('legendMLabel').textContent = color;
  document.getElementById('legendMCount').textContent =
    `Used in ${count} cell${count === 1 ? '' : 's'}` +
    (cableCount ? ` and ${cableCount} cable${cableCount === 1 ? '' : 's'}` : '');
  openM('legendM', '#legendM .sbtn2');
}

function legendActionPick() {
  if (_legendMenuColor) {
    setColor(_legendMenuColor);
    toast('Picked active colour ' + _legendMenuColor);
  }
  closeM('legendM');
}

function legendActionSwap() {
  if (_legendMenuColor) swapColor(_legendMenuColor);
  closeM('legendM');
}

function legendActionRemove() {
  if (!_legendMenuColor) { closeM('legendM'); return; }
  const target = _legendMenuColor;
  pushUndo();
  let n = 0;
  Object.keys(S.cells).forEach(k => {
    if (S.cells[k].color === target) { delete S.cells[k]; n++; }
  });
  if (n) markCellsDirty();
  // Also remove cables of this colour — they're tied to a colour at
  // placement time, so removing the colour should remove the cable.
  let cn = 0;
  S.cables = (S.cables || []).filter(cb => {
    if (cb.color === target) { cn++; return false; }
    return true;
  });
  draw(); updateStats(); updateLegend(); scheduleAutosave();
  const parts = [];
  if (n || !cn) parts.push(n + ' cell' + (n === 1 ? '' : 's'));
  if (cn) parts.push(cn + ' cable' + (cn === 1 ? '' : 's'));
  toast('Removed ' + parts.join(' + '));
  closeM('legendM');
}

const HELP_TOPICS = [
  {
    title: 'Start a chart',
    body: 'Choose mode and grid, then draw.',
    where: 'Header + Tools',
    target: 'toolsPanel',
    tags: 'new start crochet knitting square hex draw tools',
  },
  {
    title: 'Draw, erase, fill, or pick',
    body: 'Paint, clear, flood-fill, copy, pan, or mark repeats.',
    where: 'Tools',
    target: 'toolsPanel',
    tags: 'draw erase fill bucket pick eyedropper tool paint',
    featured: true,
  },
  {
    title: 'Change stitch or colour',
    body: 'Pick a stitch symbol and yarn colour before drawing.',
    where: 'Stitches + Colorway',
    target: 'stitchPanel',
    tags: 'stitch symbol color colour yarn custom palette colorway',
    featured: true,
  },
  {
    title: 'Resize the chart',
    body: 'Set rows, columns, hex count, or cell size.',
    where: 'Top toolbar',
    target: 'canvasOptionsBar',
    tags: 'size width height rows columns cols zoom cell grid limit toolbar square hex',
    featured: true,
  },
  {
    title: 'Tune display',
    body: 'Show labels, symbols, wrong-side shading, follow row, or stylus mode.',
    where: 'Display',
    target: 'displayPanel',
    tags: 'display view labels symbols protect filled wrong side ws follow row terminology stylus',
    featured: true,
  },
  {
    title: 'Match real gauge',
    body: 'Match stitch and row proportions to your fabric.',
    where: 'Gauge',
    target: 'gaugeRow',
    tags: 'gauge aspect ratio stitches rows per 4 inches fabric',
    featured: true,
  },
  {
    title: 'Trace from an image',
    body: 'Place a reference image behind the chart.',
    where: 'Underlay',
    target: 'underlayPanel',
    tags: 'image photo trace underlay opacity import picture',
  },
  {
    title: 'Edit legend colours',
    body: 'Swap, pick, or remove colours already used.',
    where: 'Legend',
    target: 'legendPanel',
    tags: 'legend color colour swap active remove long press pick',
  },
  {
    title: 'Add cable stitches',
    body: 'Choose cable width and direction, then tap the start cell.',
    where: 'Cables',
    target: 'cablesPanel',
    tags: 'cable knit cables 1/1 2/2 left right square',
  },
  {
    title: 'Mark repeats',
    body: 'Tap two corners, then set count and direction.',
    where: 'Tools',
    target: 'toolsPanel',
    tags: 'repeat bracket region count across down both',
  },
  {
    title: 'Save, load, or export',
    body: 'Use quick actions for save, load, PDF, PNG, and text.',
    where: 'Top toolbar',
    target: 'quickActions',
    tags: 'export import pdf png json project text download save load',
    featured: true,
  },
  {
    title: 'Import project JSON',
    body: 'Use More Actions for project import and export files.',
    where: 'More Actions',
    target: 'actionsPanel',
    tags: 'import export json project file more actions',
  },
  {
    title: 'Mobile and tablet gestures',
    body: 'Pinch, pan, double-tap, or two/three-finger tap.',
    where: 'Canvas + Tools',
    target: 'toolsPanel',
    tags: 'mobile tablet touch pinch pan double tap undo redo stylus finger',
  },
];

function renderHelpTopics(query = '') {
  const root = document.getElementById('helpResults');
  if (!root) return;
  const q = query.trim().toLowerCase();
  const topics = q
    ? HELP_TOPICS.filter(t => (t.title + ' ' + t.body + ' ' + t.where + ' ' + t.tags).toLowerCase().includes(q))
    : HELP_TOPICS.filter(t => t.featured);
  root.textContent = '';
  if (!topics.length) {
    const empty = document.createElement('div');
    empty.className = 'help-empty';
    empty.textContent = 'No match. Try "export", "gauge", "legend", or "pan".';
    root.append(empty);
    return;
  }
  topics.forEach(t => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'help-row';
    row.setAttribute('aria-label', 'Jump to ' + t.title + ' in ' + t.where);
    row.addEventListener('click', () => guideJump(t.target));

    const copy = document.createElement('span');
    copy.className = 'help-copy';
    const title = document.createElement('span');
    title.className = 'help-row-title';
    title.textContent = t.title;
    const body = document.createElement('span');
    body.className = 'help-row-body';
    body.textContent = t.body;
    copy.append(title, body);

    const where = document.createElement('span');
    where.className = 'help-where';
    where.textContent = t.where;

    row.append(copy, where);
    root.append(row);
  });
}

let _helpReturnFocus = null;

function openHelpModal(query = '') {
  const drawer = document.getElementById('helpM');
  const search = document.getElementById('helpSearch');
  if (!drawer || !search) return;
  if (!drawer.classList.contains('open')) {
    _helpReturnFocus = typeof HTMLElement !== 'undefined' && document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  }
  search.value = query;
  renderHelpTopics(query);
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => search.focus({ preventScroll: true }));
}

function closeHelpDrawer(restoreFocus = true) {
  const drawer = document.getElementById('helpM');
  if (!drawer) return;
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  if (restoreFocus && _helpReturnFocus && document.contains(_helpReturnFocus)) {
    _helpReturnFocus.focus({ preventScroll: true });
  }
  _helpReturnFocus = null;
}

function guideJump(targetId) {
  const target = document.getElementById(targetId);
  if (!target) return;
  closeHelpDrawer(false);
  const left = document.getElementById('leftPanel');
  const right = document.getElementById('rightPanel');
  if (left && left.contains(target)) lpOpen = true;
  if (right && right.contains(target)) rpOpen = true;
  applyPanelState();
  requestAnimationFrame(() => {
    target.scrollIntoView({ block: 'center', inline: 'nearest' });
    target.classList.remove('spotlight');
    void target.offsetWidth;
    target.classList.add('spotlight');
    setTimeout(() => target.classList.remove('spotlight'), 1300);
    resize();
  });
  toast('Showing ' + targetLabel(targetId));
}

function targetLabel(targetId) {
  const labels = {
    toolsPanel: 'paint tools',
    stitchPanel: 'stitches and colour',
    canvasOptionsBar: 'top toolbar',
    displayPanel: 'display options',
    gaugeRow: 'gauge controls',
    underlayPanel: 'image underlay',
    legendPanel: 'legend actions',
    cablesPanel: 'cable stitches',
    actionsPanel: 'more actions',
    quickActions: 'quick actions',
  };
  return labels[targetId] || 'that option';
}

// Wire the segmented-axis control inside the Repeat modal so clicks
// toggle the .on state. Idempotent — safe to call from init().
function bindRepeatAxisToggle() {
  const btns = document.querySelectorAll('#repeatAxis button');
  btns.forEach(b => {
    if (b._wired) return;
    b._wired = true;
    b.addEventListener('click', () => {
      btns.forEach(o => setPressed(o, o === b));
    });
  });
}

function setCable(wOrNull, dir) {
  if (wOrNull === null) {
    S.activeCable = null;
    toast('Cable picker off — single-cell painting');
  } else {
    S.activeCable = { w: wOrNull, dir };
    // Clearing implicitly sets the draw tool so taps actually place.
    if (S.tool !== 'draw') setTool('draw');
    toast(`Cable: ${wOrNull / 2}/${wOrNull / 2} ${dir} — tap a cell to place`);
  }
  renderCables();
}

function updateStats() {
  const cs = S.cellSize, lo = S.showLabels ? 20 : 0;
  const visC = S.gridType === 'square'
    ? Math.min(S.sqW, Math.ceil((canvas.width - lo) / cs) + 1)
    : Math.min(S.hexCols, Math.ceil(canvas.width / hexMetrics(S.hexSize, S.hexFlat).colStep) + 3);
  const visR = S.gridType === 'square'
    ? Math.min(S.sqH, Math.ceil((canvas.height - lo) / cellHeightSq()) + 1)
    : Math.min(S.hexRows, Math.ceil(canvas.height / hexMetrics(S.hexSize, S.hexFlat).rowStep) + 3);
  document.getElementById('sRows').textContent = visR;
  document.getElementById('sCols').textContent = visC;
  document.getElementById('sFill').textContent = Object.keys(S.cells).length;
}

function updateLegend() {
  const stitches = CS[S.mode];
  const used = {};
  Object.values(S.cells).forEach(c => { used[c.stitchId] = true; });
  const usedCols = [...new Set(
    Object.values(S.cells).map(c => c.color)
      .concat((S.cables || []).map(cb => cb.color))
      .filter(Boolean)
  )];
  const legend = document.getElementById('legend');
  legend.textContent = '';
  let rendered = 0;
  stitches.filter(s => used[s.id]).forEach(s => {
    const label = stitchLabel(s);
    const row = document.createElement('div');
    row.className = 'li';
    const sym = document.createElement('span');
    sym.className = 'lsym';
    sym.textContent = s.sym;
    const swatch = document.createElement('span');
    swatch.className = 'ls';
    swatch.style.setProperty('--swatch-color', s.col);
    const text = document.createElement('span');
    text.textContent = `${label.abbr} — ${label.name}`;
    row.append(sym, swatch, text);
    legend.append(row);
    rendered++;
  });
  // Color rows: tap/click swaps, long-press opens the action menu.
  usedCols.forEach(c => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'li swap';
    row.dataset.color = c;
    row.title = 'Tap to swap with active color; long-press for more actions';
    row.setAttribute('aria-label', 'Swap legend colour ' + c + ' with active colour');
    row.addEventListener('click', () => swapColor(row.dataset.color));
    const swatch = document.createElement('span');
    swatch.className = 'ls legend-swatch';
    swatch.style.setProperty('--swatch-color', c);
    const text = document.createElement('span');
    text.className = 'legend-color-code';
    text.textContent = c;
    row.append(swatch, text);
    legend.append(row);
    rendered++;
  });
  if (!rendered) {
    const empty = document.createElement('span');
    empty.className = 'legend-empty';
    empty.textContent = 'Draw to build legend';
    legend.append(empty);
  }
}

function updateIndicator() {
  const s = CS[S.mode].find(s => s.id === S.activeStitch);
  document.getElementById('adot').style.setProperty('--indicator-color', S.activeColor);
  if (!s) {
    document.getElementById('alab').textContent = '';
    return;
  }
  const label = stitchLabel(s);
  document.getElementById('alab').textContent = `${s.sym} — ${label.name}`;
}

function stitchLabel(s) {
  if (S.mode !== 'crochet') return { name: s.name, abbr: s.abbr };
  return CROCHET_TERMS[S.crochetTerms]?.[s.id] || { name: s.name, abbr: s.abbr };
}

function keyboardCellKey() {
  clampKeyboardCell();
  return S.gridType === 'square'
    ? `sq:${_keyboardCell.row},${_keyboardCell.col}`
    : `hex:${_keyboardCell.col},${_keyboardCell.row}`;
}

function describeCellForStatus(key) {
  const cell = S.cells[key];
  if (!cell) return 'empty';
  const stitch = CS[S.mode].find(s => s.id === cell.stitchId);
  const label = stitch ? stitchLabel(stitch) : { name: cell.stitchId || 'unknown stitch' };
  return `${label.name}, colour ${cell.color}`;
}

function updateCanvasStatus(prefix = '') {
  const status = document.getElementById('canvasStatus');
  if (!status) return;
  clampKeyboardCell();
  const row = _keyboardCell.row + 1;
  const col = _keyboardCell.col + 1;
  const cellType = S.gridType === 'square' ? 'cell' : 'hex';
  const state = describeCellForStatus(keyboardCellKey());
  const lead = prefix ? prefix + '. ' : '';
  status.textContent = `${lead}${cellType} row ${row}, column ${col}: ${state}.`;
}

// ── State setters ──
function setStitch(id) { S.activeStitch = id; renderStitches(); updateIndicator(); scheduleAutosave(); }
function setColor(c) {
  S.activeColor = c;
  const customColor = document.getElementById('customColor');
  if (customColor) customColor.value = c;
  renderPalette(); updateIndicator(); scheduleAutosave();
}

function setMode(mode) {
  S.mode = mode; S.activeStitch = mode === 'crochet' ? 'dc' : 'k';
  const tabs = document.getElementById('modeTab').querySelectorAll('button');
  setPressed(tabs[0], mode === 'crochet');
  setPressed(tabs[1], mode === 'knit');
  const b = document.getElementById('modeBadge');
  b.textContent = mode === 'crochet' ? 'Crochet' : 'Knitting';
  b.className = 'badge ' + (mode === 'crochet' ? 'crochet-badge' : 'knit-badge');
  updateTerminologyUI();
  renderStitches(); renderPresets(); updateIndicator(); updateLegend();
  scheduleAutosave();
}

function setGridType(type) {
  S.gridType = type;
  const tabs = document.getElementById('gridTab').querySelectorAll('button');
  setPressed(tabs[0], type === 'square');
  setPressed(tabs[1], type === 'hex');
  document.getElementById('sqControls').hidden = type !== 'square';
  document.getElementById('hexControls').hidden = type !== 'hex';
  const gb = document.getElementById('gridBadge');
  gb.textContent = type === 'hex' ? 'Hex Grid' : 'Square Grid';
  gb.className = 'badge ' + (type === 'hex' ? 'hex-badge' : 'sq-badge');
  // Gauge, cables, and underlay only meaningful on square grid.
  document.getElementById('gaugeRow').hidden = type !== 'square';
  const cablesPanel = document.getElementById('cablesPanel');
  if (cablesPanel) cablesPanel.hidden = type !== 'square';
  const underlayPanel = document.getElementById('underlayPanel');
  if (underlayPanel) underlayPanel.hidden = type !== 'square';
  // Switching to hex while a cable type is selected — clear it.
  if (type !== 'square' && S.activeCable) { S.activeCable = null; renderCables(); }
  if (document.getElementById('grannyPanel').classList.contains('vis')) onGStyleChange();
  draw(); updateStats();
  toast(type === 'hex' ? 'Hex grid — tap hexagons to paint!' : 'Square grid active');
  scheduleAutosave();
}

function setTool(t) {
  S.tool = t;
  document.querySelectorAll('.tbtn[id^="tool-"]').forEach(b => setPressed(b, false));
  setPressed(document.getElementById('tool-' + t), true);
  // Visually swap canvas cursor for the Pan tool.
  document.getElementById('cw').classList.toggle('tool-pan', t === 'pan');
  // Switching away from the repeat tool drops any half-built region.
  if (t !== 'repeat' && _repeatAnchor) {
    _repeatAnchor = null;
    draw();
  }
}

function setCrochetTerms(term) {
  S.crochetTerms = term === 'uk' ? 'uk' : 'us';
  updateTerminologyUI();
  renderStitches(); updateIndicator(); updateLegend();
  toast(S.crochetTerms === 'uk' ? 'UK crochet terms active' : 'US crochet terms active');
  scheduleAutosave();
}

function updateTerminologyUI() {
  const row = document.getElementById('termRow');
  if (!row) return;
  row.hidden = S.mode !== 'crochet';
  setPressed(document.getElementById('termUS'), S.crochetTerms !== 'uk');
  setPressed(document.getElementById('termUK'), S.crochetTerms === 'uk');
}

function setHexOrient(o) {
  const centerCell = (S.gridType === 'hex' && canvas)
    ? hexAtPoint(canvas.width / 2 - S.panX, canvas.height / 2 - S.panY, S.hexSize, S.hexFlat, S.hexCols, S.hexRows)
    : null;
  S.hexFlat = (o === 'flat');
  if (centerCell && canvas) {
    const [cx, cy] = hexCenter(centerCell.col, centerCell.row, S.hexSize, S.hexFlat);
    S.panX = canvas.width / 2 - cx;
    S.panY = canvas.height / 2 - cy;
  }
  setPressed(document.getElementById('hFlat'), S.hexFlat);
  setPressed(document.getElementById('hPointy'), !S.hexFlat);
  draw(); updateStats();
  scheduleAutosave();
}

function applySqSize() {
  const newW = Math.max(1, Math.min(9999, parseInt(document.getElementById('sqW').value) || 200));
  const newH = Math.max(1, Math.min(9999, parseInt(document.getElementById('sqH').value) || 200));
  document.getElementById('sqW').value = newW;
  document.getElementById('sqH').value = newH;
  const nc = {};
  Object.entries(S.cells).forEach(([k, v]) => {
    if (k.startsWith('sq:')) {
      const [, rc] = k.split(':'); const [r, c] = rc.split(',').map(Number);
      if (r < newH && c < newW) nc[k] = v;
    } else nc[k] = v;
  });
  S.cells = nc; S.sqW = newW; S.sqH = newH;
  markCellsDirty();
  updateStats(); draw(); toast(`Grid limit: ${newW} × ${newH}`); scheduleAutosave();
}

function applyCellSize() {
  S.cellSize = Math.max(4, Math.min(80, parseInt(document.getElementById('sqCell').value) || 26));
  document.getElementById('sqCell').value = S.cellSize;
  updateZoomLabel(); draw(); scheduleAutosave();
}

function applyHexSize() {
  S.hexCols = Math.max(1, Math.min(9999, parseInt(document.getElementById('hexCols').value) || 300));
  S.hexRows = Math.max(1, Math.min(9999, parseInt(document.getElementById('hexRows').value) || 300));
  S.hexSize  = Math.max(4, Math.min(80,  parseInt(document.getElementById('hexSize').value)  || 26));
  document.getElementById('hexCols').value = S.hexCols;
  document.getElementById('hexRows').value = S.hexRows;
  document.getElementById('hexSize').value  = S.hexSize;
  updateZoomLabel(); updateStats(); draw(); toast(`Hex size: ${S.hexSize}px`);
  scheduleAutosave();
}

function applyGauge() {
  const st = parseInt(document.getElementById('gaugeSt').value) || 0;
  const ro = parseInt(document.getElementById('gaugeRo').value) || 0;
  S.gaugeStitches = Math.max(0, Math.min(99, st));
  S.gaugeRows     = Math.max(0, Math.min(99, ro));
  document.getElementById('gaugeSt').value = S.gaugeStitches || '';
  document.getElementById('gaugeRo').value = S.gaugeRows || '';
  draw(); updateStats();
  if (S.gaugeStitches && S.gaugeRows) {
    toast(`Gauge ${S.gaugeStitches}×${S.gaugeRows} — cells aspect-corrected`);
  } else {
    toast('Gauge cleared — square cells');
  }
  scheduleAutosave();
}

// ── Panel collapse ──
let lpOpen = true, rpOpen = true;
let _lastPanelNarrow = null;

function applyPanelState() {
  const left = document.getElementById('leftPanel');
  const right = document.getElementById('rightPanel');
  const lpToggle = document.getElementById('lpToggle');
  const rpToggle = document.getElementById('rpToggle');
  left.classList.toggle('collapsed', !lpOpen);
  right.classList.toggle('collapsed', !rpOpen);
  left.setAttribute('aria-hidden', lpOpen ? 'false' : 'true');
  right.setAttribute('aria-hidden', rpOpen ? 'false' : 'true');
  if ('inert' in left) left.inert = !lpOpen;
  if ('inert' in right) right.inert = !rpOpen;
  lpToggle.classList.toggle('panel-open', lpOpen);
  rpToggle.classList.toggle('panel-open', rpOpen);
  lpToggle.textContent = lpOpen ? '‹' : '›';
  rpToggle.textContent = rpOpen ? '›' : '‹';
  lpToggle.setAttribute('aria-expanded', lpOpen ? 'true' : 'false');
  rpToggle.setAttribute('aria-expanded', rpOpen ? 'true' : 'false');
  lpToggle.setAttribute('aria-label', lpOpen ? 'Collapse left panel' : 'Expand left panel');
  rpToggle.setAttribute('aria-label', rpOpen ? 'Collapse right panel' : 'Expand right panel');
}

function syncResponsivePanels() {
  // matchMedia is missing in some test/embedding environments. Fall
  // back to comparing innerWidth so init never crashes on it.
  let isNarrow;
  if (typeof window.matchMedia === 'function') {
    isNarrow = window.matchMedia('(max-width: 720px)').matches;
  } else {
    isNarrow = (window.innerWidth || 800) <= 720;
  }
  if (_lastPanelNarrow === isNarrow) return;
  _lastPanelNarrow = isNarrow;
  lpOpen = !isNarrow;
  rpOpen = !isNarrow;
  applyPanelState();
}

function toggleLP() {
  lpOpen = !lpOpen;
  applyPanelState();
}
function toggleRP() {
  rpOpen = !rpOpen;
  applyPanelState();
}

// ── Zoom ──
function adjZoom(delta) {
  if (S.gridType === 'square') {
    S.cellSize = Math.max(4, Math.min(80, Math.round(S.cellSize * (1 + delta))));
    document.getElementById('sqCell').value = S.cellSize;
  } else {
    S.hexSize = Math.max(4, Math.min(80, Math.round(S.hexSize * (1 + delta))));
    document.getElementById('hexSize').value = S.hexSize;
  }
  updateZoomLabel(); draw(); scheduleAutosave();
}

function updateZoomLabel() {
  const base = 26;
  const size = S.gridType === 'square' ? S.cellSize : S.hexSize;
  document.getElementById('zl').textContent = Math.round(size / base * 100) + '%';
}

function resetZoom() {
  S.panX = 0; S.panY = 0;
  if (S.gridType === 'square') { S.cellSize = 26; document.getElementById('sqCell').value = 26; }
  else { S.hexSize = 26; document.getElementById('hexSize').value = 26; }
  updateZoomLabel(); draw(); scheduleAutosave();
}

// ── Display toggles ──
function togGrid(on)    { S.showGrid    = on; setPressed(document.getElementById('gOn'), on); setPressed(document.getElementById('gOff'), !on); draw(); scheduleAutosave(); }
function togLabels(on)  { S.showLabels  = on; setPressed(document.getElementById('lOn'), on); setPressed(document.getElementById('lOff'), !on); draw(); scheduleAutosave(); }
function togSyms(on)    { S.showSyms    = on; setPressed(document.getElementById('sOn'), on); setPressed(document.getElementById('sOff'), !on); draw(); scheduleAutosave(); }
function togProtect(on) { S.protectFilled = on; setPressed(document.getElementById('pOn'), on); setPressed(document.getElementById('pOff'), !on); toast(on ? 'Filled cells need 2 clicks to overwrite' : 'Single-click overwrite enabled'); scheduleAutosave(); }
function togWS(on)      { S.shadeWS     = on; setPressed(document.getElementById('wsOn'), on); setPressed(document.getElementById('wsOff'), !on); draw(); scheduleAutosave(); }
function togFollow(on)  {
  if (on) {
    if (S.activeRow === null) S.activeRow = 0;
  } else {
    S.activeRow = null;
  }
  setPressed(document.getElementById('foOn'), on);
  setPressed(document.getElementById('foOff'), !on);
  draw();
  toast(on ? 'Follow mode — use ↑/↓ keys to step rows' : 'Follow mode off');
  scheduleAutosave();
}
function togStylus(on) {
  S.stylusMode = !!on;
  setPressed(document.getElementById('stOn'), on);
  setPressed(document.getElementById('stOff'), !on);
  toast(on ? 'Stylus mode — finger pans, pencil draws' : 'Stylus mode off');
  scheduleAutosave();
}

function stepRow(delta) {
  if (S.activeRow === null) return;
  const max = S.gridType === 'square' ? S.sqH - 1 : S.hexRows - 1;
  S.activeRow = Math.max(0, Math.min(max, S.activeRow + delta));
  draw();
  scheduleAutosave();
}

// ── TOAST ──
let toastT;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200);
}
