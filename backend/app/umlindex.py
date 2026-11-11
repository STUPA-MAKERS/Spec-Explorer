"""Read the UML views of one commit from `specs/uml/` (§F/uml/views/000095).

The format is the one of STUPA-Workflow (`specs/style/specs/uml/`): one JSON file per view
with `view`, `title` and `elements`, each element with `id`, `name` and `path`, and edges
with `from` and `to`. A file that breaks the format stays in the list with its errors and
without its data, so the page shows the file and the error instead of the view.
"""

from __future__ import annotations

import json
from collections import Counter
from collections.abc import Mapping
from pathlib import PurePosixPath
from typing import Any, cast

UML_DIR = "specs/uml/"
# §F/uml/views/000095: the fixed views first, then the state views by name.
ORDER = {"components": 0, "classes": 1, "deployment": 2}


def _dicts(value: object) -> list[dict[str, Any]] | None:
    """Return a JSON list as a list of objects; `None` when it is no list."""
    if not isinstance(value, list):
        return None
    items = cast("list[object]", value)
    return [cast("dict[str, Any]", i) if isinstance(i, dict) else {} for i in items]


def _errors(raw: object) -> list[str]:
    """Return the format errors of one view."""
    if not isinstance(raw, dict):
        return ["the file must hold one JSON object"]
    view = cast("dict[str, Any]", raw)
    errors = [f"key {k!r} is missing" for k in ("view", "title", "elements") if k not in view]
    elements = _dicts(view.get("elements", []))
    if elements is None:
        return [*errors, "elements must be a list"]
    complete = [e for e in elements if all(k in e for k in ("id", "name", "path"))]
    errors += ["an element needs id, name and path"] * (len(elements) - len(complete))
    ids = [str(e["id"]) for e in complete]
    errors += [f"element ID {i!r} is not unique" for i, n in Counter(ids).items() if n > 1]
    edges = _dicts(view.get("edges", []))
    if edges is None:
        return [*errors, "edges must be a list"]
    known = set(ids)
    errors += [
        f"edge {end} {edge.get(end)!r} is no element"
        for edge in edges
        for end in ("from", "to")
        if edge.get(end) not in known
    ]
    return errors


def _key(path: str) -> str:
    """Return the URL key of a view: the file name without `.json`."""
    return PurePosixPath(path).stem


def build_uml(tree: Mapping[str, bytes]) -> list[dict[str, Any]]:
    """Return every view below `specs/uml/`, the fixed views first, then the rest by key."""
    views: list[dict[str, Any]] = []
    for path in sorted(p for p in tree if p.startswith(UML_DIR) and p.endswith(".json")):
        entry: dict[str, Any] = {"key": _key(path), "file": path, "data": None, "errors": []}
        try:
            data = json.loads(tree[path].decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            entry["errors"] = [f"no valid JSON: {exc}"]
            views.append(entry)
            continue
        entry["errors"] = _errors(data)
        if not entry["errors"]:
            entry["data"] = data
        views.append(entry)
    return sorted(views, key=lambda v: (ORDER.get(v["key"], len(ORDER)), v["key"]))
