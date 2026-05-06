#!/bin/bash
# Double-click this file in Finder (or run in Terminal) to push the
# Stitch Studio source tree to https://github.com/xqpeakx/hexagons_StitchStudio
#
# It clones the repo to ~/Desktop/hexagons_StitchStudio (creating it if
# missing), syncs the entire workspace into it, and pushes.
#
# What gets pushed:
#   stitch-studio.html      — the bundled, double-clickable build
#   src/                    — CSS + numbered JS modules
#   build.py                — `python3 build.py` rebuilds the bundle
#   docs/                   — community research + improvement notes
#   README.md               — project overview
#
# What's excluded: the SMB temp files (.smbdelete*), .DS_Store, and
# anything else listed in .gitignore.

set -e

REPO_URL="https://github.com/xqpeakx/hexagons_StitchStudio.git"
LOCAL_DIR="$HOME/Desktop/hexagons_StitchStudio"
SOURCE_DIR="/Volumes/server/Desktop/Apps/hexagons-app"

if [ ! -d "$SOURCE_DIR" ]; then
  echo "Source folder not found: $SOURCE_DIR"
  exit 1
fi

if [ ! -d "$LOCAL_DIR/.git" ]; then
  echo "Cloning $REPO_URL into $LOCAL_DIR ..."
  if ! git clone "$REPO_URL" "$LOCAL_DIR" 2>/dev/null; then
    # Repo doesn't exist yet, or is empty
    mkdir -p "$LOCAL_DIR"
    cd "$LOCAL_DIR"
    git init -b main
    git remote add origin "$REPO_URL" 2>/dev/null || git remote set-url origin "$REPO_URL"
  fi
fi

cd "$LOCAL_DIR"

# Mirror the source tree, but skip .git and SMB junk. We use rsync if
# available (preserves a tidy delete), otherwise fall back to cp -R.
EXCLUDES=(
  --exclude='.git'
  --exclude='.DS_Store'
  --exclude='.smbdelete*'
  --exclude='node_modules'
)
if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete "${EXCLUDES[@]}" "$SOURCE_DIR/" "$LOCAL_DIR/"
else
  echo "rsync not found — falling back to cp"
  rm -rf "$LOCAL_DIR"/{src,docs,stitch-studio.html,build.py,index.html}
  cp -R "$SOURCE_DIR/." "$LOCAL_DIR/"
  rm -rf "$LOCAL_DIR/.git" 2>/dev/null || true
  # If we wiped .git, restore it
  cd "$LOCAL_DIR"
  if [ ! -d .git ]; then
    git init -b main
    git remote add origin "$REPO_URL" 2>/dev/null || true
  fi
fi

cd "$LOCAL_DIR"

# index.html should already be a real file produced by build.py. If an
# old symlink (or absolute-path symlink left over from prior versions of
# this script) made it into the clone, drop it so the next rsync will
# replace it with the real file. We do NOT recreate a symlink — GitHub
# Pages chokes on absolute symlink targets.
if [ -L index.html ]; then rm -f index.html; fi
if [ ! -f index.html ] && [ -f stitch-studio.html ]; then
  cp stitch-studio.html index.html
fi

cat > .gitignore << 'EOF'
.DS_Store
.smbdelete*
node_modules
__pycache__
*.pyc
EOF

git add -A
if git diff --cached --quiet; then
  echo "No changes to commit."
  exit 0
fi

git commit -m "Refactor into src/ + add tier-1 features

Refactor:
- Split single-file HTML into src/css/styles.css and 12 numbered
  JS modules (state, hex, render, paint, events, ui, palette,
  actions, presets, granny, io, main).
- build.py concatenates into stitch-studio.html (double-clickable,
  no server required).

Features (research-driven; see docs/community-research.md):
- Gauge / aspect-ratio cells (Display → Gauge): cells render
  taller-than-wide to match real knit fabric proportions.
- Pan tool + spacebar pan: one-finger pan on touch, drag-to-pan
  on desktop. Fixes Stitch Fiddle's two-finger-only complaint.
- Auto-save to localStorage on every change + auto-restore on
  load. Eliminates the Stitchworks 'lost my work' complaint.
- Click-a-legend-swatch to swap that color globally for the
  active color (Crochet Chart iOS-style).
- 'No stitch' placeholder cell type (lace charts).
- Wrong-side-row shading toggle.
- Active row highlight ('follow mode') with arrow-key stepping.
- Responsive layout: panels collapse on narrow screens." || true

git push -u origin main
echo "Done. Check https://github.com/xqpeakx/hexagons_StitchStudio"
