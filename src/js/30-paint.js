// ═══════════════════════════════════════════════════════════
// CELL HIT-DETECTION + PAINT/FILL/UNDO
// ═══════════════════════════════════════════════════════════

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

function pushUndo() {
  undoStack.push(JSON.stringify(S.cells));
  if (undoStack.length > MAX_UNDO) undoStack.shift();
}

function paintAt(ox, oy) {
  const cell = getCell(ox, oy);
  if (!cell) return;
  if (cell.key === lastKey) return;
  lastKey = cell.key;

  if (S.tool === 'eye') {
    const existing = S.cells[cell.key];
    if (existing) { setColor(existing.color); setStitch(existing.stitchId); }
    return;
  }
  if (S.tool === 'erase') {
    delete S.cells[cell.key];
  } else {
    const existing = S.cells[cell.key];
    // Protect-filled: don't overwrite already-coloured cells on a single
    // tap or while dragging. Use double-click (mouse) or double-tap
    // (touch) to deliberately overwrite.
    if (existing && S.protectFilled && S.tool === 'draw') return;
    S.cells[cell.key] = { color: S.activeColor, stitchId: S.activeStitch };
  }
  draw(); updateStats(); updateLegend(); scheduleAutosave();
}

function floodFill(ox, oy) {
  const cell = getCell(ox, oy);
  if (!cell) return;
  pushUndo();
  const orig = S.cells[cell.key];
  const origCol = orig?.color ?? null, origSt = orig?.stitchId ?? null;
  if (origCol === S.activeColor && origSt === S.activeStitch) return;

  const queue = [cell.key];
  const visited = new Set();

  function sqNeighbors(key) {
    const [, rc] = key.split(':'); const [r, c] = rc.split(',').map(Number);
    return [[r-1,c],[r+1,c],[r,c-1],[r,c+1]]
      .filter(([r2,c2]) => r2>=0 && c2>=0 && r2<S.sqH && c2<S.sqW)
      .map(([r2,c2]) => `sq:${r2},${c2}`);
  }
  function hexNeighbors(key) {
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
  const getNeighbors = S.gridType === 'square' ? sqNeighbors : hexNeighbors;

  while (queue.length) {
    const k = queue.shift();
    if (visited.has(k)) continue;
    visited.add(k);
    const c = S.cells[k];
    const cCol = c?.color ?? null, cSt = c?.stitchId ?? null;
    if (cCol !== origCol || cSt !== origSt) continue;
    S.cells[k] = { color: S.activeColor, stitchId: S.activeStitch };
    getNeighbors(k).forEach(n => { if (!visited.has(n)) queue.push(n); });
  }
  draw(); updateStats(); updateLegend(); scheduleAutosave();
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
  draw(); updateStats(); updateLegend(); scheduleAutosave();
  toast(`Swapped ${n} cells → active color`);
}
