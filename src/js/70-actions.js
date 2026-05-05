// ═══════════════════════════════════════════════════════════
// CANVAS-LEVEL ACTIONS — clear, undo, mirror
// ═══════════════════════════════════════════════════════════

function clearAll() {
  pushUndo();
  // Clear only the current grid type's cells; leave the other grid's
  // data alone so users can switch back to their hex chart later.
  const prefix = S.gridType === 'square' ? 'sq:' : 'hex:';
  const nc = {};
  Object.entries(S.cells).forEach(([k, v]) => { if (!k.startsWith(prefix)) nc[k] = v; });
  S.cells = nc;
  // Cables only exist on the square grid, so clear them on a square wipe.
  if (S.gridType === 'square') S.cables = [];
  draw(); updateStats(); updateLegend(); scheduleAutosave();
}

function undoLast() {
  if (!undoStack.length) { toast('Nothing to undo'); return; }
  redoStack.push(JSON.stringify(S.cells));
  if (redoStack.length > MAX_UNDO) redoStack.shift();
  S.cells = JSON.parse(undoStack.pop());
  draw(); updateStats(); updateLegend(); toast('Undone'); scheduleAutosave();
}

function redoLast() {
  if (!redoStack.length) { toast('Nothing to redo'); return; }
  // Pushing onto undoStack here would clear redoStack via pushUndo's
  // redo-branch-invalidation; do it manually to preserve the redo chain.
  undoStack.push(JSON.stringify(S.cells));
  if (undoStack.length > MAX_UNDO) undoStack.shift();
  S.cells = JSON.parse(redoStack.pop());
  draw(); updateStats(); updateLegend(); toast('Redone'); scheduleAutosave();
}

function mirrorH() {
  pushUndo();
  if (S.gridType === 'square') {
    const add = {};
    Object.entries(S.cells).forEach(([k, v]) => {
      if (!k.startsWith('sq:')) return;
      const [, rc] = k.split(':'); const [r, c] = rc.split(',').map(Number);
      add[`sq:${r},${S.sqW - 1 - c}`] = v;
    });
    Object.assign(S.cells, add);
    // Mirror cables: their start col flips, and so does the cross
    // direction (L↔R) since the visual cross also gets flipped.
    if (S.cables && S.cables.length) {
      const mirroredCables = S.cables.map(cb => ({
        ...cb,
        c: S.sqW - cb.c - cb.w,
        dir: cb.dir === 'L' ? 'R' : 'L',
      }));
      S.cables = S.cables.concat(mirroredCables);
    }
  } else {
    const add = {};
    Object.entries(S.cells).forEach(([k, v]) => {
      if (!k.startsWith('hex:')) return;
      const [, cc] = k.split(':'); const [col, row] = cc.split(',').map(Number);
      add[`hex:${S.hexCols - 1 - col},${row}`] = v;
    });
    Object.assign(S.cells, add);
  }
  draw(); updateStats(); updateLegend(); toast('Mirrored horizontally'); scheduleAutosave();
}

function mirrorV() {
  pushUndo();
  if (S.gridType === 'square') {
    const add = {};
    Object.entries(S.cells).forEach(([k, v]) => {
      if (!k.startsWith('sq:')) return;
      const [, rc] = k.split(':'); const [r, c] = rc.split(',').map(Number);
      add[`sq:${S.sqH - 1 - r},${c}`] = v;
    });
    Object.assign(S.cells, add);
    // Mirror cables: their row flips. Direction stays the same since
    // a vertical mirror doesn't change which strand goes in front.
    if (S.cables && S.cables.length) {
      const mirroredCables = S.cables.map(cb => ({
        ...cb,
        r: S.sqH - 1 - cb.r,
      }));
      S.cables = S.cables.concat(mirroredCables);
    }
  } else {
    const add = {};
    Object.entries(S.cells).forEach(([k, v]) => {
      if (!k.startsWith('hex:')) return;
      const [, cc] = k.split(':'); const [col, row] = cc.split(',').map(Number);
      add[`hex:${col},${S.hexRows - 1 - row}`] = v;
    });
    Object.assign(S.cells, add);
  }
  draw(); updateStats(); updateLegend(); toast('Mirrored vertically'); scheduleAutosave();
}
