// ═══════════════════════════════════════════════════════════
// SAVE / LOAD / EXPORT / AUTOSAVE
// All persistence flows through localStorage. ss_patterns is the
// named library; ss_autosave_v1 holds the in-progress draft.
// ═══════════════════════════════════════════════════════════

const PROJECT_SCHEMA_VERSION = 1;
const PROJECT_APP_VERSION = '0.1.0';

function getSaved() {
  try { return JSON.parse(localStorage.getItem('ss_patterns') || '{}'); }
  catch { return {}; }
}

function snapshotState() {
  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    appVersion: PROJECT_APP_VERSION,
    cells: S.cells, mode: S.mode, gridType: S.gridType,
    crochetTerms: S.crochetTerms,
    name: document.getElementById('patName')?.value || 'My Pattern',
    activeColor: S.activeColor, activeStitch: S.activeStitch,
    sqW: S.sqW, sqH: S.sqH, cellSize: S.cellSize,
    hexCols: S.hexCols, hexRows: S.hexRows, hexSize: S.hexSize, hexFlat: S.hexFlat,
    gaugeStitches: S.gaugeStitches, gaugeRows: S.gaugeRows,
    showGrid: S.showGrid, showLabels: S.showLabels, showSyms: S.showSyms,
    protectFilled: S.protectFilled, shadeWS: S.shadeWS, activeRow: S.activeRow,
    palette: PALETTE.slice(),
    savedAt: new Date().toISOString(),
  };
}

function applyState(p) {
  S.cells = p.cells || {};
  S.mode = p.mode || 'crochet';
  S.crochetTerms = p.crochetTerms === 'uk' ? 'uk' : 'us';
  S.sqW = p.sqW || 200; S.sqH = p.sqH || 200;
  S.hexCols = p.hexCols || 300; S.hexRows = p.hexRows || 300;
  S.hexSize = p.hexSize || 26; S.hexFlat = p.hexFlat !== false;
  S.cellSize = p.cellSize || 26;
  S.gaugeStitches = p.gaugeStitches || 0;
  S.gaugeRows = p.gaugeRows || 0;
  S.showGrid = p.showGrid !== false;
  S.showLabels = p.showLabels !== false;
  S.showSyms = p.showSyms !== false;
  S.protectFilled = p.protectFilled !== false;
  S.shadeWS = !!p.shadeWS;
  S.activeRow = Number.isInteger(p.activeRow)
    ? Math.max(0, Math.min(S.sqH - 1, p.activeRow))
    : null;
  if (Array.isArray(p.palette) && p.palette.length) {
    PALETTE.length = 0;
    p.palette.forEach(c => PALETTE.push(c));
  }
  S.activeColor = p.activeColor || S.activeColor;
  S.activeStitch = CS[S.mode].some(s => s.id === p.activeStitch)
    ? p.activeStitch
    : (S.mode === 'crochet' ? 'dc' : 'k');
  // Flush DOM inputs
  document.getElementById('patName').value = p.name || 'My Pattern';
  document.getElementById('sqW').value = S.sqW;
  document.getElementById('sqH').value = S.sqH;
  document.getElementById('sqCell').value = S.cellSize;
  document.getElementById('hexCols').value = S.hexCols;
  document.getElementById('hexRows').value = S.hexRows;
  document.getElementById('hexSize').value = S.hexSize;
  if (document.getElementById('gaugeSt')) document.getElementById('gaugeSt').value = S.gaugeStitches || '';
  if (document.getElementById('gaugeRo')) document.getElementById('gaugeRo').value = S.gaugeRows || '';
  document.getElementById('gOn').classList.toggle('on', S.showGrid);
  document.getElementById('gOff').classList.toggle('on', !S.showGrid);
  document.getElementById('lOn').classList.toggle('on', S.showLabels);
  document.getElementById('lOff').classList.toggle('on', !S.showLabels);
  document.getElementById('sOn').classList.toggle('on', S.showSyms);
  document.getElementById('sOff').classList.toggle('on', !S.showSyms);
  document.getElementById('pOn').classList.toggle('on', S.protectFilled);
  document.getElementById('pOff').classList.toggle('on', !S.protectFilled);
  document.getElementById('wsOn').classList.toggle('on', S.shadeWS);
  document.getElementById('wsOff').classList.toggle('on', !S.shadeWS);
  document.getElementById('foOn').classList.toggle('on', S.activeRow !== null);
  document.getElementById('foOff').classList.toggle('on', S.activeRow === null);
  updateTerminologyUI();
  setMode(S.mode);
  setGridType(p.gridType || 'square');
  S.activeColor = p.activeColor || S.activeColor;
  S.activeStitch = CS[S.mode].some(s => s.id === p.activeStitch)
    ? p.activeStitch
    : S.activeStitch;
  renderStitches(); renderPalette(); updateIndicator(); updateLegend();
}

// ── AUTOSAVE ──
// Debounced; stores the full editable state (everything except undo
// stack) on every change. Restored on page load if present.
function scheduleAutosave() {
  if (_autosaveTimer) clearTimeout(_autosaveTimer);
  _autosaveTimer = setTimeout(() => {
    try { localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(snapshotState())); }
    catch (e) { /* quota — silent */ }
  }, 600);
}

function tryRestoreAutosave() {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return false;
    const p = JSON.parse(raw);
    if (!p || !p.cells) return false;
    applyState(p);
    return true;
  } catch { return false; }
}

// ── NAMED PATTERNS ──
function openSaveModal() {
  document.getElementById('saveName').value = document.getElementById('patName').value;
  document.getElementById('saveM').classList.add('open');
}
function doSave() {
  const name = document.getElementById('saveName').value.trim() || 'Untitled';
  document.getElementById('patName').value = name;
  const saved = getSaved();
  saved[name] = snapshotState();
  localStorage.setItem('ss_patterns', JSON.stringify(saved));
  closeM('saveM'); toast('Saved: ' + name);
}
function openLoadModal() {
  const saved = getSaved();
  const keys = Object.keys(saved).sort();
  const el = document.getElementById('savedList');
  el.innerHTML = keys.length === 0
    ? '<p style="font-size:12px;color:var(--text3);text-align:center;padding:18px">No saved patterns yet</p>'
    : keys.map(k => `<div class="sli" onclick="loadPat('${k.replace(/'/g, "\\'")}')">
        <div><div class="slin">${k}</div><div class="slim">${saved[k].mode} · ${saved[k].gridType || 'square'} · ${new Date(saved[k].savedAt).toLocaleDateString()}</div></div>
        <span class="slid" onclick="event.stopPropagation();deletePat('${k.replace(/'/g, "\\'")}')">✕</span>
      </div>`).join('');
  document.getElementById('loadM').classList.add('open');
}
function loadPat(name) {
  const p = getSaved()[name]; if (!p) return;
  applyState(p);
  document.getElementById('patName').value = name;
  closeM('loadM'); draw(); updateStats(); updateLegend(); toast('Loaded: ' + name);
}
function deletePat(name) {
  const s = getSaved(); delete s[name];
  localStorage.setItem('ss_patterns', JSON.stringify(s)); openLoadModal();
}
function openNewModal() { document.getElementById('newM').classList.add('open'); }
function doNew() {
  pushUndo();
  // Clear everything and reset to a fresh chart.
  S.cells = {};
  document.getElementById('patName').value = 'My Pattern';
  closeM('newM');
  draw(); updateStats(); updateLegend(); scheduleAutosave();
  toast('Fresh canvas!');
}
function closeM(id) { document.getElementById(id).classList.remove('open'); }

// ── PROJECT FILES ──
function safeFileStem(name) {
  return (name || 'stitch-studio')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'stitch-studio';
}

function exportProject() {
  const project = snapshotState();
  const payload = {
    app: 'Stitch Studio',
    appVersion: PROJECT_APP_VERSION,
    schemaVersion: PROJECT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    project,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = safeFileStem(project.name) + '.stitch-studio.json';
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  toast('Project exported');
}

function openProjectImport() {
  const input = document.getElementById('projectFile');
  input.value = '';
  input.click();
}

function normalizeProjectPayload(data) {
  const p = data && typeof data === 'object' && data.project ? data.project : data;
  if (!p || typeof p !== 'object') return null;
  if (!p.cells || typeof p.cells !== 'object' || Array.isArray(p.cells)) return null;
  if (p.mode && !CS[p.mode]) return null;
  if (p.gridType && !['square', 'hex'].includes(p.gridType)) return null;
  return p;
}

function importProjectFile(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const project = normalizeProjectPayload(JSON.parse(reader.result));
      if (!project) {
        toast('Import failed: not a Stitch Studio file');
        return;
      }
      pushUndo();
      applyState(project);
      draw(); updateStats(); updateLegend(); scheduleAutosave();
      toast('Project imported');
    } catch {
      toast('Import failed: invalid JSON');
    } finally {
      input.value = '';
    }
  };
  reader.onerror = () => {
    input.value = '';
    toast('Import failed: could not read file');
  };
  reader.readAsText(file);
}

// ── PNG EXPORT ──
function exportCanvas() {
  const scale = 2;
  const exp = document.createElement('canvas');
  const lo = S.showLabels ? 20 : 0;
  const ch = cellHeightSq();
  let W, H;
  if (S.gridType === 'square') {
    W = (lo + S.sqW * S.cellSize) * scale;
    H = (lo + S.sqH * ch) * scale;
  } else {
    const [x0, y0] = hexCenter(0, 0, S.hexSize, S.hexFlat);
    const [xN, yN] = hexCenter(S.hexCols - 1, S.hexRows - 1, S.hexSize, S.hexFlat);
    W = (xN - x0 + S.hexSize * 3 + lo) * scale;
    H = (yN - y0 + S.hexSize * 3 + lo) * scale;
  }
  exp.width = W; exp.height = H;
  const ec = exp.getContext('2d');
  ec.fillStyle = '#fff'; ec.fillRect(0, 0, W, H);
  ec.scale(scale, scale);

  const tmpDraw = (ectx) => {
    if (S.gridType === 'square') {
      const cs = S.cellSize;
      for (let r = 0; r < S.sqH; r++) for (let c = 0; c < S.sqW; c++) {
        const key = `sq:${r},${c}`, cell = S.cells[key];
        const x = lo + c * cs, y = lo + r * ch;
        if (cell) {
          if (cell.stitchId === '_no') {
            ectx.fillStyle = '#dcd5cb'; ectx.fillRect(x, y, cs, ch);
            ectx.strokeStyle = 'rgba(0,0,0,.2)'; ectx.lineWidth = 1;
            ectx.beginPath();
            ectx.moveTo(x + 4, y + 4); ectx.lineTo(x + cs - 4, y + ch - 4);
            ectx.moveTo(x + cs - 4, y + 4); ectx.lineTo(x + 4, y + ch - 4);
            ectx.stroke();
          } else {
            ectx.fillStyle = cell.color; ectx.fillRect(x, y, cs, ch);
          }
        }
      }
      if (S.showGrid) {
        ectx.strokeStyle = 'rgba(0,0,0,.12)'; ectx.lineWidth = .5;
        for (let r = 0; r <= S.sqH; r++) { ectx.beginPath(); ectx.moveTo(lo, lo + r * ch); ectx.lineTo(lo + S.sqW * cs, lo + r * ch); ectx.stroke(); }
        for (let c = 0; c <= S.sqW; c++) { ectx.beginPath(); ectx.moveTo(lo + c * cs, lo); ectx.lineTo(lo + c * cs, lo + S.sqH * ch); ectx.stroke(); }
      }
    } else {
      const rr = S.hexSize, flat = S.hexFlat;
      for (let row = 0; row < S.hexRows; row++) for (let col = 0; col < S.hexCols; col++) {
        const key = `hex:${col},${row}`, cell = S.cells[key];
        const [cx, cy] = hexCenter(col, row, rr, flat);
        const pts = hexCorners(cx, cy, rr * .97, flat);
        ectx.beginPath(); ectx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < 6; i++) ectx.lineTo(pts[i][0], pts[i][1]);
        ectx.closePath();
        if (cell) {
          if (cell.stitchId === '_no') { ectx.fillStyle = '#dcd5cb'; }
          else                          { ectx.fillStyle = cell.color; }
          ectx.fill();
        }
        if (S.showGrid) { ectx.strokeStyle = 'rgba(0,0,0,.13)'; ectx.lineWidth = .6; ectx.stroke(); }
      }
    }
  };
  tmpDraw(ec);
  const link = document.createElement('a');
  link.download = (document.getElementById('patName').value || 'pattern') + '.png';
  link.href = exp.toDataURL('image/png');
  link.click();
  toast('Exported!');
}
