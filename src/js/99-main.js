// ═══════════════════════════════════════════════════════════
// INIT — wire DOM refs, install event handlers, first render.
// ═══════════════════════════════════════════════════════════

function init() {
  canvas  = document.getElementById('mc');
  ctx     = canvas.getContext('2d');
  gCanvas = document.getElementById('gpc');
  gCtx    = gCanvas.getContext('2d');

  renderStitches(); renderPalette(); renderPresets(); renderCables();
  bindRepeatAxisToggle();
  bindLegendLongPress();
  syncUnderlayUI();
  buildRoundRows(); drawGrannyPreview();
  resize();

  // Restore the last autosaved chart, if any. Falls back to a blank
  // canvas when nothing's stored.
  const restored = tryRestoreAutosave();
  if (restored) toast('Restored your last session');

  draw();
  updateIndicator(); updateLegend(); updateStats();

  bindCanvasEvents();
  window.addEventListener('resize', resize);
}

function resize() {
  syncResponsivePanels();
  const w = document.getElementById('cw');
  canvas.width = w.clientWidth;
  canvas.height = w.clientHeight;
  draw();
}

// Kick off after DOM ready.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
