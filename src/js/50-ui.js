// ═══════════════════════════════════════════════════════════
// UI RENDERS, INDICATORS, TOGGLES
// Everything that pushes state → DOM lives here.
// ═══════════════════════════════════════════════════════════

function renderStitches() {
  const list = CS[S.mode];
  document.getElementById('stitchList').innerHTML = list.map(s => `
    <div class="sit ${S.activeStitch === s.id ? 'on' : ''}" onclick="setStitch('${s.id}')">
      <div class="ssym" style="${S.activeStitch === s.id ? 'background:' + s.col + ';color:#fff' : 'color:' + s.col}">${s.sym}</div>
      <span>${s.name}</span>
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
    h += `<div class="li"><div class="lsym">${s.sym}</div><div class="ls" style="background:${s.col}"></div><span>${s.abbr} — ${s.name}</span></div>`;
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
  document.getElementById('alab').textContent = s ? `${s.sym} — ${s.name}` : '';
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
  // Gauge controls only meaningful on square grid.
  document.getElementById('gaugeRow').style.display = type === 'square' ? '' : 'none';
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
  const isNarrow = window.matchMedia('(max-width: 720px)').matches;
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
