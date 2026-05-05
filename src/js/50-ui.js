// ═══════════════════════════════════════════════════════════
// UI RENDERS, INDICATORS, TOGGLES
// Everything that pushes state → DOM lives here.
// ═══════════════════════════════════════════════════════════

function renderStitches() {
  const list = CS[S.mode];
  document.getElementById('stitchList').innerHTML = list.map(s => `
    <div class="sit ${S.activeStitch === s.id ? 'on' : ''}" onclick="setStitch('${s.id}')">
      <div class="ssym" style="${S.activeStitch === s.id ? 'background:' + s.col + ';color:#fff' : 'color:' + s.col}">${s.sym}</div>
      <span>${stitchLabel(s).name}</span>
    </div>`).join('');
}

function renderPalette() {
  document.getElementById('colorGrid').innerHTML =
    PALETTE.map(c => `<div class="csw ${S.activeColor === c ? 'on' : ''}" style="background:${c}" onclick="setColor('${c}')"></div>`).join('') +
    `<button class="cadd" onclick="document.getElementById('customColor').click()">+</button>`;
}

function renderPresets() {
  const ps = PRESETS_DEF[S.mode];
  document.getElementById('presetList').innerHTML = ps.map(p => `
    <div class="pit" onclick="${p.fn}()">${p.name}<span class="ptag">${S.mode}</span></div>`).join('');
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
  el.innerHTML =
    CABLE_TYPES.map(t =>
      `<button class="cab ${isOn(t) ? 'on' : ''}" onclick="setCable(${t.w},'${t.dir}')">${t.label}</button>`
    ).join('') +
    `<button class="cab cab-none" onclick="setCable(null)">No cable (single cells)</button>`;
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
    : Math.min(S.hexCols, Math.ceil(canvas.width / (S.hexSize * (S.hexFlat ? 1.5 : Math.sqrt(3)))) + 3);
  const visR = S.gridType === 'square'
    ? Math.min(S.sqH, Math.ceil((canvas.height - lo) / cellHeightSq()) + 1)
    : Math.min(S.hexRows, Math.ceil(canvas.height / (S.hexSize * (S.hexFlat ? Math.sqrt(3) : 1.5))) + 3);
  document.getElementById('sRows').textContent = visR;
  document.getElementById('sCols').textContent = visC;
  document.getElementById('sFill').textContent = Object.keys(S.cells).length;
}

function updateLegend() {
  const stitches = CS[S.mode];
  const used = {};
  Object.values(S.cells).forEach(c => { used[c.stitchId] = true; });
  const usedCols = [...new Set(Object.values(S.cells).map(c => c.color))];
  let h = '';
  stitches.filter(s => used[s.id]).forEach(s => {
    const label = stitchLabel(s);
    h += `<div class="li"><div class="lsym">${s.sym}</div><div class="ls" style="background:${s.col}"></div><span>${label.abbr} — ${label.name}</span></div>`;
  });
  // Color rows are clickable — click to swap that color for the active one.
  usedCols.forEach(c => {
    h += `<div class="li swap" onclick="swapColor('${c}')" title="Click to swap with active color">
            <div class="ls" style="background:${c};width:18px;height:13px"></div>
            <span style="font-size:9.5px">${c}</span>
          </div>`;
  });
  if (!h) h = '<span style="font-size:10.5px;color:var(--text3)">Draw to build legend</span>';
  document.getElementById('legend').innerHTML = h;
}

function updateIndicator() {
  const s = CS[S.mode].find(s => s.id === S.activeStitch);
  document.getElementById('adot').style.background = S.activeColor;
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

// ── State setters ──
function setStitch(id) { S.activeStitch = id; renderStitches(); updateIndicator(); scheduleAutosave(); }
function setColor(c)   { S.activeColor = c; renderPalette(); updateIndicator(); scheduleAutosave(); }

function setMode(mode) {
  S.mode = mode; S.activeStitch = mode === 'crochet' ? 'dc' : 'k';
  const tabs = document.getElementById('modeTab').querySelectorAll('button');
  tabs[0].classList.toggle('on', mode === 'crochet');
  tabs[1].classList.toggle('on', mode === 'knit');
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
  tabs[0].classList.toggle('on', type === 'square');
  tabs[1].classList.toggle('on', type === 'hex');
  document.getElementById('sqControls').style.display = type === 'square' ? 'flex' : 'none';
  document.getElementById('hexControls').style.display = type === 'hex' ? 'flex' : 'none';
  const gb = document.getElementById('gridBadge');
  gb.textContent = type === 'hex' ? 'Hex Grid' : 'Square Grid';
  gb.className = 'badge ' + (type === 'hex' ? 'hex-badge' : 'sq-badge');
  // Gauge controls and cables only meaningful on square grid.
  document.getElementById('gaugeRow').style.display = type === 'square' ? '' : 'none';
  const cablesPanel = document.getElementById('cablesPanel');
  if (cablesPanel) cablesPanel.style.display = type === 'square' ? '' : 'none';
  // Switching to hex while a cable type is selected — clear it.
  if (type !== 'square' && S.activeCable) { S.activeCable = null; renderCables(); }
  if (document.getElementById('grannyPanel').classList.contains('vis')) onGStyleChange();
  draw(); updateStats();
  toast(type === 'hex' ? 'Hex grid — tap hexagons to paint!' : 'Square grid active');
  scheduleAutosave();
}

function setTool(t) {
  S.tool = t;
  document.querySelectorAll('.tbtn').forEach(b => b.classList.remove('on'));
  document.getElementById('tool-' + t)?.classList.add('on');
  // Visually swap canvas cursor for the Pan tool.
  document.getElementById('cw').classList.toggle('tool-pan', t === 'pan');
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
  row.style.display = S.mode === 'crochet' ? 'flex' : 'none';
  document.getElementById('termUS').classList.toggle('on', S.crochetTerms !== 'uk');
  document.getElementById('termUK').classList.toggle('on', S.crochetTerms === 'uk');
}

function setHexOrient(o) {
  S.hexFlat = (o === 'flat');
  document.getElementById('hFlat').classList.toggle('on', S.hexFlat);
  document.getElementById('hPointy').classList.toggle('on', !S.hexFlat);
  draw();
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
  document.getElementById('leftPanel').classList.toggle('collapsed', !lpOpen);
  document.getElementById('rightPanel').classList.toggle('collapsed', !rpOpen);
  document.getElementById('lpToggle').textContent = lpOpen ? '‹' : '›';
  document.getElementById('rpToggle').textContent = rpOpen ? '›' : '‹';
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
  requestAnimationFrame(resize);
}
function toggleRP() {
  rpOpen = !rpOpen;
  applyPanelState();
  requestAnimationFrame(resize);
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
function togGrid(on)    { S.showGrid    = on; document.getElementById('gOn').classList.toggle('on', on); document.getElementById('gOff').classList.toggle('on', !on); draw(); scheduleAutosave(); }
function togLabels(on)  { S.showLabels  = on; document.getElementById('lOn').classList.toggle('on', on); document.getElementById('lOff').classList.toggle('on', !on); draw(); scheduleAutosave(); }
function togSyms(on)    { S.showSyms    = on; document.getElementById('sOn').classList.toggle('on', on); document.getElementById('sOff').classList.toggle('on', !on); draw(); scheduleAutosave(); }
function togProtect(on) { S.protectFilled = on; document.getElementById('pOn').classList.toggle('on', on); document.getElementById('pOff').classList.toggle('on', !on); toast(on ? 'Filled cells need 2 clicks to overwrite' : 'Single-click overwrite enabled'); scheduleAutosave(); }
function togWS(on)      { S.shadeWS     = on; document.getElementById('wsOn').classList.toggle('on', on); document.getElementById('wsOff').classList.toggle('on', !on); draw(); scheduleAutosave(); }
function togFollow(on)  {
  if (on) {
    if (S.activeRow === null) S.activeRow = 0;
  } else {
    S.activeRow = null;
  }
  document.getElementById('foOn').classList.toggle('on', on);
  document.getElementById('foOff').classList.toggle('on', !on);
  draw();
  toast(on ? 'Follow mode — use ↑/↓ keys to step rows' : 'Follow mode off');
  scheduleAutosave();
}
function togStylus(on) {
  S.stylusMode = !!on;
  document.getElementById('stOn').classList.toggle('on', on);
  document.getElementById('stOff').classList.toggle('on', !on);
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
