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
    stylusMode: S.stylusMode,
    cables: (S.cables || []).slice(),
    repeats: (S.repeats || []).slice(),
    underlay: S.underlay ? { ...S.underlay } : null,
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
  S.stylusMode = !!p.stylusMode;
  // Cables: only accept records with the expected shape.
  S.cables = Array.isArray(p.cables)
    ? p.cables.filter(cb => Number.isInteger(cb.r) && Number.isInteger(cb.c)
        && Number.isInteger(cb.w) && (cb.dir === 'L' || cb.dir === 'R')
        && typeof cb.color === 'string')
    : [];
  S.activeCable = null;
  // Repeats: same defensive shape filter.
  S.repeats = Array.isArray(p.repeats)
    ? p.repeats.filter(rp =>
        Number.isInteger(rp.r0) && Number.isInteger(rp.r1)
        && Number.isInteger(rp.c0) && Number.isInteger(rp.c1)
        && Number.isInteger(rp.count) && rp.count >= 1
        && (rp.axis === 'across' || rp.axis === 'down' || rp.axis === 'both'))
    : [];
  _repeatAnchor = null;
  _repeatPendingRegion = null;
  // Underlay
  _underlayImg = null;
  if (p.underlay && typeof p.underlay === 'object'
      && typeof p.underlay.src === 'string'
      && Number.isFinite(p.underlay.w) && Number.isFinite(p.underlay.h)) {
    S.underlay = {
      src: p.underlay.src,
      x: Number(p.underlay.x) || 0,
      y: Number(p.underlay.y) || 0,
      w: Math.max(1, Number(p.underlay.w) || 1),
      h: Math.max(1, Number(p.underlay.h) || 1),
      opacity: Math.max(0, Math.min(1, Number(p.underlay.opacity) || 0.3)),
    };
  } else {
    S.underlay = null;
  }
  syncUnderlayUI();
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
  if (document.getElementById('stOn')) {
    document.getElementById('stOn').classList.toggle('on', S.stylusMode);
    document.getElementById('stOff').classList.toggle('on', !S.stylusMode);
  }
  updateTerminologyUI();
  setMode(S.mode);
  setGridType(p.gridType || 'square');
  S.activeColor = p.activeColor || S.activeColor;
  S.activeStitch = CS[S.mode].some(s => s.id === p.activeStitch)
    ? p.activeStitch
    : S.activeStitch;
  renderStitches(); renderPalette(); renderCables(); updateIndicator(); updateLegend();
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

// ── IMAGE UNDERLAY ──
// Lets the user load a reference image that renders behind the chart
// cells at low opacity so they can paint cells over the picture.
// Square grid only; the underlay's x/y/w/h are measured in chart cells
// so it scales naturally with cellSize zoom.

const UNDERLAY_MAX_BYTES = 2 * 1024 * 1024; // 2 MB after dataURL encode
const UNDERLAY_MAX_EDGE = 1500;             // px on the longer dimension

// Re-encode `img` as JPEG, optionally shrinking its longest side to
// maxEdge. Returns null if the image is already small and re-encoding
// is not forced.
function downsampleImage(img, maxEdge, forceReencode) {
  const longer = Math.max(img.width, img.height);
  if (longer <= maxEdge && !forceReencode) return null;
  const scale = Math.min(1, maxEdge / longer);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const cx = c.getContext('2d');
  cx.imageSmoothingQuality = 'high';
  cx.fillStyle = '#fff';
  cx.fillRect(0, 0, w, h);
  cx.drawImage(img, 0, 0, w, h);
  return c.toDataURL('image/jpeg', 0.85);
}

function loadUnderlay(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    toast('Pick an image file');
    input.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const originalUrl = reader.result;
    if (typeof originalUrl !== 'string') {
      toast('Could not read that image');
      input.value = '';
      return;
    }
    const probe = new Image();
    probe.onload = () => {
      // Re-encode images that are too large by dimensions or bytes;
      // otherwise keep the original dataURL.
      let finalUrl = originalUrl;
      const downsized = downsampleImage(
        probe,
        UNDERLAY_MAX_EDGE,
        originalUrl.length > UNDERLAY_MAX_BYTES
      );
      if (downsized) finalUrl = downsized;
      if (finalUrl.length > UNDERLAY_MAX_BYTES) {
        toast('Image is still too big after compression — try a simpler picture');
        input.value = '';
        return;
      }
      const finalImg = (finalUrl === originalUrl) ? probe : new Image();
      const finish = () => {
        pushUndo({ includeUnderlay: true });
        _underlayImg = finalImg;
        const ratio = finalImg.width / finalImg.height;
        let w = Math.min(60, S.sqW);
        let h = Math.max(1, Math.round(w / ratio));
        if (h > S.sqH) {
          h = Math.min(60, S.sqH);
          w = Math.max(1, Math.round(h * ratio));
        }
        S.underlay = {
          src: finalUrl,
          x: 0, y: 0, w, h,
          opacity: 0.3,
        };
        syncUnderlayUI();
        draw();
        scheduleAutosave();
        if (downsized) toast('Underlay loaded (resized for storage) — trace cells over it');
        else            toast('Underlay loaded — trace cells over it');
      };
      if (finalImg === probe) {
        finish();
      } else {
        finalImg.onload = finish;
        finalImg.onerror = () => toast('Could not finalise the underlay');
        finalImg.src = finalUrl;
      }
      input.value = '';
    };
    probe.onerror = () => { toast('Could not decode that image'); input.value = ''; };
    probe.src = originalUrl;
  };
  reader.onerror = () => { toast('Could not read that file'); input.value = ''; };
  reader.readAsDataURL(file);
}

function setUnderlayOpacity(v) {
  if (!S.underlay) return;
  S.underlay.opacity = Math.max(0, Math.min(1, (Number(v) || 0) / 100));
  draw();
  scheduleAutosave();
}

function updateUnderlayBounds() {
  if (!S.underlay) return;
  const x = Math.max(0, parseInt(document.getElementById('underlayX').value) || 0);
  const y = Math.max(0, parseInt(document.getElementById('underlayY').value) || 0);
  const w = Math.max(1, parseInt(document.getElementById('underlayW').value) || 1);
  const h = Math.max(1, parseInt(document.getElementById('underlayH').value) || 1);
  S.underlay.x = x; S.underlay.y = y;
  S.underlay.w = w; S.underlay.h = h;
  draw();
  scheduleAutosave();
}

function clearUnderlay() {
  pushUndo({ includeUnderlay: true });
  S.underlay = null;
  _underlayImg = null;
  syncUnderlayUI();
  draw();
  scheduleAutosave();
  toast('Underlay removed');
}

// Lazy-build the cached HTMLImageElement from the persisted dataURL.
// Called from the render path the first time the underlay is needed
// after a load/restore.
function ensureUnderlayImg() {
  if (!S.underlay || _underlayImg) return;
  const img = new Image();
  img.onload = () => { _underlayImg = img; draw(); };
  img.onerror = () => { /* ignore — keep empty */ };
  img.src = S.underlay.src;
}

// Reflect underlay state into the right-panel controls.
function syncUnderlayUI() {
  const ctrls = document.getElementById('underlayCtrls');
  if (!ctrls) return;
  if (!S.underlay) {
    ctrls.style.display = 'none';
    return;
  }
  ctrls.style.display = '';
  document.getElementById('underlayOpacity').value = Math.round((S.underlay.opacity || 0) * 100);
  document.getElementById('underlayX').value = S.underlay.x;
  document.getElementById('underlayY').value = S.underlay.y;
  document.getElementById('underlayW').value = S.underlay.w;
  document.getElementById('underlayH').value = S.underlay.h;
}

// ── PATTERN TEXT EXPORT ──
// Walks the square grid in pattern order (knit bottom-up, crochet
// top-down) and emits a row-by-row written description, grouping
// consecutive runs of identical (stitch, colour). Repeats, cables,
// and a legend are appended after the row list.
function generatePatternText() {
  if (S.gridType !== 'square') {
    return 'Pattern text export is square-grid only.\n\nSwitch to a square grid first.';
  }
  const lines = [];
  const title = (document.getElementById('patName').value || 'Untitled').trim();
  lines.push('# ' + title);
  lines.push('');

  const isKnit = S.mode === 'knit';
  const gauge = (S.gaugeStitches && S.gaugeRows)
    ? ' Gauge: ' + S.gaugeStitches + '×' + S.gaugeRows + ' per 4″.'
    : '';
  const terms = isKnit ? '' : ' ' + S.crochetTerms.toUpperCase() + ' terms.';
  lines.push((isKnit ? 'Knitting' : 'Crochet') + ' chart, ' + S.sqW + ' × ' + S.sqH + ' cells.' + gauge + terms);
  if (isKnit) {
    lines.push('Read bottom-up. RS rows worked right-to-left, WS rows left-to-right.');
  }
  lines.push('');

  // Determine the actually-painted bounding box so we don't dump
  // hundreds of empty rows for a small chart on a 200×200 grid.
  let minR = S.sqH, maxR = -1, minC = S.sqW, maxC = -1;
  for (const k in S.cells) {
    if (!k.startsWith('sq:')) continue;
    const [, rc] = k.split(':');
    const [r, c] = rc.split(',').map(Number);
    if (r < minR) minR = r; if (r > maxR) maxR = r;
    if (c < minC) minC = c; if (c > maxC) maxC = c;
  }
  if (maxR < 0) {
    lines.push('(Empty chart — paint some cells first.)');
    return lines.join('\n');
  }

  // Pattern row iteration order. Knit charts are read bottom-up, so
  // row label 1 is the highest array row index. Crochet keeps the
  // array order.
  const rowOrder = [];
  if (isKnit) {
    for (let r = maxR; r >= minR; r--) rowOrder.push(r);
  } else {
    for (let r = minR; r <= maxR; r++) rowOrder.push(r);
  }

  // Pre-compute legend-relevant sets while walking.
  const usedStitches = new Set();
  const usedColors = new Set();

  rowOrder.forEach(r => {
    const labelNum = isKnit ? (S.sqH - r) : (r + 1);
    // For knit, the chart label tells us the absolute row number.
    // RS rows are odd; WS rows are even. Pattern instructions are
    // written in the order knitted, so RS rows go right-to-left.
    const rs = !isKnit || (labelNum % 2 === 1);

    // Pattern instructions are written in the order knitted. For knit:
    //   RS rows are knit right-to-left → iterate maxC down to minC.
    //   WS rows are knit left-to-right → iterate minC up to maxC.
    // Crochet: write left-to-right always.
    const cols = [];
    if (isKnit && rs) {
      for (let c = maxC; c >= minC; c--) cols.push(c);
    } else {
      for (let c = minC; c <= maxC; c++) cols.push(c);
    }

    // Group consecutive runs of identical (stitch, color).
    const runs = [];
    for (const c of cols) {
      const cell = S.cells['sq:' + r + ',' + c];
      const stitch = cell ? cell.stitchId : null;
      const color = cell ? cell.color : null;
      if (cell) { usedStitches.add(stitch); if (color) usedColors.add(color); }
      const last = runs[runs.length - 1];
      if (last && last.stitch === stitch && last.color === color) last.n++;
      else runs.push({ stitch, color, n: 1 });
    }

    // Strip leading/trailing empty runs so a sparse chart doesn't
    // emit "(skip 50), dc, (skip 50)" garbage.
    while (runs.length && runs[0].stitch === null) runs.shift();
    while (runs.length && runs[runs.length - 1].stitch === null) runs.pop();
    if (!runs.length) return; // entirely empty row

    const rowKind = isKnit ? (rs ? ' (RS)' : ' (WS)') : '';
    const parts = runs.map(rn => {
      if (rn.stitch === null) return 'skip ' + rn.n;
      if (rn.stitch === '_no') return rn.n + ' no-stitch';
      const stitchInfo = CS[S.mode].find(s => s.id === rn.stitch);
      const label = stitchInfo ? stitchLabel(stitchInfo) : { abbr: rn.stitch };
      const count = rn.n > 1 ? ' ×' + rn.n : '';
      return label.abbr + count;
    });
    lines.push('Row ' + labelNum + rowKind + ': ' + parts.join(', '));
  });

  // Cables — group by row, sorted in pattern order.
  if (S.cables && S.cables.length) {
    const cables = S.cables.slice().sort((a, b) =>
      isKnit ? (b.r - a.r) || (a.c - b.c) : (a.r - b.r) || (a.c - b.c));
    lines.push('');
    lines.push('## Cables');
    cables.forEach(cb => {
      if (cb.color) usedColors.add(cb.color);
      const labelNum = isKnit ? (S.sqH - cb.r) : (cb.r + 1);
      const half = cb.w / 2;
      const dirText = cb.dir === 'L' ? 'left-cross' : 'right-cross';
      lines.push('- Row ' + labelNum + ', cols ' + (cb.c + 1) + '–' + (cb.c + cb.w) + ': ' + half + '/' + half + ' ' + dirText);
    });
  }

  // Repeats
  if (S.repeats && S.repeats.length) {
    lines.push('');
    lines.push('## Repeats');
    S.repeats.forEach(rp => {
      const r0Label = isKnit ? (S.sqH - rp.r1) : (rp.r0 + 1);
      const r1Label = isKnit ? (S.sqH - rp.r0) : (rp.r1 + 1);
      const axisText = rp.axis === 'across' ? 'columns' : (rp.axis === 'down' ? 'rows' : 'both');
      lines.push('- Rows ' + r0Label + '–' + r1Label + ', cols ' + (rp.c0 + 1) + '–' + (rp.c1 + 1)
        + ': repeat ×' + rp.count + ' (' + axisText + ')');
    });
  }

  // Legend
  lines.push('');
  lines.push('## Legend');
  CS[S.mode].filter(s => usedStitches.has(s.id)).forEach(s => {
    const label = stitchLabel(s);
    lines.push('- ' + label.abbr + ': ' + label.name);
  });
  if (usedColors.size) {
    lines.push('');
    lines.push('Colours used: ' + [...usedColors].join(', '));
  }

  return lines.join('\n');
}

function exportText() {
  const text = generatePatternText();
  document.getElementById('txtOut').value = text;
  document.getElementById('txtM').classList.add('open');
}

function copyPatternText() {
  const ta = document.getElementById('txtOut');
  ta.select();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(ta.value).then(
      () => toast('Copied to clipboard'),
      () => { try { document.execCommand('copy'); toast('Copied'); }
              catch { toast('Copy failed — select manually'); } }
    );
  } else {
    try { document.execCommand('copy'); toast('Copied'); }
    catch { toast('Copy failed — select manually'); }
  }
}

function downloadPatternText() {
  const text = document.getElementById('txtOut').value;
  const stem = safeFileStem(document.getElementById('patName').value || 'pattern');
  downloadBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }), stem + '.txt');
  toast('Text file downloaded');
}

// ── REPEAT MODAL ──
function openRepeatModal(r0, c0, r1, c1) {
  const cellsW = c1 - c0 + 1;
  const cellsH = r1 - r0 + 1;
  document.getElementById('repeatRegionLabel').textContent =
    `Region: rows ${r0 + 1}–${r1 + 1}, cols ${c0 + 1}–${c1 + 1} (${cellsW} × ${cellsH})`;
  document.getElementById('repeatCount').value = '2';
  // Reset axis toggle to default 'across'
  document.querySelectorAll('#repeatAxis button').forEach(b => {
    b.classList.toggle('on', b.dataset.axis === 'across');
  });
  document.getElementById('repeatM').classList.add('open');
}

function cancelRepeat() {
  _repeatPendingRegion = null;
  document.getElementById('repeatM').classList.remove('open');
  draw();
}

function doRepeat() {
  const region = _repeatPendingRegion;
  if (!region) { closeM('repeatM'); return; }
  const count = Math.max(1, Math.min(999, parseInt(document.getElementById('repeatCount').value) || 2));
  const onAxis = document.querySelector('#repeatAxis button.on');
  const axis = onAxis ? onAxis.dataset.axis : 'across';
  pushUndo();
  S.repeats.push({ ...region, count, axis });
  _repeatPendingRegion = null;
  closeM('repeatM');
  draw(); scheduleAutosave();
  toast(`Repeat ×${count} added`);
}
function doNew() {
  pushUndo({ includeUnderlay: true });
  // Clear everything and reset to a fresh chart.
  S.cells = {};
  S.cables = [];
  S.repeats = [];
  S.underlay = null;
  _underlayImg = null;
  _repeatAnchor = null;
  _repeatPendingRegion = null;
  document.getElementById('patName').value = 'My Pattern';
  syncUnderlayUI();
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

// ── PNG / PDF EXPORT ──
function buildExportCanvas(scale) {
  const exp = document.createElement('canvas');
  const lo = S.showLabels ? 20 : 0;
  const ch = cellHeightSq();
  let W, H;
  if (S.gridType === 'square') {
    W = (lo + S.sqW * S.cellSize) * scale;
    H = (lo + S.sqH * ch) * scale;
  } else {
    const first = hexCenter(0, 0, S.hexSize, S.hexFlat);
    const last = hexCenter(S.hexCols - 1, S.hexRows - 1, S.hexSize, S.hexFlat);
    W = (last[0] - first[0] + S.hexSize * 3 + lo) * scale;
    H = (last[1] - first[1] + S.hexSize * 3 + lo) * scale;
  }
  exp.width = W; exp.height = H;
  const ec = exp.getContext('2d');
  ec.fillStyle = '#fff'; ec.fillRect(0, 0, W, H);
  ec.scale(scale, scale);

  if (S.gridType === 'square') {
    const cs = S.cellSize;
    for (let r = 0; r < S.sqH; r++) for (let c = 0; c < S.sqW; c++) {
      const key = 'sq:' + r + ',' + c, cell = S.cells[key];
      const x = lo + c * cs, y = lo + r * ch;
      if (cell) {
        if (cell.stitchId === '_no') {
          ec.fillStyle = '#dcd5cb'; ec.fillRect(x, y, cs, ch);
          ec.strokeStyle = 'rgba(0,0,0,.2)'; ec.lineWidth = 1;
          ec.beginPath();
          ec.moveTo(x + 4, y + 4); ec.lineTo(x + cs - 4, y + ch - 4);
          ec.moveTo(x + cs - 4, y + 4); ec.lineTo(x + 4, y + ch - 4);
          ec.stroke();
        } else {
          ec.fillStyle = cell.color; ec.fillRect(x, y, cs, ch);
        }
      }
    }
    // Cables ride on top of cells in the export, just like on-canvas.
    if (S.cables && S.cables.length) {
      for (const cb of S.cables) {
        drawCable(cb, lo, lo, cs, ch, ec);
      }
    }
    // Repeat brackets render in the export too.
    if (S.repeats && S.repeats.length) {
      for (const rp of S.repeats) {
        drawRepeatBracket(rp, lo, lo, cs, ch, ec);
      }
    }
    if (S.showGrid) {
      ec.strokeStyle = 'rgba(0,0,0,.12)'; ec.lineWidth = .5;
      for (let r = 0; r <= S.sqH; r++) { ec.beginPath(); ec.moveTo(lo, lo + r * ch); ec.lineTo(lo + S.sqW * cs, lo + r * ch); ec.stroke(); }
      for (let c = 0; c <= S.sqW; c++) { ec.beginPath(); ec.moveTo(lo + c * cs, lo); ec.lineTo(lo + c * cs, lo + S.sqH * ch); ec.stroke(); }
    }
  } else {
    const rr = S.hexSize, flat = S.hexFlat;
    for (let row = 0; row < S.hexRows; row++) for (let col = 0; col < S.hexCols; col++) {
      const key = 'hex:' + col + ',' + row, cell = S.cells[key];
      const center = hexCenter(col, row, rr, flat);
      const pts = hexCorners(center[0], center[1], rr * .97, flat);
      ec.beginPath(); ec.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < 6; i++) ec.lineTo(pts[i][0], pts[i][1]);
      ec.closePath();
      if (cell) {
        ec.fillStyle = cell.stitchId === '_no' ? '#dcd5cb' : cell.color;
        ec.fill();
      }
      if (S.showGrid) { ec.strokeStyle = 'rgba(0,0,0,.13)'; ec.lineWidth = .6; ec.stroke(); }
    }
  }
  return exp;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function exportCanvas() {
  const exp = buildExportCanvas(2);
  const link = document.createElement('a');
  link.download = (document.getElementById('patName').value || 'pattern') + '.png';
  link.href = exp.toDataURL('image/png');
  link.click();
  toast('PNG exported');
}

function exportPDF() {
  const exp = buildExportCanvas(1);
  const jpeg = exp.toDataURL('image/jpeg', 0.92).split(',')[1];
  const imageBytes = base64ToBytes(jpeg);
  const pdf = makePdf(imageBytes, exp.width, exp.height);
  const name = safeFileStem(document.getElementById('patName').value || 'pattern') + '.pdf';
  downloadBlob(pdf, name);
  toast('PDF exported');
}

function base64ToBytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function pdfSafe(text) {
  return String(text)
    .replace(/[–—]/g, '-')
    .replace(/×/g, 'x')
    .replace(/[^ -~]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function pdfLegendLines() {
  const cells = Object.values(S.cells);
  const stitches = CS[S.mode];
  const usedStitches = [...new Set(cells.map(c => c.stitchId))]
    .map(id => stitches.find(s => s.id === id))
    .filter(Boolean);
  const usedColors = [...new Set(
    cells.map(c => c.color)
      .concat((S.cables || []).map(cb => cb.color))
      .filter(Boolean)
  )];
  const lines = [];
  lines.push('Stitches');
  if (usedStitches.length) {
    usedStitches.forEach(s => {
      const label = stitchLabel(s);
      lines.push(label.abbr + ' - ' + label.name);
    });
  } else {
    lines.push('No stitches used yet');
  }
  lines.push('Colors');
  if (usedColors.length) usedColors.forEach(c => lines.push(c));
  else lines.push('No colors used yet');
  return lines.slice(0, 28);
}

function makePdf(imageBytes, imageW, imageH) {
  const encoder = new TextEncoder();
  const chunks = [];
  const offsets = [0];
  let length = 0;
  const addBytes = (bytes) => { chunks.push(bytes); length += bytes.length; };
  const addAscii = (text) => addBytes(encoder.encode(text));
  const addObject = (num, bodyParts) => {
    offsets[num] = length;
    addAscii(num + ' 0 obj\n');
    bodyParts.forEach(part => typeof part === 'string' ? addAscii(part) : addBytes(part));
    addAscii('\nendobj\n');
  };

  const pageW = 612, pageH = 792, margin = 36;
  const maxW = pageW - margin * 2, maxH = 500;
  const scale = Math.min(maxW / imageW, maxH / imageH, 1);
  const drawW = imageW * scale, drawH = imageH * scale;
  const imageX = margin + (maxW - drawW) / 2;
  const imageY = Math.max(190, pageH - 110 - drawH);
  const title = document.getElementById('patName').value || 'Stitch Studio Chart';
  const terms = S.mode === 'crochet' ? ' - ' + S.crochetTerms.toUpperCase() + ' terms' : '';
  const gauge = S.gaugeStitches && S.gaugeRows ? ' - gauge ' + S.gaugeStitches + 'x' + S.gaugeRows + ' per 4 in' : '';
  const meta = (S.mode === 'crochet' ? 'Crochet' : 'Knitting') + terms + ' - ' + (S.gridType === 'hex' ? 'Hex grid' : 'Square grid') + gauge;
  const content = [];
  const text = (size, x, y, value) => content.push('BT /F1 ' + size + ' Tf ' + x.toFixed(2) + ' ' + y.toFixed(2) + ' Td (' + pdfSafe(value) + ') Tj ET\n');
  text(16, margin, pageH - 40, title);
  text(9, margin, pageH - 56, meta);
  text(8, margin, pageH - 70, 'Exported ' + new Date().toLocaleDateString());
  content.push('q ' + drawW.toFixed(2) + ' 0 0 ' + drawH.toFixed(2) + ' ' + imageX.toFixed(2) + ' ' + imageY.toFixed(2) + ' cm /Im0 Do Q\n');
  let y = imageY - 18;
  pdfLegendLines().forEach((line, idx) => {
    if (y < 28) return;
    text(idx === 0 || line === 'Colors' ? 10 : 8, margin, y, line);
    y -= idx === 0 || line === 'Colors' ? 13 : 10;
  });
  const contentBytes = encoder.encode(content.join(''));

  addAscii('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  addObject(1, ['<< /Type /Catalog /Pages 2 0 R >>']);
  addObject(2, ['<< /Type /Pages /Kids [3 0 R] /Count 1 >>']);
  addObject(3, ['<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + pageW + ' ' + pageH + '] /Resources << /XObject << /Im0 4 0 R >> /Font << /F1 5 0 R >> >> /Contents 6 0 R >>']);
  addObject(4, ['<< /Type /XObject /Subtype /Image /Width ' + imageW + ' /Height ' + imageH + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + imageBytes.length + ' >>\nstream\n', imageBytes, '\nendstream']);
  addObject(5, ['<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>']);
  addObject(6, ['<< /Length ' + contentBytes.length + ' >>\nstream\n', contentBytes, '\nendstream']);
  const xref = length;
  addAscii('xref\n0 7\n0000000000 65535 f \n');
  for (let i = 1; i <= 6; i++) addAscii(String(offsets[i]).padStart(10, '0') + ' 00000 n \n');
  addAscii('trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');
  return new Blob(chunks, { type: 'application/pdf' });
}
