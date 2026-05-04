// ═══════════════════════════════════════════════════════════
// CUSTOM COLOR PICKER LOGIC
// previewCustomColor fires on every value change while dragging.
// addCustomColor fires when the picker commits a value, but some
// browsers fire it on every internal slider release — the debounce
// here ensures only the FINAL color the user lands on is added to
// the colorway palette.
// ═══════════════════════════════════════════════════════════

function previewCustomColor(c) {
  S.activeColor = c;
  updateIndicator();
}

function addCustomColor(c) {
  if (_customColorCommitTimer) clearTimeout(_customColorCommitTimer);
  _customColorCommitTimer = setTimeout(() => {
    _customColorCommitTimer = null;
    if (!PALETTE.includes(c)) PALETTE.unshift(c);
    setColor(c);
    renderPalette();
    scheduleAutosave();
  }, 350);
}
