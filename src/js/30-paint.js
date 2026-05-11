// ═══════════════════════════════════════════════════════════
// CELL HIT-DETECTION + PAINT/FILL/UNDO
// ═══════════════════════════════════════════════════════════

const FLOOD_FILL_EMPTY_CELL_LIMIT = 250000;

function getSquareCell(ox, oy) {
  const cs = S.cellSize, ch = cellHeightSq();
  const lo = S.showLabels ? 20 : 0;
  const c = Math.floor((ox - lo - S.panX) / cs);
  const r = Math.floor((oy - lo - S.panY) / ch);
  if (r < 0 || c < 0 || r >= S.sqH || c >= S.sqW) return null;
  return { key: `sq:${r},${c}`, r, c };
}

function getHexCell(ox, oy) {
  const px = ox - S.panX, py = oy - S.panY;
  const h = hexAtPoint(px, py, S.hexSize, S.hexFlat, S.hexCols, S.hexRows);
  if (!h) return null;
  return { key: `hex:${h.col},${h.row}`, col: h.col, row: h.row };
}

function getCell(ox, oy) {
  return S.gridType === 'square' ? getSquareCell(ox, oy) : getHexCell(ox, oy);
}

function snapshotUndoState(includeUnderlay) {
  const snap = {
    cells: S.cells,
    cables: (S.cables || []).slice(),
    repeats: (S.repeats || []).slice(),
  };
  // Underlays can be large data URLs, so only include them for
  // underlay-specific actions instead of every paint stroke.
  if (includeUnderlay) snap.underlay = S.underlay ? { ...S.underlay } : null;
  return JSON.stringify(snap);
}

function parseUndoState(raw) {
  const snap = JSON.parse(raw);
  if (snap && snap.cells && typeof snap.cells === 'object' && !Array.isArray(snap.cells)) return snap;
  // Backward-compatible fallback for older in-memory snapshots that
  // stored only the cells object.
  return { cells: snap || {}, cables: S.cables || [], repeats: S.repeats || [] };
}

function undoStateIncludesUnderlay(raw) {
  try {
    const snap = JSON.parse(raw);
    return !!snap && Object.prototype.hasOwnProperty.call(snap, 'underlay');
  } catch {
    return false;
  }
}

function restoreUndoState(raw) {
  const snap = parseUndoState(raw);
  S.cells = snap.cells || {};
  markCellsDirty();
  S.cables = Array.isArray(snap.cables) ? snap.cables : [];
  S.repeats = Array.isArray(snap.repeats) ? snap.repeats : [];
  if (Object.prototype.hasOwnProperty.call(snap, 'underlay')) {
    S.underlay = snap.underlay ? { ...snap.underlay } : null;
    _underlayImg = null;
    syncUnderlayUI();
  }
  _repeatAnchor = null;
  _repeatPendingRegion = null;
}

function pushUndo(opts = {}) {
  undoStack.push(snapshotUndoState(!!opts.includeUnderlay));
  if (undoStack.length > MAX_UNDO) undoStack.shift();
  // Any new edit invalidates the redo branch — same model as a text editor.
  redoStack.length = 0;
}

function paintAt(ox, oy) {
  const cell = getCell(ox, oy);
  if (!cell) return;
  if (cell.key === lastKey) return;
  lastKey = cell.key;

  if (S.tool === 'repeat') {
    handleRepeatTap(cell);
    return;
  }
  if (S.tool === 'eye') {
    const existing = S.cells[cell.key];
    if (existing) { setColor(existing.color); setStitch(existing.stitchId); }
    return;
  }
  if (S.tool === 'erase') {
    // If a cable covers this cell, clear the whole cable in one tap.
    if (S.gridType === 'square') {
      const [, rc] = cell.key.split(':');
      const [r, c] = rc.split(',').map(Number);
      const idx = S.cables.findIndex(cb => cb.r === r && c >= cb.c && c < cb.c + cb.w);
      if (idx !== -1) {
        S.cables.splice(idx, 1);
        scheduleDraw(); updateStats(); updateLegend(); scheduleAutosave();
        return;
      }
    }
    delete S.cells[cell.key];
  } else {
    // Cable placement, square grid only. Drag-painting does not place
    // multiple cables — once placed on this stroke, ignore further moves.
    if (S.activeCable && S.gridType === 'square' && S.tool === 'draw') {
      placeCableAt(cell.key);
      // Mark this stroke "done" so dragging across cells doesn't spam cables.
      lastKey = '__cable_placed__';
      scheduleDraw(); updateStats(); updateLegend(); scheduleAutosave();
      return;
    }
    const existing = S.cells[cell.key];
    // Protect-filled: don't overwrite already-coloured cells on a single
    // tap or while dragging. Use double-click (mouse) or double-tap
    // (touch) to deliberately overwrite.
    if (existing && S.protectFilled && S.tool === 'draw') return;
    S.cells[cell.key] = { color: S.activeColor, stitchId: S.activeStitch };
  }
  markCellsDirty();
  scheduleDraw(); updateStats(); updateLegend(); scheduleAutosave();
}

// Place a cable starting at the given square-grid cell key. Refuses
// silently with a toast if the cable would extend past the grid.
function placeCableAt(key) {
  if (!S.activeCable) return;
  const [, rc] = key.split(':');
  const [r, c] = rc.split(',').map(Number);
  const w = S.activeCable.w;
  const dir = S.activeCable.dir;
  if (c + w > S.sqW) { toast('Cable extends past the row. Move left.'); return; }
  if (r < 0 || r >= S.sqH) return;
  // Remove any existing cable that overlaps this one (same row, intersecting cols).
  S.cables = S.cables.filter(cb =>
    cb.r !== r || (cb.c + cb.w <= c) || (cb.c >= c + w));
  S.cables.push({ r, c, w, dir, color: S.activeColor });
}

// Cell neighbor lookups. Returns the in-bounds neighbor keys for a
// square or hex cell. Used by both flood-fill and magic-wand select.
function neighborsForKey(key) {
  if (key.startsWith('sq:')) {
    const [, rc] = key.split(':'); const [r, c] = rc.split(',').map(Number);
    return [[r-1,c],[r+1,c],[r,c-1],[r,c+1]]
      .filter(([r2,c2]) => r2>=0 && c2>=0 && r2<S.sqH && c2<S.sqW)
      .map(([r2,c2]) => `sq:${r2},${c2}`);
  }
  if (key.startsWith('hex:')) {
    const [, cc] = key.split(':'); const [col, row] = cc.split(',').map(Number);
    const flat = S.hexFlat;
    let neighbors;
    if (flat) {
      const parity = col % 2;
      neighbors = [[col+1,row+parity-1],[col+1,row+parity],[col,row-1],[col,row+1],[col-1,row+parity-1],[col-1,row+parity]];
    } else {
      const parity = row % 2;
      neighbors = [[col-1,row],[col+1,row],[col+parity-1,row-1],[col+parity,row-1],[col+parity-1,row+1],[col+parity,row+1]];
    }
    return neighbors
      .filter(([c2,r2]) => c2>=0 && r2>=0 && c2<S.hexCols && r2<S.hexRows)
      .map(([c2,r2]) => `hex:${c2},${r2}`);
  }
  return [];
}

// Generic flood: from `startKey`, walk neighbors and collect every key
// where `keep(key)` returns true. Used by floodFill (which then paints
// the collected cells) and by magic-wand select (which stores them as
// the selection). Returns a Set of keys.
function floodCells(startKey, keep) {
  const visited = new Set();
  const result = new Set();
  if (!keep(startKey)) return result;
  const queue = [startKey];
  let head = 0;
  while (head < queue.length) {
    const k = queue[head++];
    if (visited.has(k)) continue;
    visited.add(k);
    if (!keep(k)) continue;
    result.add(k);
    for (const n of neighborsForKey(k)) {
      if (!visited.has(n)) queue.push(n);
    }
  }
  return result;
}

function floodFill(ox, oy) {
  const cell = getCell(ox, oy);
  if (!cell) return;
  const orig = S.cells[cell.key];
  const origCol = orig?.color ?? null, origSt = orig?.stitchId ?? null;
  if (origCol === S.activeColor && origSt === S.activeStitch) return;
  const totalCells = S.gridType === 'square'
    ? S.sqW * S.sqH
    : S.hexCols * S.hexRows;
  if (!orig && totalCells > FLOOD_FILL_EMPTY_CELL_LIMIT) {
    toast('Fill is limited on very large empty grids. Paint a boundary or reduce the grid limit first.');
    return;
  }
  pushUndo();
  const region = floodCells(cell.key, (k) => {
    const c = S.cells[k];
    const cCol = c?.color ?? null, cSt = c?.stitchId ?? null;
    return cCol === origCol && cSt === origSt;
  });
  region.forEach(k => {
    S.cells[k] = { color: S.activeColor, stitchId: S.activeStitch };
  });
  markCellsDirty();
  draw(); updateStats(); updateLegend(); scheduleAutosave();
}

// Repeat-tool tap routing.
//   - Square grid only.
//   - First tap on empty area: store anchor.
//   - First tap inside an existing repeat: delete that repeat.
//   - Second tap: open the repeat modal with the rectangle defined.
function handleRepeatTap(cell) {
  if (S.gridType !== 'square') {
    toast('Repeats are square-grid only');
    return;
  }
  const [, rc] = cell.key.split(':');
  const [r, c] = rc.split(',').map(Number);

  // If this tap lands inside an existing repeat region and we have no
  // pending anchor, delete that repeat.
  if (!_repeatAnchor) {
    const idx = S.repeats.findIndex(rp =>
      r >= rp.r0 && r <= rp.r1 && c >= rp.c0 && c <= rp.c1);
    if (idx !== -1) {
      pushUndo();
      S.repeats.splice(idx, 1);
      draw(); scheduleAutosave();
      toast('Repeat removed');
      return;
    }
  }

  if (!_repeatAnchor) {
    _repeatAnchor = { r, c };
    draw();
    toast('First corner set. Tap the opposite corner.');
    return;
  }

  // Second tap: open modal with the region.
  const r0 = Math.min(_repeatAnchor.r, r);
  const r1 = Math.max(_repeatAnchor.r, r);
  const c0 = Math.min(_repeatAnchor.c, c);
  const c1 = Math.max(_repeatAnchor.c, c);
  _repeatPendingRegion = { r0, c0, r1, c1 };
  _repeatAnchor = null;
  draw();
  openRepeatModal(r0, c0, r1, c1);
}

// Replace every cell currently using `fromColor` with the active
// colour. Triggered by clicking a colour chip in the legend.
function swapColor(fromColor) {
  if (fromColor === S.activeColor) { toast('Active color matches that swatch'); return; }
  pushUndo();
  let n = 0;
  Object.keys(S.cells).forEach(k => {
    if (S.cells[k].color === fromColor) {
      S.cells[k] = { ...S.cells[k], color: S.activeColor };
      n++;
    }
  });
  let cn = 0;
  (S.cables || []).forEach(cb => {
    if (cb.color === fromColor) {
      cb.color = S.activeColor;
      cn++;
    }
  });
  // swapColor only changes cell.color, not stitch presence — row counts
  // don't change, but bumping the dirty flag is harmless and keeps the
  // invalidation contract simple.
  if (n) markCellsDirty();
  draw(); updateStats(); updateLegend(); scheduleAutosave();
  const parts = [];
  if (n || !cn) parts.push(n + ' cell' + (n === 1 ? '' : 's'));
  if (cn) parts.push(cn + ' cable' + (cn === 1 ? '' : 's'));
  toast('Swapped ' + parts.join(' + ') + ' to active color');
}

// ── REGION SELECTION COMMITS ──
// Each commit function assembles the cell key set and the bbox, then
// stores the result in _selection. They don't draw — that's the
// caller's job (typically setSelection or a verb).

// Compute the bounding box of a cell key Set. Returns null on empty.
function bboxOfCells(cellSet) {
  let r0 = Infinity, c0 = Infinity, r1 = -Infinity, c1 = -Infinity;
  for (const key of cellSet) {
    const [, rc] = key.split(':');
    const [a, b] = rc.split(',').map(Number);
    // sq:r,c (row first) vs hex:col,row (col first). bbox is in chart
    // coords regardless: first coord is the major axis (row for sq,
    // col for hex), second is the minor.
    if (a < r0) r0 = a; if (a > r1) r1 = a;
    if (b < c0) c0 = b; if (b > c1) c1 = b;
  }
  if (!isFinite(r0)) return null;
  return { r0, c0, r1, c1 };
}

// Enumerate every cell key inside an inclusive rectangle. Square-grid
// only — magic wand and Select-All-of-Color handle hex independently.
function rectCellKeys(r0, c0, r1, c1) {
  const set = new Set();
  const a0 = Math.max(0, Math.min(r0, r1));
  const a1 = Math.min(S.sqH - 1, Math.max(r0, r1));
  const b0 = Math.max(0, Math.min(c0, c1));
  const b1 = Math.min(S.sqW - 1, Math.max(c0, c1));
  for (let r = a0; r <= a1; r++) {
    for (let c = b0; c <= b1; c++) {
      set.add(`sq:${r},${c}`);
    }
  }
  return set;
}

function commitRectSelection(r0, c0, r1, c1) {
  if (S.gridType !== 'square') {
    toast('Rectangle select is square-grid only. Use magic-wand or pick a color from the legend.');
    return false;
  }
  const cells = rectCellKeys(r0, c0, r1, c1);
  const bbox = bboxOfCells(cells);
  if (!bbox) return false;
  setSelection({ type: 'rect', cells, bbox });
  return true;
}

function magicWandSelect(startKey) {
  const orig = S.cells[startKey];
  const origCol = orig?.color ?? null;
  const origSt  = orig?.stitchId ?? null;
  const cells = floodCells(startKey, (k) => {
    const c = S.cells[k];
    const cCol = c?.color ?? null, cSt = c?.stitchId ?? null;
    return cCol === origCol && cSt === origSt;
  });
  if (cells.size === 0) return false;
  const bbox = bboxOfCells(cells);
  setSelection({ type: 'wand', cells, bbox });
  return true;
}

function selectAllOfColor(color) {
  if (!color) return false;
  const cells = new Set();
  for (const [k, v] of Object.entries(S.cells)) {
    if (v && v.color === color) cells.add(k);
  }
  if (cells.size === 0) {
    toast('No cells of that colour to select.');
    return false;
  }
  const bbox = bboxOfCells(cells);
  setSelection({ type: 'wand', cells, bbox });
  return true;
}
