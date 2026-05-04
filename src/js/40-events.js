// ═══════════════════════════════════════════════════════════
// CANVAS EVENTS — mouse, touch, keyboard, wheel
// Wired up by main.js after the canvas exists.
// ═══════════════════════════════════════════════════════════

function bindCanvasEvents() {

  // The Pan tool (or held Space) takes precedence over the active tool.
  const isPanIntent = (e) => S.tool === 'pan' || _spaceHeld
    || (e && e.button === 1)
    || (e && e.button === 0 && e.altKey);

  canvas.addEventListener('mousedown', e => {
    if (isPanIntent(e)) {
      isPan = true; panSt = { x: e.clientX, y: e.clientY };
      panOr = { x: S.panX, y: S.panY };
      document.getElementById('cw').classList.add('panning');
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
      draw(); return;
    }
    if (painting) paintAt(e.offsetX, e.offsetY);
  });

  canvas.addEventListener('mouseup', () => {
    painting = false; isPan = false;
    document.getElementById('cw').classList.remove('panning');
  });
  canvas.addEventListener('mouseleave', () => { painting = false; });

  canvas.addEventListener('dblclick', e => {
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
    draw(); updateStats(); updateLegend(); scheduleAutosave();
  });

  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    adjZoom(delta);
  }, { passive: false });

  // Keyboard. Delegating to document so it fires regardless of focus.
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === ' ' && !_spaceHeld) {
      _spaceHeld = true; document.getElementById('cw').classList.add('tool-pan');
      e.preventDefault();
    }
    if (e.key === '+' || e.key === '=') { e.preventDefault(); adjZoom(0.15); }
    if (e.key === '-' || e.key === '_') { e.preventDefault(); adjZoom(-0.15); }
    if (e.key === '0') { e.preventDefault(); resetZoom(); }
    if ((e.key === 'z' || e.key === 'Z') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); undoLast(); }
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
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    touches = Array.from(e.touches);

    if (touches.length === 1) {
      const r = canvas.getBoundingClientRect();
      const t = touches[0];
      const ox = t.clientX - r.left, oy = t.clientY - r.top;

      // One-finger pan when Pan tool is active.
      if (S.tool === 'pan') {
        isPan = true; panSt = { x: t.clientX, y: t.clientY };
        panOr = { x: S.panX, y: S.panY };
        document.getElementById('cw').classList.add('panning');
        return;
      }

      if (S.tool === 'fill') { floodFill(ox, oy); return; }

      // Touch double-tap → mirrors mouse dblclick: deliberately
      // overwrite (or clear) a filled cell when protectFilled is on.
      const cell = getCell(ox, oy);
      const now = Date.now();
      const isDblTap = cell && _lastTapKey === cell.key && (now - _lastTapTime) < 450;
      _lastTapKey = cell ? cell.key : null;
      _lastTapTime = now;

      if (isDblTap && cell && S.tool === 'draw') {
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

      pushUndo(); painting = true; lastKey = null;
      paintAt(ox, oy);
      return;
    }

    if (touches.length === 2) {
      // Two-finger pinch zoom + pan.
      painting = false;
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

    if (touches.length === 1) {
      const t = touches[0];
      if (isPan) {
        S.panX = panOr.x + (t.clientX - panSt.x);
        S.panY = panOr.y + (t.clientY - panSt.y);
        draw(); return;
      }
      if (painting) {
        const r = canvas.getBoundingClientRect();
        paintAt(t.clientX - r.left, t.clientY - r.top);
      }
      return;
    }

    if (touches.length === 2 && t2Start) {
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
      draw();
    }
  }, { passive: false });

  canvas.addEventListener('touchend', e => {
    e.preventDefault();
    painting = false; isPan = false; t2Start = null; touches = [];
    document.getElementById('cw').classList.remove('panning');
  }, { passive: false });

  // Modal close on overlay click
  document.querySelectorAll('.mo').forEach(o =>
    o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); }));
}
