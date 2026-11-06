"""Tests of the HTTP routes."""

# pyright: standard

from __future__ import annotations

import io
import tarfile
from collections.abc import Iterator
from pathlib import Path

import httpx
import pytest
import respx
from fastapi.testclient import TestClient

from app.github import GitHub
from app.main import create_app
from tests.conftest import spec

API = "https://api.github.com"
BASE = f"{API}/repos/STUPA-MAKERS/STUPA-Workflow"
SHA = "c" * 40


def _tarball() -> bytes:
    buffer = io.BytesIO()
    files = {
        "specs/requirements/functional/area/topic/000001_first.md": spec("000001", "First"),
        "backend/x.py": "# \u00a7F/area/topic/000001\n".encode(),
    }
    with tarfile.open(fileobj=buffer, mode="w:gz") as archive:
        for name, data in files.items():
            info = tarfile.TarInfo(f"top/{name}")
            info.size = len(data)
            archive.addfile(info, io.BytesIO(data))
    return buffer.getvalue()


@pytest.fixture
def static(tmp_path: Path) -> Path:
    (tmp_path / "index.html").write_text("<html>app</html>")
    (tmp_path / "main.js").write_text("js")
    return tmp_path


@pytest.fixture
def mock() -> Iterator[respx.MockRouter]:
    with respx.mock(assert_all_called=False) as router:
        router.get(BASE).respond(
            json={
                "name": "STUPA-Workflow",
                "default_branch": "main",
                "private": False,
                "visibility": "public",
                "owner": {"login": "STUPA-MAKERS"},
            }
        )
        router.get(f"{BASE}/branches").respond(json=[{"name": "main"}])
        router.get(f"{BASE}/tags").respond(json=[])
        router.get(f"{BASE}/commits/main").respond(text=SHA)
        router.get(f"https://codeload.github.com/STUPA-MAKERS/STUPA-Workflow/tar.gz/{SHA}").respond(
            content=_tarball()
        )
        router.get(f"{API}/orgs/STUPA-MAKERS/repos").respond(
            json=[{"name": "STUPA-Workflow", "visibility": "public"}]
        )
        yield router


@pytest.fixture
def client(static: Path, mock: respx.MockRouter):
    github = GitHub(httpx.AsyncClient(), token="top-secret")
    with TestClient(create_app(github, static)) as c:
        yield c


def test_read_only(client: TestClient) -> None:
    """§NF/security/access/000027: only GET and HEAD; other methods give 405."""
    for method in ("POST", "PUT", "PATCH", "DELETE", "OPTIONS"):
        assert client.request(method, "/api/repos").status_code == 405
        assert client.request(method, "/").status_code == 405
    assert client.head("/api/repos").status_code == 200


def test_default_source(client: TestClient) -> None:
    """§F/sources/refs/000008: without a ref, the index is the default branch."""
    data = client.get("/api/repos/STUPA-Workflow/index").json()
    assert data["ref"] == "main"
    assert data["sha"] == SHA
    assert [s["id"] for s in data["specs"]] == ["F/area/topic/000001"]
    assert data["specs"][0]["codeRefs"][0]["path"] == "backend/x.py"
    assert client.get("/api/repos").json() == {
        "repos": ["STUPA-Workflow"],
        "default": "STUPA-Workflow",
    }
    refs = client.get("/api/repos/STUPA-Workflow/refs").json()
    assert refs == {
        "repo": "STUPA-Workflow",
        "defaultBranch": "main",
        "branches": ["main"],
        "tags": [],
    }


def test_token_not_in_responses(client: TestClient) -> None:
    """§NF/security/network/000030: no answer of the server holds the token."""
    for path in ("/api/repos", "/api/repos/STUPA-Workflow/refs", "/api/repos/STUPA-Workflow/index"):
        response = client.get(path)
        assert "top-secret" not in response.text
        assert "top-secret" not in str(response.headers)


def test_errors(client: TestClient, mock: respx.MockRouter) -> None:
    """Unknown sources give 404, a large tarball 413, a GitHub failure 502."""
    mock.get(f"{API}/repos/STUPA-MAKERS/Nope").respond(404)
    assert client.get("/api/repos/Nope/index").status_code == 404
    assert client.get("/api/repos/STUPA-Workflow/index?ref=zzz").status_code == 404
    assert client.get("/api/unknown").status_code == 404
    mock.get(f"{BASE}/commits/{'d' * 40}").respond(text="d" * 40)
    mock.get(f"https://codeload.github.com/STUPA-MAKERS/STUPA-Workflow/tar.gz/{'d' * 40}").respond(
        headers={"Content-Length": str(300 * 1024 * 1024)}
    )
    assert client.get("/api/repos/STUPA-Workflow/index?ref=" + "d" * 40).status_code == 413
    mock.get(f"{BASE}/commits/{'e' * 40}").respond(500)
    assert client.get("/api/repos/STUPA-Workflow/index?ref=" + "e" * 40).status_code == 502


def test_frontend_routes(client: TestClient, tmp_path: Path) -> None:
    """A file of the build is served; every other path gets index.html."""
    assert client.get("/main.js").text == "js"
    page = client.get("/STUPA-Workflow/claude%2Fx/F/area/topic/000001")
    assert page.text == "<html>app</html>"
    assert client.get("/../../etc/passwd").text == "<html>app</html>"
    assert client.get("/").text == "<html>app</html>"


def test_no_frontend(mock: respx.MockRouter, tmp_path: Path) -> None:
    """Without a build, a page path gives 404."""
    with TestClient(create_app(GitHub(httpx.AsyncClient()), tmp_path / "none")) as c:
        assert c.get("/").status_code == 404


def test_no_cookie(client: TestClient) -> None:
    """§NF/security/access/000028: the server sets no cookie."""
    for path in ("/", "/api/repos", "/api/repos/STUPA-Workflow/index"):
        assert "set-cookie" not in client.get(path).headers
