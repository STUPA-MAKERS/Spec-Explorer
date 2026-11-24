"""Fail when the frontend has a style of its own (spec 000107).

The count uses the hooks of the ui-kit ratchet (ui-kit spec 002213): every
``class=``, ``[class``, ``[ngClass]``, ``style=``, ``[style``, ``styles:`` and
``styleUrl`` in a ``.ts`` or ``.html`` file, and every line of a ``.scss`` or
``.css`` file that is not empty and not a comment. Test files do not count.
``src/styles.scss`` may hold only ``@use`` lines, because it loads the kit.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "frontend" / "src"
HOOKS = re.compile(r"class=|\[class|\[ngClass\]|style=|\[style|styles:|styleUrl")
ENTRY = ROOT / "styles.scss"


def style_lines(path: Path) -> list[tuple[int, str]]:
    """Return the lines of a style file that are not empty and not a comment."""
    found: list[tuple[int, str]] = []
    in_block = False
    for number, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        line = raw.strip()
        if in_block:
            if "*/" in line:
                in_block = False
            continue
        if line.startswith("/*"):
            in_block = "*/" not in line
            continue
        if not line or line.startswith("//"):
            continue
        if path == ENTRY and line.startswith("@use "):
            continue
        found.append((number, line))
    return found


def main() -> int:
    """Print every own style and return 1 when there is one."""
    hits: list[str] = []
    for path in sorted(ROOT.rglob("*")):
        if not path.is_file() or ".spec." in path.name:
            continue
        rel = path.relative_to(ROOT.parent)
        if path.suffix in {".scss", ".css"}:
            hits += [f"{rel}:{n}: {line}" for n, line in style_lines(path)]
        elif path.suffix in {".ts", ".html"}:
            for n, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
                if HOOKS.search(line):
                    hits.append(f"{rel}:{n}: {line.strip()}")
    for hit in hits:
        print(hit)
    print(f"own styles: {len(hits)} (allowed: 0)")
    return 1 if hits else 0


if __name__ == "__main__":
    sys.exit(main())
