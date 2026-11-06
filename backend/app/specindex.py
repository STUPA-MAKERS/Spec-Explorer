"""Build the index of one commit: the specs, their format errors and every `§` reference.

The input is the file tree of a commit as a mapping of path to bytes (`Tree`). The checks
follow the format rules of the spec format (`specs/style/specs/`) and use the same patterns
as `scripts/check_specs.py`, so the explorer and the format check report the same errors.
"""

from __future__ import annotations

import re
from collections.abc import Iterable, Mapping
from dataclasses import dataclass, field
from pathlib import PurePosixPath
from typing import Any

# §F/references/code/000019: the pattern of the format check.
SECTION_REF = re.compile(r"§ ?((?:F|NF|S)/[a-z0-9/-]+/[0-9]{6})")
# §F/references/specs/000026: a rule ID in the body of a spec, without `§`.
MENTION = re.compile(r"(?<![§/\w])((?:F|NF|S)/[a-z0-9-]+/[a-z0-9-]+/[0-9]{6})")

KINDS = {
    "specs/style": ("S", "style"),
    "specs/requirements/functional": ("F", "functional"),
    "specs/requirements/non-functional": ("NF", "non-functional"),
}
KEYS = [
    "id",
    "title",
    "kind",
    "status",
    "owner",
    "updated",
    "replaced_by",
    "tests",
    "implementation",
    "scope",
]
REQUIRED = {"id", "title", "kind", "status", "owner", "updated", "scope"}
STATUSES = {"draft", "approved", "replaced", "removed"}
FILE_NAME = re.compile(r"^[0-9]{6}_[a-z0-9]+(-[a-z0-9]+)*\.md$")
FOLDER = re.compile(r"^[a-z0-9-]+$")
FULL_ID = re.compile(r"^(F|NF|S)(/[a-z0-9-]+)+/[0-9]{6}$")
TEST_ENTRY = re.compile(r"^[^:\s]+\.(py|ts):[A-Za-z_][A-Za-z0-9_.]*$")
DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
LABEL = re.compile(r"^(Reason|Test):", re.MULTILINE)
MUST = re.compile(r"\bmust\b")
LIST_LINE = re.compile(r"\s*([-*|>]|\d+\.|```)")

# §NF/performance/loading/000034: no reference search in a file larger than 1 MB.
MAX_SCAN_BYTES = 1_000_000
# §F/references/code/000071: four lines before and after a reference.
CONTEXT_LINES = 4

Tree = Mapping[str, bytes]
Meta = dict[str, str | list[str]]


@dataclass
class _Parsed:
    """One spec file after the parse of its front matter."""

    path: str
    full_id: str
    meta: Meta
    keys: list[str]
    body: str
    raw: str
    errors: list[str] = field(default_factory=lambda: list[str]())


@dataclass
class Files:
    """The paths of a commit and the text of the files that the index reads again."""

    paths: set[str]
    dirs: set[str]
    texts: dict[str, str]

    def exists(self, path: str) -> bool:
        """Return whether a file or a folder exists at the commit."""
        clean = str(PurePosixPath(path.strip("/")))
        return clean == "." or clean in self.paths or clean in self.dirs


def _dirs(paths: Iterable[str]) -> set[str]:
    """Return every parent folder of the paths."""
    out: set[str] = set()
    for path in paths:
        parts = path.split("/")[:-1]
        for i in range(1, len(parts) + 1):
            out.add("/".join(parts[:i]))
    return out


def _submodules(tree: Tree) -> set[str]:
    """Return the paths of the submodules and their parents.

    A tarball holds no file of a submodule, so its path exists only in `.gitmodules`.
    """
    text = tree.get(".gitmodules", b"").decode("utf-8", errors="replace")
    paths = [m.strip() for m in re.findall(r"^\s*path\s*=\s*(.+)$", text, re.MULTILINE)]
    return set(paths) | _dirs(f"{p}/x" for p in paths)


def parse_front_matter(text: str) -> tuple[Meta, list[str], str] | None:
    """Return the values, the order of the keys and the body, or None without front matter."""
    if not text.startswith("---\n"):
        return None
    end = text.find("\n---\n", 4)
    if end < 0:
        return None
    meta: Meta = {}
    keys: list[str] = []
    current: str | None = None
    for line in text[4:end].splitlines():
        if line.startswith("  - ") and current is not None:
            value = meta.setdefault(current, [])
            if isinstance(value, list):
                value.append(line[4:].strip().strip('"'))
            continue
        key, _, value = line.partition(":")
        current = key.strip()
        keys.append(current)
        meta[current] = value.strip().strip('"') if value.strip() else []
    return meta, keys, text[end + 5 :]


def _kind_of(path: str) -> tuple[str, str, PurePosixPath] | None:
    """Return the ID prefix, the kind and the path below the kind folder."""
    for folder, (prefix, kind) in KINDS.items():
        if path.startswith(folder + "/"):
            return prefix, kind, PurePosixPath(path[len(folder) + 1 :])
    return None


def _as_list(value: str | list[str] | None) -> list[str]:
    """Return a front matter value as a list."""
    if value is None or value == "null":
        return []
    return value if isinstance(value, list) else [value]


def _load(tree: Tree) -> list[_Parsed]:
    """Parse every `.md` file below a kind folder. A broken file stays with its errors."""
    specs: list[_Parsed] = []
    for path in sorted(tree):
        if not path.endswith(".md"):
            continue
        kind = _kind_of(path)
        if kind is None:
            continue
        prefix, _, below = kind
        name = below.name
        folders = below.parts[:-1]
        errors: list[str] = []
        if len(below.parts) != 3:
            errors.append("must be <area>/<topic>/<file> below the kind folder")
        if not FILE_NAME.match(name):
            errors.append(f"file name {name!r} breaks the file name rule")
        errors += [
            f"folder {f!r} breaks the folder name rule" for f in folders if not FOLDER.match(f)
        ]
        full_id = "/".join([prefix, *folders, name[:6]])
        raw = tree[path].decode("utf-8", errors="replace")
        parsed = parse_front_matter(raw)
        if parsed is None:
            errors.append("no front matter")
            specs.append(_Parsed(path, full_id, {}, [], raw, raw, errors))
            continue
        meta, keys, body = parsed
        specs.append(_Parsed(path, full_id, meta, keys, body, raw, errors))
    return specs


def _check_meta(spec: _Parsed, ids: Mapping[str, _Parsed], files: Files) -> list[str]:
    """Return the violations of the front matter of one spec."""
    errors: list[str] = []
    meta = spec.meta
    if not spec.keys:
        return errors
    order = [k for k in KEYS if k in spec.keys]
    if spec.keys != order or set(spec.keys) - set(KEYS) or REQUIRED - set(spec.keys):
        errors.append(f"front matter keys or their order break the format: {spec.keys}")
    raw_id = spec.raw.split("\n", 2)[1]
    number = PurePosixPath(spec.path).name[:6]
    if raw_id != f'id: "{number}"':
        errors.append("id must be the quoted number of the file name")
    kind = _kind_of(spec.path)
    if kind is not None and meta.get("kind") != kind[1]:
        errors.append(f"kind {meta.get('kind')!r} does not match the folder")
    status = meta.get("status")
    if status not in STATUSES:
        errors.append(f"status {status!r} is not draft, approved, replaced or removed")
    if not isinstance(meta.get("updated"), str) or not DATE.match(str(meta.get("updated"))):
        errors.append("updated must be YYYY-MM-DD")
    replaced_by = meta.get("replaced_by")
    if (status == "replaced") != (replaced_by is not None):
        errors.append("replaced_by goes with status replaced only")
    if isinstance(replaced_by, str):
        target = ids.get(replaced_by)
        if not FULL_ID.match(replaced_by) or target is None:
            errors.append(f"replaced_by {replaced_by!r} is no full ID of a spec")
        elif target.meta.get("status") in ("replaced", "removed"):
            errors.append("replaced_by points to a rule that is not in force")
    for entry in _as_list(meta.get("tests")):
        if not TEST_ENTRY.match(entry) or entry.split(":")[0] not in files.paths:
            errors.append(f"tests entry {entry!r} names no test file")
    implementation = meta.get("implementation")
    if status in ("draft", "approved"):
        if implementation != "null" and (
            not isinstance(implementation, list) or not implementation
        ):
            errors.append("implementation must be a list of paths or null")
        elif isinstance(implementation, list):
            errors += [
                f"implementation path {p!r} does not exist"
                for p in implementation
                if not files.exists(p)
            ]
    elif implementation is not None:
        errors.append("implementation goes with status draft or approved only")
    scope = meta.get("scope")
    if not isinstance(scope, list) or not scope:
        errors.append("scope must be a list of paths")
    else:
        errors += [f"scope path {p!r} does not exist" for p in scope if not files.exists(p)]
        if len(set(scope)) != len(scope):
            errors.append("scope lists a path two times")
    return errors


def _check_body(spec: _Parsed) -> list[str]:
    """Return the violations of the heading, the labels and `must` of one spec."""
    if not spec.keys:
        return []
    errors: list[str] = []
    headings = [line for line in spec.body.splitlines() if line.startswith("#")]
    if headings != [f"# {spec.meta.get('title')}"]:
        errors.append("the body must have one # heading equal to the title")
    labels = LABEL.findall(spec.body)
    if labels not in ([], ["Reason"], ["Test"], ["Reason", "Test"]):
        errors.append("labels must be Reason, then Test, once each")
    rule_text = LABEL.split(spec.body, maxsplit=1)[0]
    if spec.meta.get("status") in ("draft", "approved") and not MUST.search(rule_text):
        errors.append("the rule text has no must or must not")
    return errors


def rule_text(body: str) -> str:
    """Return the body without its heading, with the lines of a paragraph joined.

    A paragraph that holds a list, a table, a quote or a code fence keeps its line breaks.
    """
    text = body.strip()
    if text.startswith("#"):
        text = text.split("\n", 1)[1].strip() if "\n" in text else ""
    paragraphs: list[str] = []
    for para in text.split("\n\n"):
        lines = para.split("\n")
        if not any(LIST_LINE.match(line) for line in lines):
            para = " ".join(line.strip() for line in lines)
        paragraphs.append(para)
    return "\n\n".join(paragraphs)


def _code_refs(files: Files, tree: Tree) -> list[dict[str, Any]]:
    """Return every `§` reference in the files outside `specs/`, in path order."""
    refs: list[dict[str, Any]] = []
    for path in sorted(tree):
        if path.startswith("specs/"):
            continue
        data = tree[path]
        if len(data) > MAX_SCAN_BYTES or "§".encode() not in data:
            continue
        try:
            lines = data.decode("utf-8").split("\n")
        except UnicodeDecodeError:
            continue
        for number, line in enumerate(lines, 1):
            for match in SECTION_REF.finditer(line):
                start = max(1, number - CONTEXT_LINES)
                refs.append(
                    {
                        "ref": match.group(1),
                        "path": path,
                        "line": number,
                        "text": line.strip()[:200],
                        "from": start,
                        "context": lines[start - 1 : number + CONTEXT_LINES],
                    }
                )
    return refs


def _test_ref(entry: str, files: Files) -> dict[str, Any]:
    """Return the file and the line of a test entry. The line is None when not found."""
    path, _, fn = entry.partition(":")
    out: dict[str, Any] = {"entry": entry, "path": path, "fn": fn, "line": None}
    out["exists"] = path in files.paths
    text = files.texts.get(path)
    if text is None or not fn:
        return out
    name = re.escape(fn.split(".")[-1])
    pattern = re.compile(rf"(\bdef|\bfunction|\bit\(|\btest\(|\bdescribe\()\s*['\"`]?{name}\b")
    for number, line in enumerate(text.split("\n"), 1):
        if pattern.search(line):
            out["line"] = number
            break
    return out


def _paths(values: list[str], files: Files) -> list[dict[str, Any]]:
    """Return each path with whether it exists at the commit."""
    return [{"path": p, "exists": files.exists(p)} for p in values]


def build_index(tree: Tree) -> dict[str, Any]:
    """Return the index of one commit: every spec and every reference that names no spec."""
    texts = {
        p: d.decode("utf-8", errors="replace")
        for p, d in tree.items()
        if p.endswith((".py", ".ts")) and len(d) <= MAX_SCAN_BYTES
    }
    files = Files(set(tree), _dirs(tree) | _submodules(tree), texts)
    parsed = _load(tree)
    ids = {s.full_id: s for s in parsed}
    numbers: dict[str, str] = {}
    for spec in parsed:
        number = PurePosixPath(spec.path).name[:6]
        if number in numbers:
            spec.errors.append(f"number used by {numbers[number]}")
        numbers.setdefault(number, spec.path)
        spec.errors += _check_meta(spec, ids, files) + _check_body(spec)

    refs = _code_refs(files, tree)
    by_spec: dict[str, list[dict[str, Any]]] = {}
    broken: list[dict[str, Any]] = []
    for ref in refs:
        if ref["ref"] in ids:
            by_spec.setdefault(ref["ref"], []).append(ref)
        else:
            broken.append(ref)

    specs: list[dict[str, Any]] = []
    for spec in sorted(parsed, key=lambda s: s.full_id):
        meta = spec.meta
        implementation = meta.get("implementation")
        replaced_by = meta.get("replaced_by")
        specs.append(
            {
                "id": spec.full_id,
                "num": PurePosixPath(spec.path).name[:6],
                "file": spec.path,
                "title": str(meta.get("title") or PurePosixPath(spec.path).name),
                "kind": str(meta.get("kind") or ""),
                "status": str(meta.get("status") or ""),
                "owner": str(meta.get("owner") or ""),
                "updated": str(meta.get("updated") or ""),
                "replacedBy": replaced_by if isinstance(replaced_by, str) else None,
                "tests": [_test_ref(t, files) for t in _as_list(meta.get("tests"))],
                "implementation": (
                    _paths(implementation, files) if isinstance(implementation, list) else None
                ),
                "scope": _paths(_as_list(meta.get("scope")), files),
                "body": rule_text(spec.body),
                "errors": spec.errors,
                "codeRefs": by_spec.get(spec.full_id, []),
                "mentions": sorted({m for m in MENTION.findall(spec.body) if m != spec.full_id}),
            }
        )
    for spec in specs:
        spec["mentionedBy"] = sorted(s["id"] for s in specs if spec["id"] in s["mentions"])
        spec["replaces"] = sorted(s["id"] for s in specs if s["replacedBy"] == spec["id"])
    return {"specs": specs, "broken": broken}
