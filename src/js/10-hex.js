// ═══════════════════════════════════════════════════════════
// HEX MATH — offset coordinates (odd-q for flat, odd-r for pointy)
// ═══════════════════════════════════════════════════════════

function hexMetrics(r, flat) {
  if (flat) {
    const rowStep = r * Math.sqrt(3);
    return {
      colStep: r * 1.5,
      rowStep,
      originX: r,
      originY: r,
      offsetX: 0,
      offsetY: rowStep / 2,
    };
  }
  const colStep = r * Math.sqrt(3);
  return {
    colStep,
    rowStep: r * 1.5,
    originX: colStep / 2,
    originY: r,
    offsetX: colStep / 2,
    offsetY: 0,
  };
}

function hexCorners(cx, cy, r, flat) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 180 * (flat ? 60 * i : 60 * i + 30);
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

function hexCenter(col, row, r, flat) {
  const m = hexMetrics(r, flat);
  if (flat) {
    const x = col * m.colStep + m.originX;
    const y = row * m.rowStep + (col % 2 === 0 ? 0 : m.offsetY) + m.originY;
    return [x, y];
  }
  const x = col * m.colStep + (row % 2 === 0 ? 0 : m.offsetX) + m.originX;
  const y = row * m.rowStep + m.originY;
  return [x, y];
}

// Inverse of hexCenter. Returns {col,row} or null if (px,py) is outside
// the painted hex grid. We snap to the nearest grid cell, then verify
// the click is inside the hex (within ~1.02 r of the centre).
function hexAtPoint(px, py, r, flat, cols, rows) {
  let col, row;
  const m = hexMetrics(r, flat);
  if (flat) {
    col = Math.round((px - m.originX) / m.colStep);
    const offY = (col % 2 + 2) % 2 === 1 ? m.offsetY : 0;
    row = Math.round((py - m.originY - offY) / m.rowStep);
  } else {
    row = Math.round((py - m.originY) / m.rowStep);
    const offX = (row % 2 + 2) % 2 === 1 ? m.offsetX : 0;
    col = Math.round((px - m.originX - offX) / m.colStep);
  }
  let best = null, bestD = Infinity;
  for (let dc = -1; dc <= 1; dc++) {
    for (let dr = -1; dr <= 1; dr++) {
      const tc = col + dc, tr = row + dr;
      if (tc < 0 || tr < 0 || tc >= cols || tr >= rows) continue;
      const [cx, cy] = hexCenter(tc, tr, r, flat);
      const d = (px - cx) ** 2 + (py - cy) ** 2;
      if (d < bestD) { bestD = d; best = { col: tc, row: tr }; }
    }
  }
  if (best && bestD < (r * 1.02) ** 2) return best;
  return null;
}

function hexKey(col, row) { return `${col},${row}`; }
