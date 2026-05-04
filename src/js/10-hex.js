// ═══════════════════════════════════════════════════════════
// HEX MATH — offset coordinates (even-q for flat, even-r for pointy)
// ═══════════════════════════════════════════════════════════

function hexCorners(cx, cy, r, flat) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 180 * (flat ? 60 * i : 60 * i + 30);
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

function hexCenter(col, row, r, flat) {
  if (flat) {
    const w = r * Math.sqrt(3);
    const h = r * 2;
    const x = col * (h * 0.75) + r;
    const y = row * w + (col % 2 === 0 ? 0 : w / 2) + r;
    return [x, y];
  } else {
    const w = r * 2;
    const h = r * Math.sqrt(3);
    const x = col * w + (row % 2 === 0 ? 0 : w / 2) + r;
    const y = row * (h * 0.75) + r;
    return [x, y];
  }
}

// Inverse of hexCenter. Returns {col,row} or null if (px,py) is outside
// the painted hex grid. We snap to the nearest grid cell, then verify
// the click is inside the hex (within ~1.02 r of the centre).
function hexAtPoint(px, py, r, flat, cols, rows) {
  let col, row;
  if (flat) {
    const w = r * Math.sqrt(3);
    const h = r * 2;
    col = Math.round((px - r) / (h * 0.75));
    const offY = (col % 2 + 2) % 2 === 1 ? w / 2 : 0;
    row = Math.round((py - r - offY) / w);
  } else {
    const w = r * 2;
    const h = r * Math.sqrt(3);
    row = Math.round((py - r) / (h * 0.75));
    const offX = (row % 2 + 2) % 2 === 1 ? w / 2 : 0;
    col = Math.round((px - r - offX) / w);
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
