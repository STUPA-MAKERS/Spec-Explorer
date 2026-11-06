"""Shared fixtures: a small file tree of a commit in the spec format."""

# pyright: standard

from __future__ import annotations

import pytest

RULE = """---
id: "{num}"
title: {title}
kind: {kind}
status: {status}
owner: someone
updated: 2026-11-06
{extra}scope:
  - {scope}
---

# {title}

{body}
"""


def spec(
    num: str,
    title: str = "A rule",
    *,
    kind: str = "functional",
    status: str = "approved",
    extra: str = "implementation: null\n",
    scope: str = "backend",
    body: str = "The server must do it.",
) -> bytes:
    """Return the bytes of one spec file."""
    return RULE.format(
        num=num, title=title, kind=kind, status=status, extra=extra, scope=scope, body=body
    ).encode()


@pytest.fixture
def tree() -> dict[str, bytes]:
    """A commit with three specs, code that names them and a test file."""
    return {
        "specs/README.md": b"# Specs\n",
        "specs/requirements/functional/area/topic/000001_first.md": spec(
            "000001",
            "First rule",
            extra=(
                'tests:\n  - "backend/tests/test_x.py:test_first"\n'
                "implementation:\n  - backend/app\n  - backend/missing.py\n"
            ),
            body="The server must do it. See F/area/topic/000002.",
        ),
        "specs/requirements/functional/area/topic/000002_second.md": spec("000002", "Second rule"),
        "specs/requirements/functional/area/topic/000003_old.md": spec(
            "000003",
            "Old rule",
            status="replaced",
            extra="replaced_by: F/area/topic/000002\n",
        ),
        "backend/app/main.py": (
            "a = 1\nb = 2\nc = 3\nd = 4\n"
            "# \u00a7F/area/topic/000001 and \u00a7 F/area/topic/000099\n"
            "e = 5\nf = 6\ng = 7\nh = 8\ni = 9\n"
        ).encode(),
        "backend/tests/test_x.py": b"import x\n\n\ndef test_first():\n    assert x\n",
    }
