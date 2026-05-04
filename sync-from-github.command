#!/bin/bash
# Pulls the latest from GitHub into a local folder on your Mac
# (~/Desktop/hexagons_StitchStudio). Use this whenever the SMB
# workspace is behind the remote — which it currently is, because
# git can't update files in /Volumes/server/... due to SMB perms.
#
# After running this, work from the local folder. Treat the SMB
# folder as a read-only/Finder-accessible mirror at most.

set -e

REPO_URL="https://github.com/xqpeakx/hexagons_StitchStudio.git"
LOCAL_DIR="$HOME/Desktop/hexagons_StitchStudio"

if [ ! -d "$LOCAL_DIR/.git" ]; then
  echo "Cloning $REPO_URL into $LOCAL_DIR ..."
  git clone "$REPO_URL" "$LOCAL_DIR"
else
  cd "$LOCAL_DIR"
  echo "Pulling latest into $LOCAL_DIR ..."
  git fetch origin
  # Refuse to clobber local edits; user must commit/stash first
  if ! git diff --quiet || ! git diff --cached --quiet; then
    echo
    echo "You have uncommitted changes in $LOCAL_DIR."
    echo "Commit or stash them first, then re-run this script."
    exit 1
  fi
  git pull --ff-only origin main
fi

cd "$LOCAL_DIR"
echo
echo "✓ Up to date with origin/main."
echo "  Latest commits:"
git log --oneline -5
echo
echo "Open the folder:"
open "$LOCAL_DIR"
