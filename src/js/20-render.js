// ═══════════════════════════════════════════════════════════
// CANVAS DRAW ENGINE
// No CSS zoom transform. "Zoom" = changing cellSize/hexSize.
// "Pan" = panX/panY, in pixels, applied as the grid origin offset.
// Only visible cells are iterated, so the logical grid can be huge.
// ═══════════════════════════════════════════════════════════

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
  const colStep = flat ? r * 1.5 : r * Math.sqrt(3);
  const rowStep = flat ? r * Math.sqrt(3) : r * 1.5;
  const col0 = Math.max(0, Math.floor(-S.panX / colStep) - 1);
  const row0 = Math.max(0, Math.floor(-S.panY / rowStep) - 1);
  const colN = col0 + Math.ceil(canvas.width  / colStep) + 3;
  const rowN = row0 + Math.ceil(canvas.height / rowStep) + 3;
  return { col0, row0, colN, rowN };
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#f0ece6';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (S.gridType === 'square') drawSquareGrid();
  else drawHexGrid();
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
  ctx.fillStyle = '#faf8f5';
  ctx.fillRect(gx, gy, (colN - col0) * cs, (rowN - row0) * ch);

  // WS row shading. Knitters chart bottom-up; row 0 in the array is
  // the last row knit, so the displayed row label is (sqH - r) for
  // knit charts. WS rows are the ones whose label is even.
  if (S.shadeWS) {
    ctx.fillStyle = 'rgba(107, 79, 160, 0.07)';
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
        ctx.fillStyle = '#dcd5cb';
        ctx.fillRect(x, y, cs, ch);
        ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 1;
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

  // Active row highlight
  if (S.activeRow !== null && S.activeRow >= row0 && S.activeRow < rowN) {
    ctx.strokeStyle = '#b85468';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(gx, oy + S.activeRow * ch, (colN - col0) * cs, ch);
  }

  // Grid lines
  if (S.showGrid) {
    ctx.strokeStyle = 'rgba(0,0,0,.1)'; ctx.lineWidth = .5;
    for (let r = row0; r <= rowN; r++) {
      const y = oy + r * ch;
      ctx.beginPath(); ctx.moveTo(ox + col0 * cs, y); ctx.lineTo(ox + colN * cs, y); ctx.stroke();
    }
    for (let c = col0; c <= colN; c++) {
      const x = ox + c * cs;
      ctx.beginPath(); ctx.moveTo(x, oy + row0 * ch); ctx.lineTo(x, oy + rowN * ch); ctx.stroke();
    }
  }

  // Row/col labels
  if (S.showLabels && lo > 0) {
    ctx.fillStyle = '#b0a89f'; ctx.font = `9.5px DM Sans,sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#faf8f5';
    ctx.fillRect(0, 0, lo, canvas.height);
    ctx.fillRect(0, 0, canvas.width, lo);
    ctx.fillStyle = '#b0a89f';
    for (let r = row0; r < rowN; r++) {
      const y = oy + r * ch + ch / 2;
      if (y > 0 && y < canvas.height) ctx.fillText(S.mode === 'knit' ? (S.sqH - r) : (r + 1), lo / 2, y);
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

  const colStep = flat ? r * 1.5 : r * Math.sqrt(3);
  const rowStep = flat ? r * Math.sqrt(3) : r * 1.5;

  const col0 = Math.max(0, Math.floor(-ox / colStep) - 1);
  const row0 = Math.max(0, Math.floor(-oy / rowStep) - 1);
  const colN = Math.min(S.hexCols, col0 + Math.ceil(canvas.width  / colStep) + 3);
  const rowN = Math.min(S.hexRows, row0 + Math.ceil(canvas.height / rowStep) + 3);

  ctx.fillStyle = '#faf8f5';
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
        ctx.fillStyle = '#dcd5cb'; ctx.fill();
      } else {
        ctx.fillStyle = cell ? cell.color : '#faf8f5';
        ctx.fill();
        if (cell && S.showSyms && r >= 13) drawSymbol(ctx, cell, scx, scy, r * 1.2);
      }
      if (S.showGrid) {
        ctx.strokeStyle = 'rgba(0,0,0,.13)'; ctx.lineWidth = .6;
        ctx.stroke();
      }
    }
  }

  // Labels
  if (S.showLabels) {
    ctx.fillStyle = '#b0a89f'; ctx.font = `9px DM Sans,sans-serif`;
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

function drawSymbol(ctx, cell, x, y, cs) {
  const s = CS[S.mode].find(s => s.id === cell.stitchId);
  if (!s) return;
  ctx.fillStyle = lum(cell.color) > .5 ? 'rgba(0,0,0,.6)' : 'rgba(255,255,255,.85)';
  ctx.font = `${Math.min(cs * .5, 13)}px DM Sans,monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(s.sym, x, y);
}

function lum(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255,
        g = parseInt(hex.slice(3, 5), 16) / 255,
        b = parseInt(hex.slice(5, 7), 16) / 255;
  return .2126 * r + .7152 * g + .0722 * b;
}
