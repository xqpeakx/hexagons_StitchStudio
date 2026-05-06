#!/usr/bin/env python3
"""
Build stitch-studio.html from src/.

Concatenates src/css/styles.css and the alphabetically-sorted JS modules
in src/js/ into a single self-contained HTML file. The numeric prefix on
each JS module determines the bundling order:

    00-state.js   →  00 first  (constants, S object)
    10-hex.js     →  ...
    20-render.js
    30-paint.js
    40-events.js
    50-ui.js
    60-palette.js
    70-actions.js
    75-presets.js
    80-granny.js
    90-io.js
    99-main.js    →  99 last   (init() + DOMContentLoaded boot)

Usage:  python3 build.py

The output replaces /stitch-studio.html in-place. Open that file in a
browser (no server needed); /index.html in the same folder is a symlink
to it.
"""
from __future__ import annotations
import os
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC  = os.path.join(ROOT, 'src')
OUT  = os.path.join(ROOT, 'stitch-studio.html')
OUT_INDEX = os.path.join(ROOT, 'index.html')


def read(p: str) -> str:
    with open(p, 'r', encoding='utf-8') as f:
        return f.read()


def main() -> int:
    css_path = os.path.join(SRC, 'css', 'styles.css')
    js_dir   = os.path.join(SRC, 'js')
    html_path = os.path.join(SRC, 'index.html')

    if not os.path.exists(html_path):
        print(f'! src/index.html not found at {html_path}', file=sys.stderr)
        return 1

    css = read(css_path)
    js_files = sorted(f for f in os.listdir(js_dir) if f.endswith('.js'))
    js_blocks: list[str] = []
    for f in js_files:
        path = os.path.join(js_dir, f)
        js_blocks.append(f'// ── {f} ' + '─' * (60 - len(f)))
        js_blocks.append(read(path).rstrip())
    js = '\n\n'.join(js_blocks)

    html = read(html_path)
    out  = (
        html
        .replace('<!-- INJECT_CSS -->', f'<style>\n{css}\n</style>')
        .replace('<!-- INJECT_JS -->',  f'<script>\n{js}\n</script>')
    )

    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(out)

    # Also write a real index.html so GitHub Pages (and any static host)
    # can serve it without relying on a symlink. Remove anything already
    # at that path first — including symlinks — so we never write through
    # one to a stale target.
    if os.path.lexists(OUT_INDEX):
        os.remove(OUT_INDEX)
    with open(OUT_INDEX, 'w', encoding='utf-8') as f:
        f.write(out)

    size_kb = round(os.path.getsize(OUT) / 1024, 1)
    print(f'✓ Built stitch-studio.html + index.html ({size_kb} KB) — {len(js_files)} JS modules')
    return 0


if __name__ == '__main__':
    sys.exit(main())
