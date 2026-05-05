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
    ctx.strokeStyle = '#b85468';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(ax + 1, ay + 1, cs - 2, ch - 2);
    ctx.restore();
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

  // Row/col labels (with per-row painted counts on square grids — useful
  // when knitting from a chart, especially on tablets with no hover).
  if (S.showLabels && lo > 0) {
    ctx.fillStyle = '#b0a89f'; ctx.font = `9.5px DM Sans,sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#faf8f5';
    ctx.fillRect(0, 0, lo, canvas.height);
    ctx.fillRect(0, 0, canvas.width, lo);
    // Pre-tally per-visible-row stitch counts in one cells pass.
    const rowCounts = {};
    for (let r = row0; r < rowN; r++) rowCounts[r] = 0;
    for (const k in S.cells) {
      if (!k.startsWith('sq:')) continue;
      const [, rc] = k.split(':');
      const [r] = rc.split(',').map(Number);
      if (r in rowCounts && S.cells[k].stitchId !== '_no') rowCounts[r]++;
    }
    ctx.fillStyle = '#b0a89f';
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
        ctx.fillStyle = '#cabfb3';
        ctx.font = `8px DM Sans,sans-serif`;
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
    tctx.font = `${Math.min(10, ch * 0.32)}px DM Sans, sans-serif`;
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
  const STROKE = '#b85468';
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
  t.font = `600 ${labelSize}px DM Sans, sans-serif`;
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
