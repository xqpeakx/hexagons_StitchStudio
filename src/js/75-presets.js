// ═══════════════════════════════════════════════════════════
// PRESETS — quick-load patterns
// Crochet presets work on either grid; knit presets are square-only.
// ═══════════════════════════════════════════════════════════

function presetBlank() { clearAll(); toast('Blank canvas'); }

function presetClassicGranny() {
  clearAll();
  if (S.gridType === 'hex') {
    const cx = Math.floor(S.hexCols / 2), cy = Math.floor(S.hexRows / 2);
    const colors = PRESET_COLORS.granny;
    S.cells[`hex:${cx},${cy}`] = { color: colors[0], stitchId: S.activeStitch };
    for (let ring = 1; ring <= 3; ring++) {
      const col = colors[ring % colors.length];
      for (let r = 0; r < S.hexRows; r++) for (let c = 0; c < S.hexCols; c++) {
        const dist = Math.max(Math.abs(c - cx), Math.abs(r - cy), Math.abs((c - cx) - (r - cy)));
        if (dist === ring) S.cells[`hex:${c},${r}`] = { color: col, stitchId: 'dc' };
      }
    }
  } else {
    const colors = PRESET_COLORS.granny;
    const half = S.sqW / 2, hr = S.sqH / 2;
    for (let i = 0; i < 4; i++) {
      for (let r = 0; r < S.sqH; r++) for (let c = 0; c < S.sqW; c++) {
        const dr = Math.abs(r - hr + .5), dc = Math.abs(c - half + .5);
        const dist = Math.max(dr, dc);
        if (dist >= i * 2.5 + 1 && dist < (i + 1) * 2.5 + 1)
          S.cells[`sq:${r},${c}`] = { color: colors[i], stitchId: 'dc' };
      }
    }
  }
  draw(); updateStats(); updateLegend(); toast('Classic granny loaded!'); scheduleAutosave();
}

function presetShell() {
  clearAll();
  const colors = PRESET_COLORS.shell;
  if (S.gridType === 'hex') {
    for (let r = 0; r < S.hexRows; r++) for (let c = 0; c < S.hexCols; c++) {
      const ci = (r + Math.floor(c / 3)) % colors.length;
      S.cells[`hex:${c},${r}`] = { color: colors[ci], stitchId: c % 3 === 0 ? 'sc' : 'dc' };
    }
  } else {
    for (let r = 0; r < S.sqH; r++) for (let c = 0; c < S.sqW; c++) {
      const ci = (r + Math.floor(c / 4)) % colors.length;
      S.cells[`sq:${r},${c}`] = { color: colors[ci], stitchId: c % 4 === 0 ? 'sc' : 'dc' };
    }
  }
  draw(); updateStats(); updateLegend(); toast('Shell pattern loaded!'); scheduleAutosave();
}

function presetRipple() {
  clearAll();
  const colors = PRESET_COLORS.ripple;
  if (S.gridType === 'hex') {
    for (let r = 0; r < S.hexRows; r++) for (let c = 0; c < S.hexCols; c++) {
      const wave = Math.sin(c * .7 + r * .3) > .0;
      S.cells[`hex:${c},${r}`] = { color: colors[r % colors.length], stitchId: wave ? 'dc' : 'hdc' };
    }
  } else {
    for (let r = 0; r < S.sqH; r++) for (let c = 0; c < S.sqW; c++) {
      S.cells[`sq:${r},${c}`] = { color: colors[r % colors.length], stitchId: Math.sin(c * .6) > .0 ? 'dc' : 'hdc' };
    }
  }
  draw(); updateStats(); updateLegend(); toast('Ripple loaded!'); scheduleAutosave();
}

function presetSolid() {
  clearAll();
  if (S.gridType === 'hex') {
    for (let r = 0; r < S.hexRows; r++) for (let c = 0; c < S.hexCols; c++)
      S.cells[`hex:${c},${r}`] = { color: S.activeColor, stitchId: 'sc' };
  } else {
    for (let r = 0; r < S.sqH; r++) for (let c = 0; c < S.sqW; c++)
      S.cells[`sq:${r},${c}`] = { color: S.activeColor, stitchId: 'sc' };
  }
  draw(); updateStats(); updateLegend(); toast('Solid block loaded!'); scheduleAutosave();
}

function presetStockinette() {
  clearAll();
  const W = 40, H = 30;
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++)
    S.cells[`sq:${r},${c}`] = { color: PRESET_COLORS.stockinette, stitchId: 'k' };
  draw(); updateStats(); updateLegend(); toast('Stockinette'); scheduleAutosave();
}

function presetRib() {
  clearAll();
  const W = 40, H = 30;
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const k = c % 4 < 2;
    S.cells[`sq:${r},${c}`] = { color: k ? PRESET_COLORS.stockinette : PRESET_COLORS.ribPurl, stitchId: k ? 'k' : 'p' };
  }
  draw(); updateStats(); updateLegend(); toast('2×2 Rib'); scheduleAutosave();
}

function presetSeed() {
  clearAll();
  const W = 40, H = 30;
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const k = (r + c) % 2 === 0;
    S.cells[`sq:${r},${c}`] = { color: k ? PRESET_COLORS.stockinette : PRESET_COLORS.seedPurl, stitchId: k ? 'k' : 'p' };
  }
  draw(); updateStats(); updateLegend(); toast('Seed stitch'); scheduleAutosave();
}

function presetChecker() {
  clearAll();
  const [c1, c2] = PRESET_COLORS.checker;
  const W = 40, H = 30;
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const a = (Math.floor(r / 4) + Math.floor(c / 4)) % 2 === 0;
    S.cells[`sq:${r},${c}`] = { color: a ? c1 : c2, stitchId: a ? 'k' : 'p' };
  }
  draw(); updateStats(); updateLegend(); toast('Checker'); scheduleAutosave();
}
