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
  draw(); updateStats(); updateLegend(); scheduleAutosave();
}

function undoLast() {
  if (!undoStack.length) { toast('Nothing to undo'); return; }
  S.cells = JSON.parse(undoStack.pop());
  draw(); updateStats(); updateLegend(); toast('Undone'); scheduleAutosave();
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
