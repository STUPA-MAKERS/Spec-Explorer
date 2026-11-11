"""Tests of the UML views of a commit."""

# pyright: standard

from __future__ import annotations

import json

from app.specindex import build_index
from app.umlindex import build_uml


def _view(key: str, **extra: object) -> bytes:
    data = {
        "view": key,
        "title": key.title(),
        "elements": [
            {"id": "a", "name": "a", "path": "backend/a"},
            {"id": "b", "name": "b", "path": "backend/b"},
        ],
        "edges": [{"from": "a", "to": "b"}],
        **extra,
    }
    return json.dumps(data).encode()


def test_views_in_order(tree: dict[str, bytes]) -> None:
    """§F/uml/views/000095: Komponenten, Klassen, Verteilung, then the state views by name."""
    tree["specs/uml/states/vote-status.json"] = _view("state")
    tree["specs/uml/deployment.json"] = _view("deployment")
    tree["specs/uml/states/backup-status.json"] = _view("state")
    tree["specs/uml/classes.json"] = _view("classes")
    tree["specs/uml/components.json"] = _view("components")
    views = build_index(tree)["uml"]
    assert [v["key"] for v in views] == [
        "components",
        "classes",
        "deployment",
        "backup-status",
        "vote-status",
    ]
    assert views[0]["data"]["edges"] == [{"from": "a", "to": "b"}]
    assert views[0]["errors"] == []


def test_no_uml_folder(tree: dict[str, bytes]) -> None:
    """§F/uml/views/000095: a ref without specs/uml has no views."""
    assert build_index(tree)["uml"] == []


def test_format_error_keeps_the_file() -> None:
    """§F/uml/views/000095: a broken file stays with its errors and without data."""
    tree = {
        "specs/uml/components.json": b"{",
        "specs/uml/classes.json": json.dumps(
            {
                "view": "classes",
                "elements": [{"id": "a", "name": "a", "path": "x"}, {"id": "a"}],
                "edges": [{"from": "a", "to": "z"}],
            }
        ).encode(),
    }
    views = {v["key"]: v for v in build_uml(tree)}
    assert views["components"]["data"] is None
    assert views["components"]["errors"][0].startswith("no valid JSON")
    assert views["classes"]["data"] is None
    assert views["classes"]["errors"] == [
        "key 'title' is missing",
        "an element needs id, name and path",
        "edge to 'z' is no element",
    ]
