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
  markCellsDirty();
  // Cables and repeats only exist on the square grid; wipe them too.
  if (S.gridType === 'square') {
    S.cables = [];
    S.repeats = [];
  }
  draw(); updateStats(); updateLegend(); scheduleAutosave();
}

function undoLast() {
  if (!undoStack.length) { toast('Nothing to undo'); return; }
  const prev = undoStack.pop();
  redoStack.push(snapshotUndoState(undoStateIncludesUnderlay(prev)));
  if (redoStack.length > MAX_UNDO) redoStack.shift();
  restoreUndoState(prev);
  draw(); updateStats(); updateLegend(); toast('Undone'); scheduleAutosave();
}

function redoLast() {
  if (!redoStack.length) { toast('Nothing to redo'); return; }
  const next = redoStack.pop();
  // Pushing onto undoStack here would clear redoStack via pushUndo's
  // redo-branch-invalidation; do it manually to preserve the redo chain.
  undoStack.push(snapshotUndoState(undoStateIncludesUnderlay(next)));
  if (undoStack.length > MAX_UNDO) undoStack.shift();
  restoreUndoState(next);
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
    // Mirror repeats: column range flips around the chart centre.
    if (S.repeats && S.repeats.length) {
      const mirrored = S.repeats.map(rp => ({
        ...rp,
        c0: S.sqW - 1 - rp.c1,
        c1: S.sqW - 1 - rp.c0,
      }));
      S.repeats = S.repeats.concat(mirrored);
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
  markCellsDirty();
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
    // Mirror repeats: row range flips around the chart centre.
    if (S.repeats && S.repeats.length) {
      const mirrored = S.repeats.map(rp => ({
        ...rp,
        r0: S.sqH - 1 - rp.r1,
        r1: S.sqH - 1 - rp.r0,
      }));
      S.repeats = S.repeats.concat(mirrored);
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
  markCellsDirty();
  draw(); updateStats(); updateLegend(); toast('Mirrored vertically'); scheduleAutosave();
}
