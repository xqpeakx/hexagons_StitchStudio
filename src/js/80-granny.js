// ═══════════════════════════════════════════════════════════
// GRANNY SQUARE BUILDER
// A side-panel preview canvas plus a stamp action that applies the
// configured rounds onto the main canvas centred on the visible view.
// ═══════════════════════════════════════════════════════════

function toggleGranny() {
  const p = document.getElementById('grannyPanel');
  p.classList.toggle('vis');
  if (p.classList.contains('vis')) { drawGrannyPreview(); onGStyleChange(); }
}

function onGStyleChange() {
  const style = document.getElementById('gStyle').value;
  const isHex = style.startsWith('hex_');
  const alreadyHex = S.gridType === 'hex';
  document.getElementById('hexnote').hidden = !(isHex && !alreadyHex);
  document.getElementById('cornerWrap').hidden = isHex;
  drawGrannyPreview();
}

function buildRoundRows() {
  const n = +document.getElementById('gRounds').value || 4;
  const stitches = CS[S.mode];
  const el = document.getElementById('roundsB');
  el.textContent = '';
  for (let i = 0; i < n; i++) {
    const row = document.createElement('div');
    row.className = 'rrow';
    const label = document.createElement('span');
    label.className = 'rn';
    label.textContent = `R${i + 1}`;
    const colorLabel = document.createElement('label');
    colorLabel.className = 'visually-hidden';
    colorLabel.setAttribute('for', `roundColor${i}`);
    colorLabel.textContent = `Round ${i + 1} colour`;
    const color = document.createElement('input');
    color.type = 'color';
    color.className = 'rcp';
    color.id = `roundColor${i}`;
    color.value = gRoundCols[i % gRoundCols.length];
    color.dataset.i = i;
    color.addEventListener('change', () => {
      gRoundCols[i] = color.value;
      drawGrannyPreview();
    });
    const stitchLabelEl = document.createElement('label');
    stitchLabelEl.className = 'visually-hidden';
    stitchLabelEl.setAttribute('for', `roundStitch${i}`);
    stitchLabelEl.textContent = `Round ${i + 1} stitch`;
    const select = document.createElement('select');
    select.className = 'rst';
    select.id = `roundStitch${i}`;
    select.dataset.i = i;
    select.addEventListener('change', drawGrannyPreview);
    stitches.forEach(s => {
      const option = document.createElement('option');
      option.value = s.id;
      option.textContent = s.abbr;
      select.append(option);
    });
    row.append(label, colorLabel, color, stitchLabelEl, select);
    el.appendChild(row);
  }
  drawGrannyPreview();
}

function getRoundCfg() {
  return Array.from(document.querySelectorAll('.rrow')).map(row => ({
    color: row.querySelector('.rcp').value,
    stitch: row.querySelector('.rst').value,
  }));
}

function drawGrannyPreview() {
  const size = 200, cx = size / 2, cy = size / 2;
  gCtx.clearRect(0, 0, size, size);
  const style = document.getElementById('gStyle').value;
  const rounds = getRoundCfg();
  if (!rounds.length) return;

  if (style === 'classic')        gDrawSquareClassic(cx, cy, rounds, size);
  else if (style === 'solid')     gDrawSquareSolid(cx, cy, rounds, size);
  else if (style === 'sunflower') gDrawSunflower(cx, cy, rounds, size);
  else if (style === 'pinwheel')  gDrawPinwheel(cx, cy, rounds, size);
  else if (style === 'hex_classic') gDrawHexClassic(cx, cy, rounds, size);
  else if (style === 'hex_solid')   gDrawHexSolid(cx, cy, rounds, size);
  else if (style === 'hex_flower')  gDrawHexFlower(cx, cy, rounds, size);
  else if (style === 'hex_ripple')  gDrawHexRipple(cx, cy, rounds, size);
}

function gHexPath(cx, cy, r, flat = false) {
  gCtx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 3 * i + (flat ? 0 : Math.PI / 6);
    const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
    i === 0 ? gCtx.moveTo(x, y) : gCtx.lineTo(x, y);
  }
  gCtx.closePath();
}

function gDrawSquareClassic(cx, cy, rounds, size) {
  const maxR = size * .44;
  for (let i = rounds.length - 1; i >= 0; i--) {
    const r = maxR * (i + 1) / rounds.length;
    const inner = i === 0 ? 0 : maxR * i / rounds.length;
    gCtx.fillStyle = rounds[i].color;
    if (i === 0) { gCtx.beginPath(); gCtx.arc(cx, cy, r * .65, 0, Math.PI * 2); gCtx.fill(); }
    else {
      gCtx.beginPath(); gCtx.roundRect(cx - r, cy - r, r * 2, r * 2, r * .12); gCtx.fill();
      gCtx.globalCompositeOperation = 'destination-out';
      gCtx.beginPath(); gCtx.roundRect(cx - inner * .98, cy - inner * .98, inner * 1.96, inner * 1.96, inner * .1); gCtx.fill();
      gCtx.globalCompositeOperation = 'source-over';
      gCtx.fillStyle = rounds[i].color;
      [[cx-r*.7,cy-r*.7],[cx+r*.7,cy-r*.7],[cx+r*.7,cy+r*.7],[cx-r*.7,cy+r*.7]].forEach(([x,y]) => {
        gCtx.beginPath(); gCtx.arc(x, y, r * .11, 0, Math.PI * 2); gCtx.fill();
      });
    }
  }
}

function gDrawSquareSolid(cx, cy, rounds, size) {
  const maxR = size * .44;
  for (let i = rounds.length - 1; i >= 0; i--) {
    const r = maxR * (i + 1) / rounds.length, inner = i === 0 ? 0 : maxR * i / rounds.length;
    gCtx.fillStyle = rounds[i].color;
    gCtx.fillRect(cx - r, cy - r, r * 2, r * 2);
    if (i > 0) { gCtx.globalCompositeOperation = 'destination-out'; gCtx.fillRect(cx - inner, cy - inner, inner * 2, inner * 2); gCtx.globalCompositeOperation = 'source-over'; }
  }
}

function gDrawSunflower(cx, cy, rounds, size) {
  const maxR = size * .43;
  rounds.slice(1).forEach((round, ri) => {
    gCtx.fillStyle = round.color;
    for (let p = 0; p < 8; p++) {
      const angle = (p / 8) * Math.PI * 2;
      const r = maxR * (ri + 1) / (rounds.length - 1) * .7;
      const ex = cx + Math.cos(angle) * (maxR * (ri + 1) / rounds.length);
      const ey = cy + Math.sin(angle) * (maxR * (ri + 1) / rounds.length);
      gCtx.beginPath(); gCtx.ellipse(ex, ey, r * .5, r * .25, angle, 0, Math.PI * 2); gCtx.fill();
    }
  });
  gCtx.fillStyle = rounds[0].color;
  gCtx.beginPath(); gCtx.arc(cx, cy, maxR * .3, 0, Math.PI * 2); gCtx.fill();
}

function gDrawPinwheel(cx, cy, rounds, size) {
  const maxR = size * .43;
  rounds.forEach((round, i) => {
    const r = maxR * (i + 1) / rounds.length;
    gCtx.fillStyle = round.color;
    for (let b = 0; b < 4; b++) {
      gCtx.save(); gCtx.translate(cx, cy); gCtx.rotate((b / 4) * Math.PI * 2 + i * .3);
      gCtx.beginPath(); gCtx.moveTo(0, 0); gCtx.arc(0, 0, r, 0, Math.PI * .5); gCtx.fill();
      gCtx.restore();
    }
  });
}

function gDrawHexClassic(cx, cy, rounds, size) {
  const maxR = size * .44;
  for (let i = rounds.length - 1; i >= 0; i--) {
    const r = maxR * (i + 1) / rounds.length, inner = i === 0 ? 0 : maxR * i / rounds.length * .97;
    gCtx.fillStyle = rounds[i].color;
    gHexPath(cx, cy, r, false); gCtx.fill();
    if (i > 0) {
      gCtx.globalCompositeOperation = 'destination-out';
      gHexPath(cx, cy, inner, false); gCtx.fill();
      gCtx.globalCompositeOperation = 'source-over';
      gCtx.fillStyle = rounds[i].color;
      for (let p = 0; p < 6; p++) {
        const a = (Math.PI / 3) * p + Math.PI / 6;
        const px = cx + r * .72 * Math.cos(a), py = cy + r * .72 * Math.sin(a);
        gCtx.beginPath(); gCtx.arc(px, py, r * .1, 0, Math.PI * 2); gCtx.fill();
      }
    }
  }
}

function gDrawHexSolid(cx, cy, rounds, size) {
  const maxR = size * .44;
  for (let i = rounds.length - 1; i >= 0; i--) {
    const r = maxR * (i + 1) / rounds.length, inner = i === 0 ? 0 : maxR * i / rounds.length * .97;
    gCtx.fillStyle = rounds[i].color;
    gHexPath(cx, cy, r, true); gCtx.fill();
    if (i > 0) {
      gCtx.globalCompositeOperation = 'destination-out';
      gHexPath(cx, cy, inner, true); gCtx.fill();
      gCtx.globalCompositeOperation = 'source-over';
    }
  }
  gCtx.strokeStyle = canvasToken('--canvas-hairline'); gCtx.lineWidth = 1;
  gHexPath(cx, cy, maxR, true); gCtx.stroke();
}

function gDrawHexFlower(cx, cy, rounds, size) {
  const maxR = size * .43;
  for (let i = rounds.length - 1; i >= 0; i--) {
    const r = maxR * (i + 1) / rounds.length;
    gCtx.fillStyle = rounds[i].color;
    if (i === 0) { gCtx.beginPath(); gCtx.arc(cx, cy, r * .85, 0, Math.PI * 2); gCtx.fill(); }
    else {
      const pr = r * .38;
      for (let p = 0; p < 6; p++) {
        const angle = (Math.PI / 3) * p + Math.PI / 6;
        const pd = maxR * i / rounds.length + pr * .55;
        const px = cx + pd * Math.cos(angle), py = cy + pd * Math.sin(angle);
        gCtx.save(); gCtx.translate(px, py); gCtx.rotate(angle);
        gCtx.beginPath(); gCtx.ellipse(0, 0, pr * .55, pr, 0, 0, Math.PI * 2); gCtx.fill();
        gCtx.restore();
      }
      gCtx.strokeStyle = rounds[i].color; gCtx.lineWidth = r * .15; gCtx.globalAlpha = .3;
      gHexPath(cx, cy, maxR * i / rounds.length + r * .1, false); gCtx.stroke();
      gCtx.globalAlpha = 1;
    }
  }
  gCtx.strokeStyle = rounds[rounds.length - 1].color; gCtx.lineWidth = 2.5;
  gHexPath(cx, cy, maxR, false); gCtx.stroke();
}

function gDrawHexRipple(cx, cy, rounds, size) {
  const maxR = size * .44;
  for (let i = rounds.length - 1; i >= 0; i--) {
    const r = maxR * (i + 1) / rounds.length;
    gCtx.fillStyle = rounds[i].color;
    gCtx.beginPath();
    for (let p = 0; p < 6; p++) {
      const a1 = (Math.PI / 3) * p + Math.PI / 6;
      const a2 = (Math.PI / 3) * (p + 1) + Math.PI / 6;
      const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
      const bumpR = r * (1 + .18 * Math.sin(i * 1.2));
      const mx = cx + bumpR * Math.cos((a1 + a2) / 2), my = cy + bumpR * Math.sin((a1 + a2) / 2);
      if (p === 0) gCtx.moveTo(x1, y1);
      gCtx.quadraticCurveTo(mx, my, x2, y2);
    }
    gCtx.closePath(); gCtx.fill();
    if (i > 0) {
      const inner = (maxR * i / rounds.length) * .96;
      gCtx.globalCompositeOperation = 'destination-out';
      gHexPath(cx, cy, inner, false); gCtx.fill();
      gCtx.globalCompositeOperation = 'source-over';
    }
  }
}

// Stamp the configured rounds onto the main canvas, centred on the
// current viewport.
function stampToCanvas() {
  pushUndo();
  const rounds = getRoundCfg();
  const style = document.getElementById('gStyle').value;
  const isHex = style.startsWith('hex_');
  const n = rounds.length;

  if (S.gridType === 'hex') {
    const px = canvas.width  / 2 - S.panX;
    const py = canvas.height / 2 - S.panY;
    const centerHex = hexAtPoint(px, py, S.hexSize, S.hexFlat, S.hexCols, S.hexRows);
    const cx = centerHex ? centerHex.col : 5;
    const cy = centerHex ? centerHex.row : 5;

    function offsetToCube(col, row) {
      if (S.hexFlat) {
        const x = col;
        const z = row - Math.floor((col - (col & 1)) / 2);
        const y = -x - z;
        return { x, y, z };
      } else {
        const x = col - Math.floor((row - (row & 1)) / 2);
        const z = row;
        const y = -x - z;
        return { x, y, z };
      }
    }
    function cubeDistance(a, b) {
      return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.z - b.z));
    }
    const centerCube = offsetToCube(cx, cy);
    const scan = n + 1;
    for (let dr = -scan; dr <= scan; dr++) {
      for (let dc = -scan; dc <= scan; dc++) {
        const col = cx + dc, row = cy + dr;
        if (col < 0 || row < 0 || col >= S.hexCols || row >= S.hexRows) continue;
        const cellCube = offsetToCube(col, row);
        const dist = cubeDistance(centerCube, cellCube);
        if (dist >= n) continue;
        S.cells[`hex:${col},${row}`] = { color: rounds[dist].color, stitchId: rounds[dist].stitch };
      }
    }
    draw(); updateStats(); updateLegend(); toast('Hex granny stamped!'); scheduleAutosave();
  } else {
    const lo = S.showLabels ? 20 : 0;
    const ch = cellHeightSq();
    const centerCol = Math.floor((canvas.width  / 2 - S.panX - lo) / S.cellSize);
    const centerRow = Math.floor((canvas.height / 2 - S.panY - lo) / ch);
    const radius = n * 2.2;

    for (let dr = -Math.ceil(radius) - 1; dr <= Math.ceil(radius) + 1; dr++) {
      for (let dc = -Math.ceil(radius) - 1; dc <= Math.ceil(radius) + 1; dc++) {
        const col = centerCol + dc, row = centerRow + dr;
        if (col < 0 || row < 0 || col >= S.sqW || row >= S.sqH) continue;
        let dist;
        if (style === 'solid') dist = Math.max(Math.abs(dr), Math.abs(dc));
        else if (isHex)        dist = Math.max(Math.abs(dc), Math.abs(dr), Math.abs(dc + dr)) * 0.85;
        else                   dist = Math.sqrt(dr * dr + dc * dc);
        if (dist >= radius) continue;
        const ri = Math.min(n - 1, Math.floor(dist / radius * n));
        S.cells[`sq:${row},${col}`] = { color: rounds[ri].color, stitchId: rounds[ri].stitch };
      }
    }
    draw(); updateStats(); updateLegend(); toast('Granny stamped to centre of view!'); scheduleAutosave();
  }
}

function exportGranny() {
  const link = document.createElement('a');
  link.download = 'granny-square.png'; link.href = gCanvas.toDataURL(); link.click();
  toast('Square exported!');
}
