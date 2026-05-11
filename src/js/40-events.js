// ═══════════════════════════════════════════════════════════
// CANVAS EVENTS — mouse, touch, keyboard, wheel
// Wired up by main.js after the canvas exists.
// ═══════════════════════════════════════════════════════════

function clampKeyboardCell() {
  const maxCol = S.gridType === 'square' ? S.sqW - 1 : S.hexCols - 1;
  const maxRow = S.gridType === 'square' ? S.sqH - 1 : S.hexRows - 1;
  _keyboardCell.col = Math.max(0, Math.min(maxCol, _keyboardCell.col || 0));
  _keyboardCell.row = Math.max(0, Math.min(maxRow, _keyboardCell.row || 0));
}

function syncKeyboardCellFromPoint(ox, oy) {
  const cell = getCell(ox, oy);
  if (!cell) return;
  _keyboardCell = S.gridType === 'square'
    ? { row: cell.r, col: cell.c }
    : { row: cell.row, col: cell.col };
}

function keyboardCellCenter() {
  clampKeyboardCell();
  if (S.gridType === 'square') {
    const lo = S.showLabels ? 20 : 0;
    const cs = S.cellSize;
    const ch = cellHeightSq();
    return {
      x: S.panX + lo + _keyboardCell.col * cs + cs / 2,
      y: S.panY + lo + _keyboardCell.row * ch + ch / 2,
    };
  }
  const [cx, cy] = hexCenter(_keyboardCell.col, _keyboardCell.row, S.hexSize, S.hexFlat);
  return { x: cx + S.panX, y: cy + S.panY };
}

function ensureKeyboardCellVisible() {
  const margin = 42;
  const pt = keyboardCellCenter();
  let dx = 0, dy = 0;
  if (pt.x < margin) dx = margin - pt.x;
  else if (pt.x > canvas.width - margin) dx = canvas.width - margin - pt.x;
  if (pt.y < margin) dy = margin - pt.y;
  else if (pt.y > canvas.height - margin) dy = canvas.height - margin - pt.y;
  if (dx || dy) {
    S.panX += dx;
    S.panY += dy;
  }
}

function moveKeyboardCell(deltaCol, deltaRow) {
  _keyboardCell.col += deltaCol;
  _keyboardCell.row += deltaRow;
  clampKeyboardCell();
  ensureKeyboardCellVisible();
  scheduleDraw();
  updateCanvasStatus();
}

function applyKeyboardCell(forceErase = false) {
  if (!canvas) return;
  const pt = keyboardCellCenter();
  lastKey = null;
  if (forceErase) {
    const tool = S.tool;
    S.tool = 'erase';
    pushUndo();
    paintAt(pt.x, pt.y);
    S.tool = tool;
    draw();
    updateCanvasStatus('Cleared');
    canvas.focus({ preventScroll: true });
    return;
  }
  if (S.tool === 'pan') {
    toast('Choose Draw, Erase, Fill, or Pick to edit with the keyboard');
    return;
  }
  if (S.tool === 'eye') {
    paintAt(pt.x, pt.y);
  } else if (S.tool === 'fill') {
    floodFill(pt.x, pt.y);
  } else {
    pushUndo();
    paintAt(pt.x, pt.y);
  }
  updateCanvasStatus(S.tool === 'eye' ? 'Picked' : 'Updated');
  canvas.focus({ preventScroll: true });
}

function handleCanvasKeyboard(e) {
  const step = e.shiftKey ? 5 : 1;
  if (e.key === 'ArrowLeft')  { e.preventDefault(); moveKeyboardCell(-step, 0); return true; }
  if (e.key === 'ArrowRight') { e.preventDefault(); moveKeyboardCell(step, 0); return true; }
  if (e.key === 'ArrowUp')    { e.preventDefault(); moveKeyboardCell(0, -step); return true; }
  if (e.key === 'ArrowDown')  { e.preventDefault(); moveKeyboardCell(0, step); return true; }
  if (e.key === 'Home')       { e.preventDefault(); _keyboardCell.col = 0; ensureKeyboardCellVisible(); draw(); updateCanvasStatus(); return true; }
  if (e.key === 'End') {
    e.preventDefault();
    _keyboardCell.col = S.gridType === 'square' ? S.sqW - 1 : S.hexCols - 1;
    ensureKeyboardCellVisible();
    draw();
    updateCanvasStatus();
    return true;
  }
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); applyKeyboardCell(false); return true; }
  if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); applyKeyboardCell(true); return true; }
  return false;
}

// Commit the in-progress selection draft. If the user didn't drag to a
// different cell, treat it as a magic-wand tap; otherwise commit a
// rectangle from the two corners.
function finishSelectionDraft() {
  const draft = _selectionDraft;
  _selectionDraft = null;
  if (!draft) return;
  if (draft.startKey === draft.endKey) {
    // Tap with no drag — magic wand on that cell.
    if (S.gridType !== 'square') {
      // Hex grids: still allow magic wand, just no rectangle path.
      magicWandSelect(draft.startKey);
      return;
    }
    magicWandSelect(draft.startKey);
    return;
  }
  // Drag — commit rectangle. Square-grid only for now.
  const [, ar] = draft.startKey.split(':'); const [r0, c0] = ar.split(',').map(Number);
  const [, br] = draft.endKey.split(':');   const [r1, c1] = br.split(',').map(Number);
  commitRectSelection(r0, c0, r1, c1);
}

function selectEverything() {
  if (S.gridType === 'square') {
    commitRectSelection(0, 0, S.sqH - 1, S.sqW - 1);
  } else {
    const cells = new Set();
    for (let row = 0; row < S.hexRows; row++) {
      for (let col = 0; col < S.hexCols; col++) cells.add(`hex:${col},${row}`);
    }
    const bbox = bboxOfCells(cells);
    setSelection({ type: 'wand', cells, bbox });
  }
}

function bindCanvasEvents() {

  // The Pan tool (or held Space) takes precedence over the active tool.
  const isPanIntent = (e) => S.tool === 'pan' || _spaceHeld
    || (e && e.button === 1)
    || (e && e.button === 0 && e.altKey);

  canvas.addEventListener('mousedown', e => {
    canvas.focus({ preventScroll: true });
    syncKeyboardCellFromPoint(e.offsetX, e.offsetY);
    updateCanvasStatus();
    if (isPanIntent(e)) {
      isPan = true; panSt = { x: e.clientX, y: e.clientY };
      panOr = { x: S.panX, y: S.panY };
      document.getElementById('cw').classList.add('panning');
      return;
    }
    if (_pasteMode) {
      const cell = getCell(e.offsetX, e.offsetY);
      if (cell) performPasteAt(cell.key);
      return;
    }
    if (S.tool === 'select') {
      const cell = getCell(e.offsetX, e.offsetY);
      if (!cell) return;
      _selectionDraft = { startKey: cell.key, endKey: cell.key };
      scheduleDraw();
      return;
    }
    if (S.tool === 'fill') { floodFill(e.offsetX, e.offsetY); return; }
    pushUndo(); painting = true; lastKey = null;
    paintAt(e.offsetX, e.offsetY);
  });

  canvas.addEventListener('mousemove', e => {
    if (isPan) {
      S.panX = panOr.x + (e.clientX - panSt.x);
      S.panY = panOr.y + (e.clientY - panSt.y);
      scheduleDraw(); return;
    }
    if (_selectionDraft) {
      const cell = getCell(e.offsetX, e.offsetY);
      if (cell && cell.key !== _selectionDraft.endKey) {
        _selectionDraft.endKey = cell.key;
        scheduleDraw();
      }
      return;
    }
    if (painting) paintAt(e.offsetX, e.offsetY);
  });

  canvas.addEventListener('mouseup', () => {
    if (_selectionDraft) {
      finishSelectionDraft();
      return;
    }
    painting = false; isPan = false;
    document.getElementById('cw').classList.remove('panning');
  });
  canvas.addEventListener('mouseleave', () => {
    if (_selectionDraft) finishSelectionDraft();
    painting = false;
  });

  canvas.addEventListener('dblclick', e => {
    syncKeyboardCellFromPoint(e.offsetX, e.offsetY);
    const cell = getCell(e.offsetX, e.offsetY);
    if (!cell) return;
    const existing = S.cells[cell.key];
    if (!existing) return;
    pushUndo();
    if (existing.color === S.activeColor && existing.stitchId === S.activeStitch) {
      delete S.cells[cell.key];
    } else {
      S.cells[cell.key] = { color: S.activeColor, stitchId: S.activeStitch };
    }
    markCellsDirty();
    draw(); updateStats(); updateLegend(); scheduleAutosave();
  });

  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    adjZoom(delta);
  }, { passive: false });

  // Keyboard. Delegating to document so it fires regardless of focus.
  document.addEventListener('keydown', e => {
    const openHelp = document.querySelector('.help-drawer.open');
    if (openHelp && e.key === 'Escape') {
      e.preventDefault();
      closeHelpDrawer();
      return;
    }
    const openModal = document.querySelector('.mo.open');
    if (openModal) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeM(openModal.id);
      } else if (e.key === 'Tab') {
        trapModalFocus(e, openModal);
      }
      return;
    }
    if (e.target === canvas && handleCanvasKeyboard(e)) return;
    if (e.key === 'Escape') {
      // Esc clears a pending paste, then the selection if any.
      if (_pasteMode) { e.preventDefault(); cancelPasteMode(); return; }
      if (_selection)  { e.preventDefault(); clearSelection(); return; }
      return;
    }
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === ' ' && !_spaceHeld) {
      _spaceHeld = true; document.getElementById('cw').classList.add('tool-pan');
      e.preventDefault();
    }
    if (e.key === '?' || (e.key === '/' && e.shiftKey)) { e.preventDefault(); openHelpModal(); }
    if (e.key === '+' || e.key === '=') { e.preventDefault(); adjZoom(0.15); }
    if (e.key === '-' || e.key === '_') { e.preventDefault(); adjZoom(-0.15); }
    if (e.key === '0') { e.preventDefault(); resetZoom(); }
    if ((e.key === 'z' || e.key === 'Z') && (e.metaKey || e.ctrlKey) && !e.shiftKey) { e.preventDefault(); undoLast(); }
    if ((e.key === 'z' || e.key === 'Z') && (e.metaKey || e.ctrlKey) && e.shiftKey) { e.preventDefault(); redoLast(); }
    // Selection shortcuts: Cmd/Ctrl+A select all, Cmd/Ctrl+C copy,
    // Cmd/Ctrl+V paste. Cmd+A activates the Select tool first so the
    // action strip is visible.
    if ((e.key === 'a' || e.key === 'A') && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (S.tool !== 'select') setTool('select');
      selectEverything();
    }
    if ((e.key === 'c' || e.key === 'C') && (e.metaKey || e.ctrlKey) && _selection) {
      e.preventDefault();
      selStripCopy();
    }
    if ((e.key === 'v' || e.key === 'V') && (e.metaKey || e.ctrlKey) && _clipboard) {
      e.preventDefault();
      if (S.tool !== 'select') setTool('select');
      enterPasteMode();
    }
    if ((e.key === 'y' || e.key === 'Y') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); redoLast(); }
    // Follow-mode row stepping
    if (S.activeRow !== null) {
      if (e.key === 'ArrowUp')   { e.preventDefault(); stepRow(-1); }
      if (e.key === 'ArrowDown') { e.preventDefault(); stepRow(1); }
    }
  });
  document.addEventListener('keyup', e => {
    if (e.key === ' ') {
      _spaceHeld = false;
      const cw = document.getElementById('cw');
      cw.classList.toggle('tool-pan', S.tool === 'pan');
    }
  });

  // Apply Enter inside number inputs.
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const t = document.activeElement;
      if (t && t.classList.contains('ni')) {
        if (S.gridType === 'square') {
          if (t.id === 'sqCell') applyCellSize(); else applySqSize();
        } else {
          applyHexSize();
        }
        t.blur();
      }
    }
  });

  // Touch
  let touches = [];
  let touchPaintPending = null;
  const TOUCH_PAINT_THRESHOLD = 7;

  // Multi-finger tap gesture state. We watch the peak finger count
  // and total movement for the duration of the touch sequence; when
  // all fingers lift, a short, near-stationary 2-finger tap is undo,
  // and 3-finger tap is redo. Anything that drags or held too long
  // is treated as a normal pinch/pan and ignored.
  const MULTI_TAP_MS = 350;
  const MULTI_TAP_MAX_DRAG = 12;
  let gestureStartTime = 0;
  let gesturePeakFingers = 0;
  let gestureStartPositions = []; // [{x,y}, ...] indexed by finger
  let gestureMaxDrift = 0;

  function clearTouchPending() {
    touchPaintPending = null;
    document.getElementById('cw').classList.remove('touch-pending');
  }

  function beginTouchPaint(ox, oy) {
    if (painting) return;
    pushUndo(); painting = true; lastKey = null;
    paintAt(ox, oy);
  }

  function commitTouchPending() {
    if (!touchPaintPending) return;
    const p = touchPaintPending;
    clearTouchPending();
    if (S.tool === 'eye') {
      paintAt(p.ox, p.oy);
    } else {
      beginTouchPaint(p.ox, p.oy);
    }
  }

  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    touches = Array.from(e.touches);

    // Update multi-finger gesture state. If this is the very first
    // finger of a sequence, start the timer; otherwise just track the
    // peak. The decision about whether it was a tap is made at touchend.
    if (e.touches.length === 1 && gesturePeakFingers === 0) {
      gestureStartTime = Date.now();
      gestureMaxDrift = 0;
      gestureStartPositions = [];
    }
    gesturePeakFingers = Math.max(gesturePeakFingers, e.touches.length);
    // Snapshot starting positions for drift tracking. We append; older
    // fingers keep their start position so the drift check is honest.
    while (gestureStartPositions.length < e.touches.length) {
      const t = e.touches[gestureStartPositions.length];
      gestureStartPositions.push({ x: t.clientX, y: t.clientY });
    }

    if (touches.length === 1) {
      const r = canvas.getBoundingClientRect();
      const t = touches[0];
      const ox = t.clientX - r.left, oy = t.clientY - r.top;
      syncKeyboardCellFromPoint(ox, oy);
      updateCanvasStatus();

      // ── STYLUS / FINGER SPLIT ──
      // Safari iOS exposes Touch.touchType ('stylus' | 'direct'). On
      // first stylus contact, auto-enable stylusMode and tell the user.
      // When stylusMode is on: finger always pans, stylus always uses
      // the selected tool — regardless of the Pan tool selection.
      const isStylus = (t.touchType === 'stylus');
      if (isStylus && !_stylusSeenAuto && !S.stylusMode) {
        _stylusSeenAuto = true;
        S.stylusMode = true;
        if (document.getElementById('stOn')) {
          setPressed(document.getElementById('stOn'), true);
          setPressed(document.getElementById('stOff'), false);
        }
        toast('Stylus detected: finger pans, pencil draws.');
        scheduleAutosave();
      }
      if (S.stylusMode && !isStylus) {
        // Finger touch in stylus mode: force pan regardless of tool.
        clearTouchPending();
        isPan = true; panSt = { x: t.clientX, y: t.clientY };
        panOr = { x: S.panX, y: S.panY };
        document.getElementById('cw').classList.add('panning');
        return;
      }

      // One-finger pan when Pan tool is active.
      if (S.tool === 'pan') {
        clearTouchPending();
        isPan = true; panSt = { x: t.clientX, y: t.clientY };
        panOr = { x: S.panX, y: S.panY };
        document.getElementById('cw').classList.add('panning');
        return;
      }

      if (S.tool === 'fill') { clearTouchPending(); floodFill(ox, oy); return; }

      // Paste mode: tap places the clipboard top-left at the cell.
      if (_pasteMode) {
        clearTouchPending();
        const cell = getCell(ox, oy);
        if (cell) performPasteAt(cell.key);
        return;
      }

      // Select tool: start a draft marquee from this cell. touchmove
      // will grow it; touchend commits to rect-or-wand based on drag.
      if (S.tool === 'select') {
        clearTouchPending();
        const cell = getCell(ox, oy);
        if (!cell) return;
        _selectionDraft = { startKey: cell.key, endKey: cell.key };
        scheduleDraw();
        return;
      }

      // Touch double-tap mirrors mouse dblclick: deliberately overwrite
      // or clear a filled cell when protectFilled is on.
      const cell = getCell(ox, oy);
      const now = Date.now();
      const isDblTap = cell && _lastTapKey === cell.key && (now - _lastTapTime) < 450;
      _lastTapKey = cell ? cell.key : null;
      _lastTapTime = now;

      if (isDblTap && cell && S.tool === 'draw') {
        clearTouchPending();
        const existing = S.cells[cell.key];
        if (existing) {
          pushUndo();
          if (existing.color === S.activeColor && existing.stitchId === S.activeStitch) {
            delete S.cells[cell.key];
          } else {
            S.cells[cell.key] = { color: S.activeColor, stitchId: S.activeStitch };
          }
          draw(); updateStats(); updateLegend(); scheduleAutosave();
          painting = false; lastKey = cell.key;
          return;
        }
      }

      // Defer paint until touchend or a real drag. This keeps small finger
      // jitter from painting several cells when the user meant one tap.
      painting = false; lastKey = null;
      touchPaintPending = { ox, oy, clientX: t.clientX, clientY: t.clientY };
      document.getElementById('cw').classList.add('touch-pending');
      return;
    }

    if (touches.length === 2) {
      // Two-finger pinch zoom + pan.
      painting = false;
      clearTouchPending();
      t2ZoomSt = S.gridType === 'square' ? S.cellSize : S.hexSize;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      t2Start = Math.sqrt(dx * dx + dy * dy);
      panSt = { x: (touches[0].clientX + touches[1].clientX) / 2, y: (touches[0].clientY + touches[1].clientY) / 2 };
      panOr = { x: S.panX, y: S.panY };
    }
  }, { passive: false });

  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    touches = Array.from(e.touches);

    // Track how far each finger has drifted from its starting point.
    for (let i = 0; i < e.touches.length && i < gestureStartPositions.length; i++) {
      const t = e.touches[i];
      const s = gestureStartPositions[i];
      const d = Math.hypot(t.clientX - s.x, t.clientY - s.y);
      if (d > gestureMaxDrift) gestureMaxDrift = d;
    }

    if (touches.length === 1) {
      const t = touches[0];
      if (isPan) {
        S.panX = panOr.x + (t.clientX - panSt.x);
        S.panY = panOr.y + (t.clientY - panSt.y);
        scheduleDraw(); return;
      }
      const r = canvas.getBoundingClientRect();
      if (_selectionDraft) {
        const cell = getCell(t.clientX - r.left, t.clientY - r.top);
        if (cell && cell.key !== _selectionDraft.endKey) {
          _selectionDraft.endKey = cell.key;
          scheduleDraw();
        }
        return;
      }
      if (touchPaintPending) {
        const dx = t.clientX - touchPaintPending.clientX;
        const dy = t.clientY - touchPaintPending.clientY;
        if (Math.sqrt(dx * dx + dy * dy) >= TOUCH_PAINT_THRESHOLD) {
          const p = touchPaintPending;
          clearTouchPending();
          beginTouchPaint(p.ox, p.oy);
        }
      }
      if (painting) paintAt(t.clientX - r.left, t.clientY - r.top);
      return;
    }

    if (touches.length === 2 && t2Start) {
      clearTouchPending();
      painting = false;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scale = dist / t2Start;
      const newSize = Math.max(4, Math.min(80, Math.round(t2ZoomSt * scale)));
      if (S.gridType === 'square') {
        S.cellSize = newSize; document.getElementById('sqCell').value = newSize;
      } else {
        S.hexSize = newSize; document.getElementById('hexSize').value = newSize;
      }
      const mx = (touches[0].clientX + touches[1].clientX) / 2;
      const my = (touches[0].clientY + touches[1].clientY) / 2;
      S.panX = panOr.x + (mx - panSt.x);
      S.panY = panOr.y + (my - panSt.y);
      updateZoomLabel();
      scheduleDraw();
    }
  }, { passive: false });

  canvas.addEventListener('touchend', e => {
    e.preventDefault();

    if (e.touches.length === 0) {
      // The full sequence has ended. Check whether it was a multi-finger
      // tap that should map to undo/redo.
      const elapsed = Date.now() - gestureStartTime;
      const wasShortTap = elapsed > 0 && elapsed < MULTI_TAP_MS && gestureMaxDrift < MULTI_TAP_MAX_DRAG;
      if (wasShortTap && gesturePeakFingers === 2) {
        // Don't commit any pending paint or pinch-zoom side-effects.
        clearTouchPending();
        painting = false;
        // Roll back the cellSize change pinch may have applied early — it
        // only had time to apply if the user was actually pinching, which
        // wouldStill have crossed the drag threshold; skip for safety.
        undoLast();
      } else if (wasShortTap && gesturePeakFingers >= 3) {
        clearTouchPending();
        painting = false;
        redoLast();
      } else if (_selectionDraft) {
        // A select-tool drag-or-tap just ended. Commit as rectangle or
        // magic wand depending on whether the user actually dragged.
        finishSelectionDraft();
      } else {
        commitTouchPending();
      }
      // Reset gesture tracking.
      gesturePeakFingers = 0;
      gestureStartPositions = [];
      gestureMaxDrift = 0;
      gestureStartTime = 0;
    }

    painting = false; isPan = false; t2Start = null; touches = [];
    document.getElementById('cw').classList.remove('panning');
    if (e.touches.length === 0) clearTouchPending();
  }, { passive: false });

  // Modal close on overlay click
  document.querySelectorAll('.mo').forEach(o =>
    o.addEventListener('click', e => { if (e.target === o) closeM(o.id); }));
}
