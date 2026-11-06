"""Tests of the index builder."""

# pyright: standard

from __future__ import annotations

from typing import Any

from app.specindex import MAX_SCAN_BYTES, build_index, rule_text
from tests.conftest import spec


def _by_id(index: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {s["id"]: s for s in index["specs"]}


def test_every_spec_file(tree: dict[str, bytes]) -> None:
    """§F/specs/list/000010: every `.md` below a kind folder, with ID, title and status."""
    tree["specs/style/area/topic/000004_style.md"] = spec("000004", "Style", kind="style")
    tree["docs/000005_other.md"] = spec("000005")
    specs = build_index(tree)["specs"]
    assert [s["id"] for s in specs] == [
        "F/area/topic/000001",
        "F/area/topic/000002",
        "F/area/topic/000003",
        "S/area/topic/000004",
    ]
    assert specs[0]["title"] == "First rule"
    assert specs[0]["status"] == "approved"


def test_format_error(tree: dict[str, bytes]) -> None:
    """§F/specs/list/000014: a broken file stays in the list with each violation."""
    tree["specs/requirements/functional/area/topic/000006_broken.md"] = b"no front matter"
    tree["specs/requirements/functional/area/topic/000007_bad.md"] = spec(
        "000007", "Bad", status="maybe", body="No obligation here."
    )
    tree["specs/requirements/functional/area/Topic/x.md"] = spec("000008")
    specs = _by_id(build_index(tree))
    assert specs["F/area/topic/000006"]["errors"] == ["no front matter"]
    bad = specs["F/area/topic/000007"]["errors"]
    assert any("status 'maybe'" in e for e in bad)
    odd = next(s for s in specs.values() if s["file"].endswith("x.md"))
    assert any("file name" in e for e in odd["errors"])
    assert any("folder 'Topic'" in e for e in odd["errors"])
    assert specs["F/area/topic/000001"]["errors"] == [
        "implementation path 'backend/missing.py' does not exist"
    ]


def test_format_error_rules(tree: dict[str, bytes]) -> None:
    """§F/specs/list/000014: front matter, heading, labels and numbers are checked."""
    tree["specs/requirements/functional/area/topic/000009_a.md"] = spec(
        "000009",
        "A",
        kind="style",
        extra='tests:\n  - "nope"\nimplementation: []\n',
        scope="nowhere",
        body="Test: first.\n\nReason: then.\n\n# Second heading",
    )
    tree["specs/requirements/functional/other/topic/000009_b.md"] = spec(
        "000009", "B", status="replaced", extra="replaced_by: F/area/topic/000003\n"
    )
    tree["specs/requirements/functional/other/topic/000010_c.md"] = spec(
        "000010", "C", extra="replaced_by: X\nimplementation: null\n"
    )
    tree["specs/requirements/functional/other/topic/000011_d.md"] = spec(
        "000011", "D", status="removed", extra="implementation: null\n"
    )
    tree["specs/requirements/functional/other/topic/000012_e.md"] = (
        spec("000012", "E").replace(b'id: "000012"', b"id: 12").replace(b"2026-11-06", b"x")
    )
    tree["specs/requirements/functional/other/topic/000013_f.md"] = spec(
        "000013", "F", extra="", scope="backend\n  - backend"
    ).replace(b"scope:\n  - backend\n  - backend", b"scope:\n  - backend\n  - backend\nzzz: 1")
    tree["specs/requirements/functional/other/topic/000014_g.md"] = spec(
        "000014", "G", status="replaced", extra="replaced_by: F/nope/topic/000001\n"
    )
    specs = _by_id(build_index(tree))
    a = " | ".join(specs["F/area/topic/000009"]["errors"])
    for part in ("kind 'style'", "tests entry", "implementation must", "scope path", "heading"):
        assert part in a
    assert "labels must" in a
    assert "number used by" in " ".join(specs["F/other/topic/000009"]["errors"])
    assert "not in force" in " ".join(specs["F/other/topic/000009"]["errors"])
    c = " ".join(specs["F/other/topic/000010"]["errors"])
    assert "replaced_by goes with status replaced only" in c
    assert "no full ID" in c
    d = " ".join(specs["F/other/topic/000011"]["errors"])
    assert "implementation goes with status draft or approved only" in d
    e = " ".join(specs["F/other/topic/000012"]["errors"])
    assert "quoted number" in e
    assert "YYYY-MM-DD" in e
    f = " ".join(specs["F/other/topic/000013"]["errors"])
    assert "keys or their order" in f
    assert "two times" in f
    assert "no full ID" in " ".join(specs["F/other/topic/000014"]["errors"])


def test_missing_scope(tree: dict[str, bytes]) -> None:
    """§F/specs/list/000014: a spec without scope is an error."""
    tree["specs/requirements/functional/area/topic/000015_s.md"] = spec("000015", "S").replace(
        b"scope:\n  - backend\n", b"scope:\n"
    )
    errors = _by_id(build_index(tree))["F/area/topic/000015"]["errors"]
    assert "scope must be a list of paths" in errors


def test_section_references(tree: dict[str, bytes]) -> None:
    """§F/references/code/000019: every `§` reference outside `specs/` with path and line."""
    index = build_index(tree)
    refs = _by_id(index)["F/area/topic/000001"]["codeRefs"]
    assert [(r["path"], r["line"]) for r in refs] == [("backend/app/main.py", 5)]


def test_broken_references(tree: dict[str, bytes]) -> None:
    """§F/references/code/000021: a reference that names no spec is in `broken`."""
    broken = build_index(tree)["broken"]
    assert [(b["ref"], b["path"], b["line"]) for b in broken] == [
        ("F/area/topic/000099", "backend/app/main.py", 5)
    ]


def test_reference_context(tree: dict[str, bytes]) -> None:
    """§F/references/code/000071: four lines before and after, with the first line number."""
    ref = build_index(tree)["broken"][0]
    assert ref["from"] == 1
    assert ref["context"] == [
        "a = 1",
        "b = 2",
        "c = 3",
        "d = 4",
        ref["context"][4],
        *["e = 5", "f = 6", "g = 7", "h = 8"],
    ]


def test_size_limit(tree: dict[str, bytes]) -> None:
    """§NF/performance/loading/000034: a file larger than 1 MB is not searched."""
    tree["big.txt"] = b"x" * MAX_SCAN_BYTES + "\u00a7F/area/topic/000002".encode()
    tree["bin.dat"] = b"\xff\xfe" + "\u00a7F/area/topic/000002".encode()
    assert _by_id(build_index(tree))["F/area/topic/000002"]["codeRefs"] == []


def test_implementation_paths(tree: dict[str, bytes]) -> None:
    """§F/references/paths/000022: each implementation path with whether it exists."""
    first = _by_id(build_index(tree))["F/area/topic/000001"]
    assert first["implementation"] == [
        {"path": "backend/app", "exists": True},
        {"path": "backend/missing.py", "exists": False},
    ]


def test_not_implemented(tree: dict[str, bytes]) -> None:
    """§F/references/paths/000023: `implementation: null` gives None."""
    assert _by_id(build_index(tree))["F/area/topic/000002"]["implementation"] is None


def test_tests(tree: dict[str, bytes]) -> None:
    """§F/references/paths/000024: a test entry has the line of its function, or None."""
    first = _by_id(build_index(tree))["F/area/topic/000001"]
    assert first["tests"] == [
        {
            "entry": "backend/tests/test_x.py:test_first",
            "path": "backend/tests/test_x.py",
            "fn": "test_first",
            "line": 4,
            "exists": True,
        }
    ]
    tree["backend/tests/test_x.py"] = b"nothing\n"
    assert _by_id(build_index(tree))["F/area/topic/000001"]["tests"][0]["line"] is None


def test_scope_paths(tree: dict[str, bytes]) -> None:
    """§F/references/paths/000025: scope paths, a submodule path and `.` exist."""
    tree[".gitmodules"] = b'[submodule "kit"]\n\tpath = frontend/vendor/kit\n'
    tree["specs/requirements/functional/area/topic/000002_second.md"] = spec(
        "000002", "Second rule", scope=".\n  - frontend/vendor/kit\n  - nope"
    )
    second = _by_id(build_index(tree))["F/area/topic/000002"]
    assert second["scope"] == [
        {"path": ".", "exists": True},
        {"path": "frontend/vendor/kit", "exists": True},
        {"path": "nope", "exists": False},
    ]


def test_spec_mentions(tree: dict[str, bytes]) -> None:
    """§F/references/specs/000026: named rule IDs and the specs that name this one."""
    specs = _by_id(build_index(tree))
    assert specs["F/area/topic/000001"]["mentions"] == ["F/area/topic/000002"]
    assert specs["F/area/topic/000002"]["mentionedBy"] == ["F/area/topic/000001"]


def test_replaced_by(tree: dict[str, bytes]) -> None:
    """§F/specs/detail/000018: the new spec lists the specs that it replaces."""
    specs = _by_id(build_index(tree))
    assert specs["F/area/topic/000003"]["replacedBy"] == "F/area/topic/000002"
    assert specs["F/area/topic/000002"]["replaces"] == ["F/area/topic/000003"]


def test_rule_text() -> None:
    """The body loses its heading; a list keeps its line breaks."""
    assert rule_text("# T\n\nA\nB\n\n- x\n- y") == "A B\n\n- x\n- y"
    assert rule_text("# T") == ""
