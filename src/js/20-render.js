// ═══════════════════════════════════════════════════════════
// CANVAS DRAW ENGINE
// No CSS zoom transform. "Zoom" = changing cellSize/hexSize.
// "Pan" = panX/panY, in pixels, applied as the grid origin offset.
// Only visible cells are iterated, so the logical grid can be huge.
// ═══════════════════════════════════════════════════════════

// ── PERF CACHES ──
// canvasToken() resolves CSS variables via getComputedStyle + a probe
// span. That cost adds up fast in the cell-render loop where the same
// token is queried per cell. We memoise resolutions for the duration
// of a draw frame (or an export) so each token resolves at most once.
let _tokenCache = null;
function beginTokenCache() { _tokenCache = Object.create(null); }
function endTokenCache()   { _tokenCache = null; }

// Per-row painted-cell counts for the row-label badges. Lazily built
// from S.cells; consumers must call markCellsDirty() after any change
// so the next read recomputes.
let _rowCountsCache = null;
let _rowCountsDirty = true;
function markCellsDirty() { _rowCountsDirty = true; }
function rowCountsForLabels() {
  if (!_rowCountsDirty && _rowCountsCache) return _rowCountsCache;
  const counts = Object.create(null);
  for (const k in S.cells) {
    // Match keys of the form "sq:<r>,<c>" without paying for split/regex.
    if (k.charCodeAt(0) !== 115 /* s */) continue;
    if (k.charCodeAt(1) !== 113 /* q */) continue;
    if (k.charCodeAt(2) !== 58  /* : */) continue;
    const cell = S.cells[k];
    if (!cell || cell.stitchId === '_no') continue;
    const comma = k.indexOf(',', 3);
    if (comma === -1) continue;
    const r = +k.slice(3, comma);
    counts[r] = (counts[r] || 0) + 1;
  }
  _rowCountsCache = counts;
  _rowCountsDirty = false;
  return counts;
}

// Effective cell height for square grids when gauge is set. Knit
// fabric is wider than tall; gaugeStitches=20, gaugeRows=28 → cells
// taller than wide by 28/20.
function cellHeightSq() {
  if (S.gaugeStitches > 0 && S.gaugeRows > 0) {
    return S.cellSize * (S.gaugeRows / S.gaugeStitches);
  }
  return S.cellSize;
}

function visibleSqBounds() {
  const cs = S.cellSize, ch = cellHeightSq();
  const lo = S.showLabels ? 20 : 0;
  const col0 = Math.floor(-S.panX / cs);
  const row0 = Math.floor(-S.panY / ch);
  const colN = col0 + Math.ceil((canvas.width  + lo) / cs) + 1;
  const rowN = row0 + Math.ceil((canvas.height + lo) / ch) + 1;
  return { col0: Math.max(0, col0), row0: Math.max(0, row0), colN, rowN };
}

function visibleHexBounds() {
  const r = S.hexSize, flat = S.hexFlat;
  const m = hexMetrics(r, flat);
  const col0 = Math.max(0, Math.floor(-S.panX / m.colStep) - 1);
  const row0 = Math.max(0, Math.floor(-S.panY / m.rowStep) - 1);
  const colN = col0 + Math.ceil(canvas.width  / m.colStep) + 3;
  const rowN = row0 + Math.ceil(canvas.height / m.rowStep) + 3;
  return { col0, row0, colN, rowN };
}

// rAF coalescing for hot input loops. Pointer/touch streams (paintAt drag,
// mouse/touch pan, pinch-zoom, held arrow keys) call scheduleDraw() instead
// of draw(). Multiple schedules in one frame collapse into one render.
// One-shot paths (clicks, taps, exports, undo, fills, repeats, swaps) still
// call draw() directly so the canvas is pixel-accurate the moment anything
// reads from it.
let _drawScheduled = false;
function scheduleDraw() {
  if (_drawScheduled) return;
  _drawScheduled = true;
  requestAnimationFrame(() => {
    _drawScheduled = false;
    draw();
  });
}

function draw() {
  beginTokenCache();
  try {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = canvasToken('--s2');
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (S.gridType === 'square') drawSquareGrid();
    else drawHexGrid();
    drawSelection();
  } finally {
    endTokenCache();
  }
}

// ── SELECTION RENDER ──
// Two layers, painted after every other chart content so they stay on
// top of cells, cables, repeats, and the keyboard cursor:
//   1. Cell tint — a translucent accent wash on every cell in the
//      selection. Reads at any zoom; doesn't fight cell colors.
//   2. Marching ants — a 1.5px dashed outline. For rectangles, traces
//      the bbox. For wand-shape selections, traces the actual
//      cell-boundary edges (so disjoint or concave regions look right).
function drawSelection() {
  // Draft marquee during a Select drag — show only the rectangle,
  // no fill, no committed cells.
  if (_selectionDraft && S.gridType === 'square') {
    drawDraftMarquee();
  }
  if (!_selection) return;
  const sel = _selection;
  if (sel.type === 'rect' && S.gridType !== 'square') return;
  drawSelectionTint(sel);
  if (sel.type === 'rect') drawRectMarchingAnts(sel.bbox);
  else drawWandMarchingAnts(sel.cells);
}

function selectionDashPhase() {
  // Slow march: 8px stride per second, paused under reduced-motion.
  const reduced = typeof matchMedia === 'function' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return 0;
  return (Date.now() / 125) % 12;
}

function drawSelectionTint(sel) {
  if (sel.type === 'rect') {
    // Compute the rectangle's pixel bounds directly from the bbox so we
    // don't iterate cells (much cheaper for big rectangles).
    if (S.gridType === 'square') {
      const cs = S.cellSize, ch = cellHeightSq();
      const lo = S.showLabels ? 20 : 0;
      const ox = S.panX + lo, oy = S.panY + lo;
      const x = ox + sel.bbox.c0 * cs;
      const y = oy + sel.bbox.r0 * ch;
      const w = (sel.bbox.c1 - sel.bbox.c0 + 1) * cs;
      const h = (sel.bbox.r1 - sel.bbox.r0 + 1) * ch;
      ctx.save();
      ctx.fillStyle = canvasToken('--accent');
      ctx.globalAlpha = 0.10;
      ctx.fillRect(x, y, w, h);
      ctx.restore();
    }
    return;
  }
  // Wand: paint each cell individually.
  ctx.save();
  ctx.fillStyle = canvasToken('--accent');
  ctx.globalAlpha = 0.10;
  if (S.gridType === 'square') {
    const cs = S.cellSize, ch = cellHeightSq();
    const lo = S.showLabels ? 20 : 0;
    const ox = S.panX + lo, oy = S.panY + lo;
    for (const key of sel.cells) {
      if (!key.startsWith('sq:')) continue;
      const [, rc] = key.split(':');
      const [r, c] = rc.split(',').map(Number);
      ctx.fillRect(ox + c * cs, oy + r * ch, cs, ch);
    }
  } else {
    const r = S.hexSize, flat = S.hexFlat;
    const ox = S.panX, oy = S.panY;
    for (const key of sel.cells) {
      if (!key.startsWith('hex:')) continue;
      const [, cc] = key.split(':');
      const [col, row] = cc.split(',').map(Number);
      const [cx, cy] = hexCenter(col, row, r, flat);
      const pts = hexCorners(cx, cy, r * 0.97, flat);
      ctx.beginPath();
      ctx.moveTo(pts[0][0] + ox, pts[0][1] + oy);
      for (let i = 1; i < 6; i++) ctx.lineTo(pts[i][0] + ox, pts[i][1] + oy);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawRectMarchingAnts(bbox) {
  if (S.gridType !== 'square') return;
  const cs = S.cellSize, ch = cellHeightSq();
  const lo = S.showLabels ? 20 : 0;
  const ox = S.panX + lo, oy = S.panY + lo;
  const x = ox + bbox.c0 * cs;
  const y = oy + bbox.r0 * ch;
  const w = (bbox.c1 - bbox.c0 + 1) * cs;
  const h = (bbox.r1 - bbox.r0 + 1) * ch;
  ctx.save();
  ctx.strokeStyle = canvasToken('--accent');
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.lineDashOffset = -selectionDashPhase();
  ctx.strokeRect(x + .5, y + .5, w - 1, h - 1);
  ctx.restore();
}

// Wand selection boundary — walk every cell in the set, draw only the
// edges whose neighbor is outside the set. Cheaper than marching-
// squares and produces the same visual result on cell grids.
function drawWandMarchingAnts(cellSet) {
  ctx.save();
  ctx.strokeStyle = canvasToken('--accent');
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.lineDashOffset = -selectionDashPhase();
  if (S.gridType === 'square') {
    const cs = S.cellSize, ch = cellHeightSq();
    const lo = S.showLabels ? 20 : 0;
    const ox = S.panX + lo, oy = S.panY + lo;
    for (const key of cellSet) {
      if (!key.startsWith('sq:')) continue;
      const [, rc] = key.split(':');
      const [r, c] = rc.split(',').map(Number);
      const x = ox + c * cs, y = oy + r * ch;
      // top edge
      if (!cellSet.has(`sq:${r-1},${c}`)) {
        ctx.beginPath(); ctx.moveTo(x, y + .5); ctx.lineTo(x + cs, y + .5); ctx.stroke();
      }
      // bottom edge
      if (!cellSet.has(`sq:${r+1},${c}`)) {
        ctx.beginPath(); ctx.moveTo(x, y + ch - .5); ctx.lineTo(x + cs, y + ch - .5); ctx.stroke();
      }
      // left edge
      if (!cellSet.has(`sq:${r},${c-1}`)) {
        ctx.beginPath(); ctx.moveTo(x + .5, y); ctx.lineTo(x + .5, y + ch); ctx.stroke();
      }
      // right edge
      if (!cellSet.has(`sq:${r},${c+1}`)) {
        ctx.beginPath(); ctx.moveTo(x + cs - .5, y); ctx.lineTo(x + cs - .5, y + ch); ctx.stroke();
      }
    }
  } else {
    // Hex outline: stroke each hex polygon individually. Cheap enough
    // for typical selection sizes; if a wand selection grows huge on a
    // dense hex grid this is the line to optimize.
    const r = S.hexSize, flat = S.hexFlat;
    const ox = S.panX, oy = S.panY;
    for (const key of cellSet) {
      if (!key.startsWith('hex:')) continue;
      const [, cc] = key.split(':');
      const [col, row] = cc.split(',').map(Number);
      const [cx, cy] = hexCenter(col, row, r, flat);
      const pts = hexCorners(cx, cy, r * 0.97, flat);
      ctx.beginPath();
      ctx.moveTo(pts[0][0] + ox, pts[0][1] + oy);
      for (let i = 1; i < 6; i++) ctx.lineTo(pts[i][0] + ox, pts[i][1] + oy);
      ctx.closePath();
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawDraftMarquee() {
  if (!_selectionDraft || S.gridType !== 'square') return;
  const cs = S.cellSize, ch = cellHeightSq();
  const lo = S.showLabels ? 20 : 0;
  const ox = S.panX + lo, oy = S.panY + lo;
  const a = _selectionDraft.startKey, b = _selectionDraft.endKey;
  if (!a || !b) return;
  const [, ar] = a.split(':'); const [ar0, ac0] = ar.split(',').map(Number);
  const [, br] = b.split(':'); const [br0, bc0] = br.split(',').map(Number);
  const r0 = Math.min(ar0, br0), r1 = Math.max(ar0, br0);
  const c0 = Math.min(ac0, bc0), c1 = Math.max(ac0, bc0);
  const x = ox + c0 * cs, y = oy + r0 * ch;
  const w = (c1 - c0 + 1) * cs, h = (r1 - r0 + 1) * ch;
  ctx.save();
  ctx.fillStyle = canvasToken('--accent');
  ctx.globalAlpha = 0.06;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = canvasToken('--accent');
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(x + .5, y + .5, w - 1, h - 1);
  ctx.restore();
}

// ── SQUARE ──
function drawSquareGrid() {
  const cs = S.cellSize;
  const ch = cellHeightSq();
  const lo = S.showLabels ? 20 : 0;
  const ox = S.panX + lo;
  const oy = S.panY + lo;

  const col0 = Math.max(0, Math.floor(-ox / cs));
  const row0 = Math.max(0, Math.floor(-oy / ch));
  const colN = Math.min(S.sqW, col0 + Math.ceil((canvas.width  - lo) / cs) + 2);
  const rowN = Math.min(S.sqH, row0 + Math.ceil((canvas.height - lo) / ch) + 2);

  // Grid background
  const gx = ox + col0 * cs, gy = oy + row0 * ch;
  ctx.fillStyle = canvasToken('--canvas-paper');
  ctx.fillRect(gx, gy, (colN - col0) * cs, (rowN - row0) * ch);

  // Image underlay (drawn behind cells so painted cells cover it
  // opaquely while empty cells let the picture show through).
  if (S.underlay) {
    if (!_underlayImg) {
      ensureUnderlayImg(); // loads async; redraws when ready
    } else {
      const u = S.underlay;
      const ux = ox + u.x * cs;
      const uy = oy + u.y * ch;
      const uw = u.w * cs;
      const uh = u.h * ch;
      ctx.save();
      ctx.globalAlpha = u.opacity;
      ctx.drawImage(_underlayImg, ux, uy, uw, uh);
      ctx.restore();
    }
  }

  // WS row shading. Knitters chart bottom-up; row 0 in the array is
  // the last row knit, so the displayed row label is (sqH - r) for
  // knit charts. WS rows are the ones whose label is even.
  if (S.shadeWS) {
    ctx.fillStyle = canvasToken('--canvas-ws-row');
    for (let r = row0; r < rowN; r++) {
      const labelRow = S.mode === 'knit' ? (S.sqH - r) : (r + 1);
      if (labelRow % 2 === 0) {
        ctx.fillRect(gx, oy + r * ch, (colN - col0) * cs, ch);
      }
    }
  }

  // Cells
  for (let r = row0; r < rowN; r++) for (let c = col0; c < colN; c++) {
    const key = `sq:${r},${c}`, cell = S.cells[key];
    const x = ox + c * cs, y = oy + r * ch;
    if (cell) {
      if (cell.stitchId === '_no') {
        ctx.fillStyle = canvasToken('--canvas-hole');
        ctx.fillRect(x, y, cs, ch);
        ctx.strokeStyle = canvasToken('--canvas-hole-stroke'); ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 4); ctx.lineTo(x + cs - 4, y + ch - 4);
        ctx.moveTo(x + cs - 4, y + 4); ctx.lineTo(x + 4, y + ch - 4);
        ctx.stroke();
      } else {
        ctx.fillStyle = cell.color;
        ctx.fillRect(x, y, cs, ch);
        if (S.showSyms && cs >= 14) drawSymbol(ctx, cell, x + cs / 2, y + ch / 2, Math.min(cs, ch));
      }
    }
  }

  // Cables — render after cells, before grid lines so the cross sits
  // on top of any fill but the grid tracery still shows through.
  if (S.cables && S.cables.length) {
    for (const cb of S.cables) {
      if (cb.r < row0 || cb.r >= rowN) continue;
      if (cb.c + cb.w <= col0 || cb.c >= colN) continue;
      drawCable(cb, ox, oy, cs, ch, ctx);
    }
  }

  // Repeat brackets render above cables.
  if (S.repeats && S.repeats.length) {
    for (const rp of S.repeats) {
      drawRepeatBracket(rp, ox, oy, cs, ch, ctx);
    }
  }
  // Repeat-tool anchor preview (first corner picked, awaiting second).
  if (S.tool === 'repeat' && _repeatAnchor) {
    const ax = ox + _repeatAnchor.c * cs;
    const ay = oy + _repeatAnchor.r * ch;
    ctx.save();
    ctx.strokeStyle = canvasToken('--rose');
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(ax + 1, ay + 1, cs - 2, ch - 2);
    ctx.restore();
  }

  // Active row highlight
  if (S.activeRow !== null && S.activeRow >= row0 && S.activeRow < rowN) {
    ctx.strokeStyle = canvasToken('--rose');
    ctx.lineWidth = 2.5;
    ctx.strokeRect(gx, oy + S.activeRow * ch, (colN - col0) * cs, ch);
  }

  drawKeyboardCursorSquare(ox, oy, cs, ch, row0, rowN, col0, colN);

  // Grid lines
  if (S.showGrid) {
    ctx.strokeStyle = canvasToken('--canvas-grid'); ctx.lineWidth = .5;
    for (let r = row0; r <= rowN; r++) {
      const y = oy + r * ch;
      ctx.beginPath(); ctx.moveTo(ox + col0 * cs, y); ctx.lineTo(ox + colN * cs, y); ctx.stroke();
    }
    for (let c = col0; c <= colN; c++) {
      const x = ox + c * cs;
      ctx.beginPath(); ctx.moveTo(x, oy + row0 * ch); ctx.lineTo(x, oy + rowN * ch); ctx.stroke();
    }
  }

  // Row/col labels (with per-row painted counts on square grids — useful
  // when knitting from a chart, especially on tablets with no hover).
  if (S.showLabels && lo > 0) {
    ctx.fillStyle = canvasToken('--canvas-ink-soft'); ctx.font = `9.5px ${CANVAS_FONT_STACK}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = canvasToken('--canvas-paper');
    ctx.fillRect(0, 0, lo, canvas.height);
    ctx.fillRect(0, 0, canvas.width, lo);
    // Pre-tally per-row stitch counts. Cached across draws so panning
    // and re-renders that don't touch cells don't re-walk the dict.
    const rowCounts = rowCountsForLabels();
    ctx.fillStyle = canvasToken('--canvas-ink-soft');
    for (let r = row0; r < rowN; r++) {
      const y = oy + r * ch + ch / 2;
      if (y <= 0 || y >= canvas.height) continue;
      const labelNum = S.mode === 'knit' ? (S.sqH - r) : (r + 1);
      const count = rowCounts[r] || 0;
      ctx.fillText(labelNum, lo / 2, y);
      // Count badge in lighter ink, tucked just below the row number
      // when the label strip is wide enough to fit it.
      if (count > 0 && lo >= 18 && ch >= 14) {
        ctx.save();
        ctx.fillStyle = canvasToken('--canvas-grid-strong');
        ctx.font = `8px ${CANVAS_FONT_STACK}`;
        ctx.fillText(count, lo / 2, y + ch / 2 - 4);
        ctx.restore();
      }
    }
    for (let c = col0; c < colN; c++) {
      const x = ox + c * cs + cs / 2;
      if (x > 0 && x < canvas.width) ctx.fillText(c + 1, x, lo / 2);
    }
  }
}

// ── HEX ──
function drawHexGrid() {
  const r = S.hexSize, flat = S.hexFlat;
  const ox = S.panX, oy = S.panY;
  const m = hexMetrics(r, flat);

  const col0 = Math.max(0, Math.floor(-ox / m.colStep) - 1);
  const row0 = Math.max(0, Math.floor(-oy / m.rowStep) - 1);
  const colN = Math.min(S.hexCols, col0 + Math.ceil(canvas.width  / m.colStep) + 3);
  const rowN = Math.min(S.hexRows, row0 + Math.ceil(canvas.height / m.rowStep) + 3);

  ctx.fillStyle = canvasToken('--canvas-paper');
  const [bx0, by0] = hexCenter(col0, row0, r, flat);
  const [bxN, byN] = hexCenter(colN - 1, rowN - 1, r, flat);
  ctx.fillRect(bx0 + ox - r, by0 + oy - r, (bxN - bx0) + r * 3, (byN - by0) + r * 3);

  for (let row = row0; row < rowN; row++) {
    for (let col = col0; col < colN; col++) {
      const key = `hex:${col},${row}`;
      const cell = S.cells[key];
      const [cx, cy] = hexCenter(col, row, r, flat);
      const scx = cx + ox, scy = cy + oy;
      if (scx + r < 0 || scx - r > canvas.width || scy + r < 0 || scy - r > canvas.height) continue;

      const pts = hexCorners(cx, cy, r * 0.97, flat);
      ctx.beginPath();
      ctx.moveTo(pts[0][0] + ox, pts[0][1] + oy);
      for (let i = 1; i < 6; i++) ctx.lineTo(pts[i][0] + ox, pts[i][1] + oy);
      ctx.closePath();

      if (cell && cell.stitchId === '_no') {
        ctx.fillStyle = canvasToken('--canvas-hole'); ctx.fill();
      } else {
        ctx.fillStyle = cell ? cell.color : canvasToken('--canvas-paper');
        ctx.fill();
        if (cell && S.showSyms && r >= 13) drawSymbol(ctx, cell, scx, scy, r * 1.2);
      }
      if (S.showGrid) {
        ctx.strokeStyle = canvasToken('--canvas-grid'); ctx.lineWidth = .6;
        ctx.stroke();
      }
    }
  }

  drawKeyboardCursorHex(ox, oy, row0, rowN, col0, colN);

  // Labels
  if (S.showLabels) {
    ctx.fillStyle = canvasToken('--canvas-ink-soft'); ctx.font = `9px ${CANVAS_FONT_STACK}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let row = row0; row < rowN; row++) {
      const [cx, cy] = hexCenter(col0, row, r, flat);
      const scy = cy + oy;
      if (scy > 0 && scy < canvas.height) ctx.fillText(row + 1, Math.max(cx + ox - r * 1.6, 10), scy);
    }
    for (let col = col0; col < colN; col++) {
      const [cx, cy] = hexCenter(col, row0, r, flat);
      const scx = cx + ox;
      if (scx > 0 && scx < canvas.width) ctx.fillText(col + 1, scx, Math.max(cy + oy - r * 1.5, 10));
    }
  }
}

function canvasToken(name, fallback) {
  if (_tokenCache && name in _tokenCache) return _tokenCache[name];
  const safeFallback = fallback || CSS_COLOR_FALLBACKS[name] || UI_COLORS.text;
  if (typeof getComputedStyle !== 'function') return safeFallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim() || safeFallback;
  const resolved = resolveCssColor(raw, safeFallback);
  if (_tokenCache) _tokenCache[name] = resolved;
  return resolved;
}

function resolveCssColor(raw, fallback) {
  if (typeof document === 'undefined' || !document.documentElement) return raw || fallback;
  const probe = resolveCssColor._probe || document.createElement('span');
  if (!resolveCssColor._probe) {
    resolveCssColor._probe = probe;
    probe.hidden = true;
    document.documentElement.appendChild(probe);
  }
  probe.style.color = '';
  probe.style.color = raw;
  if (!probe.style.color) return fallback;
  return getComputedStyle(probe).color || raw || fallback;
}

function shouldDrawKeyboardCursor() {
  return canvas && document.activeElement === canvas;
}

function drawKeyboardCursorSquare(ox, oy, cs, ch, row0, rowN, col0, colN) {
  if (!shouldDrawKeyboardCursor()) return;
  clampKeyboardCell();
  const r = _keyboardCell.row;
  const c = _keyboardCell.col;
  if (r < row0 || r >= rowN || c < col0 || c >= colN) return;
  const x = ox + c * cs;
  const y = oy + r * ch;
  ctx.save();
  ctx.strokeStyle = canvasToken('--canvas-paper');
  ctx.lineWidth = 4;
  ctx.strokeRect(x + 2, y + 2, cs - 4, ch - 4);
  ctx.strokeStyle = canvasToken('--accent');
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 3]);
  ctx.strokeRect(x + 2, y + 2, cs - 4, ch - 4);
  ctx.restore();
}

function drawKeyboardCursorHex(ox, oy, row0, rowN, col0, colN) {
  if (!shouldDrawKeyboardCursor()) return;
  clampKeyboardCell();
  const row = _keyboardCell.row;
  const col = _keyboardCell.col;
  if (row < row0 || row >= rowN || col < col0 || col >= colN) return;
  const [cx, cy] = hexCenter(col, row, S.hexSize, S.hexFlat);
  const pts = hexCorners(cx, cy, S.hexSize * 0.88, S.hexFlat);
  const strokePath = () => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0] + ox, pts[0][1] + oy);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] + ox, pts[i][1] + oy);
    ctx.closePath();
    ctx.stroke();
  };
  ctx.save();
  ctx.strokeStyle = canvasToken('--canvas-paper');
  ctx.lineWidth = 4;
  strokePath();
  ctx.strokeStyle = canvasToken('--accent');
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 3]);
  strokePath();
  ctx.restore();
}

function colorChannels(color) {
  if (typeof color !== 'string') return null;
  const raw = color.trim();
  if (raw[0] === '#') {
    const hex = raw.slice(1);
    if (hex.length === 3) {
      return hex.split('').map(ch => parseInt(ch + ch, 16));
    }
    if (hex.length >= 6) {
      return [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16));
    }
  }
  const match = raw.match(/rgba?\(([^)]+)\)/i);
  if (match) {
    const parts = match[1].split(',').map(part => parseFloat(part));
    if (parts.length >= 3 && parts.every((v, i) => i > 2 || Number.isFinite(v))) {
      return parts.slice(0, 3);
    }
  }
  return null;
}

function relativeLuminance(color) {
  const rgb = colorChannels(color);
  if (!rgb) return 0;
  const channel = value => {
    const c = Math.max(0, Math.min(255, value)) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const [r, g, b] = rgb.map(channel);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a, b) {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function symbolInkForColor(fill, darkInk = UI_COLORS.text, lightInk = UI_COLORS.surface) {
  return contrastRatio(fill, darkInk) >= contrastRatio(fill, lightInk) ? darkInk : lightInk;
}

function drawSymbol(ctx, cell, x, y, cs) {
  const s = CS[S.mode].find(s => s.id === cell.stitchId);
  if (!s) return;
  const darkInk = canvasToken('--canvas-ink');
  const lightInk = canvasToken('--canvas-paper');
  const ink = symbolInkForColor(cell.color, darkInk, lightInk);
  const outline = ink === darkInk ? lightInk : darkInk;
  ctx.font = `${Math.min(cs * .5, 13)}px ${CANVAS_FONT_STACK}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(1, Math.min(2.25, cs * 0.09));
  ctx.strokeStyle = outline;
  ctx.strokeText(s.sym, x, y);
  ctx.fillStyle = ink;
  ctx.fillText(s.sym, x, y);
}

// Draw a single cable record over the grid. The "front" half of the
// cross is drawn last with a thicker stroke; the "back" half is drawn
// first and gets a small gap at the crossover to imply going under.
//   dir = 'L' → left half passes IN FRONT going right
//   dir = 'R' → right half passes IN FRONT going left
// Takes the target ctx so the same fn can render to the on-screen
// canvas and to the export canvas.
function drawCable(cb, ox, oy, cs, ch, targetCtx) {
  const tctx = targetCtx || ctx;
  const x0 = ox + cb.c * cs;
  const y0 = oy + cb.r * ch;
  const w = cb.w * cs;
  const inset = Math.max(2, cs * 0.18);
  const cx = x0 + w / 2;
  const cy = y0 + ch / 2;

  // Optional band of cable colour, very faint, tying the cells together
  // visually without overpowering the underlying paint.
  tctx.fillStyle = cb.color;
  tctx.globalAlpha = 0.18;
  tctx.fillRect(x0 + 1, y0 + 1, w - 2, ch - 2);
  tctx.globalAlpha = 1;

  const tl = [x0 + inset, y0 + inset];
  const tr = [x0 + w - inset, y0 + inset];
  const bl = [x0 + inset, y0 + ch - inset];
  const br = [x0 + w - inset, y0 + ch - inset];

  const lineW = Math.max(1.4, Math.min(3, cs * 0.10));
  const lines = (cb.dir === 'L')
    ? { back: [tl, br], front: [bl, tr] }
    : { back: [bl, tr], front: [tl, br] };

  tctx.strokeStyle = darken(cb.color, 0.35);
  tctx.lineWidth = lineW;
  tctx.lineCap = 'round';
  drawSegmentWithGap(tctx, lines.back[0], lines.back[1], cs * 0.18);
  tctx.lineWidth = lineW * 1.2;
  tctx.beginPath();
  tctx.moveTo(lines.front[0][0], lines.front[0][1]);
  tctx.lineTo(lines.front[1][0], lines.front[1][1]);
  tctx.stroke();

  if (cb.w >= 4 && cs >= 16 && ch >= 16) {
    const half = cb.w / 2;
    const label = `${half}/${half}${cb.dir}`;
    tctx.font = `${Math.min(10, ch * 0.32)}px ${CANVAS_FONT_STACK}`;
    tctx.textAlign = 'center';
    tctx.textBaseline = 'top';
    tctx.fillStyle = darken(cb.color, 0.5);
    tctx.fillText(label, cx, y0 + 2);
  }
}

// Draw a single line from p0 to p1 but skip the middle segment
// of length 2*gap centred on the midpoint. Implies "passing under".
function drawSegmentWithGap(tctx, p0, p1, gap) {
  const [x0, y0] = p0, [x1, y1] = p1;
  const dx = x1 - x0, dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len;
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  const ax = mx - ux * gap, ay = my - uy * gap;
  const bx = mx + ux * gap, by = my + uy * gap;
  tctx.beginPath();
  tctx.moveTo(x0, y0); tctx.lineTo(ax, ay); tctx.stroke();
  tctx.beginPath();
  tctx.moveTo(bx, by); tctx.lineTo(x1, y1); tctx.stroke();
}

// Mix a hex colour toward black by `amount` (0..1).
function darken(hex, amount) {
  const r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);
  const f = 1 - amount;
  const toHex = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return '#' + toHex(r * f) + toHex(g * f) + toHex(b * f);
}

// Draw a repeat-region bracket. axis controls which sides get
// brackets:
//   'across' → top + bottom brackets (column-range repeat)
//   'down'   → left + right brackets (row-range repeat)
//   'both'   → all four sides (rare; for nested repeats)
// Brackets sit just outside the region with small inward-pointing
// turn-ins at each end, and a "×N" label sits at the top-right.
function drawRepeatBracket(rp, ox, oy, cs, ch, tctx) {
  const t = tctx || ctx;
  const x0 = ox + rp.c0 * cs;
  const y0 = oy + rp.r0 * ch;
  const x1 = ox + (rp.c1 + 1) * cs;
  const y1 = oy + (rp.r1 + 1) * ch;
  const PAD = Math.max(3, Math.min(cs, ch) * 0.18);
  const TURN = Math.max(4, Math.min(cs, ch) * 0.32);
  const STROKE = canvasToken('--rose');
  const LINEW = Math.max(1.6, Math.min(2.6, cs * 0.08));

  t.save();
  t.strokeStyle = STROKE;
  t.lineWidth = LINEW;
  t.lineCap = 'round';

  if (rp.axis === 'across' || rp.axis === 'both') {
    // Top bracket
    const ty = y0 - PAD;
    t.beginPath();
    t.moveTo(x0, ty + TURN);
    t.lineTo(x0, ty);
    t.lineTo(x1, ty);
    t.lineTo(x1, ty + TURN);
    t.stroke();
    // Bottom bracket
    const by = y1 + PAD;
    t.beginPath();
    t.moveTo(x0, by - TURN);
    t.lineTo(x0, by);
    t.lineTo(x1, by);
    t.lineTo(x1, by - TURN);
    t.stroke();
  }
  if (rp.axis === 'down' || rp.axis === 'both') {
    // Left bracket
    const lx = x0 - PAD;
    t.beginPath();
    t.moveTo(lx + TURN, y0);
    t.lineTo(lx, y0);
    t.lineTo(lx, y1);
    t.lineTo(lx + TURN, y1);
    t.stroke();
    // Right bracket
    const rx = x1 + PAD;
    t.beginPath();
    t.moveTo(rx - TURN, y0);
    t.lineTo(rx, y0);
    t.lineTo(rx, y1);
    t.lineTo(rx - TURN, y1);
    t.stroke();
  }

  // Count label sits just above the top-right corner of the bracket.
  const labelText = '×' + rp.count;
  const labelSize = Math.min(13, Math.max(10, cs * 0.42));
  t.font = `600 ${labelSize}px ${CANVAS_FONT_STACK}`;
  t.textAlign = 'right';
  t.textBaseline = 'bottom';
  t.fillStyle = STROKE;
  const lblY = (rp.axis === 'down') ? y0 - 2 : y0 - PAD - 2;
  t.fillText(labelText, x1, lblY);
  t.restore();
}

function lum(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255,
        g = parseInt(hex.slice(3, 5), 16) / 255,
        b = parseInt(hex.slice(5, 7), 16) / 255;
  return .2126 * r + .7152 * g + .0722 * b;
}
