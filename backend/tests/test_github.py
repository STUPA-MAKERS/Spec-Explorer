"""Tests of the GitHub client and the ref resolver."""

# pyright: standard

from __future__ import annotations

import io
import tarfile

import httpx
import pytest
import respx

from app.github import (
    MAX_FILE_BYTES,
    MAX_TARBALL_BYTES,
    GitHub,
    NotFoundError,
    Repo,
    TooLargeError,
    UpstreamError,
)

API = "https://api.github.com"
BASE = f"{API}/repos/STUPA-MAKERS/Demo"
SHA = "a" * 40
REPO = Repo("Demo", "main")


class Clock:
    """A clock that a test moves by hand."""

    def __init__(self) -> None:
        self.now = 0.0

    def __call__(self) -> float:
        return self.now


def _repo_json(**kw: object) -> dict[str, object]:
    data: dict[str, object] = {
        "name": "Demo",
        "default_branch": "main",
        "private": False,
        "visibility": "public",
        "owner": {"login": "STUPA-MAKERS"},
    }
    data.update(kw)
    return data


def _refs(mock: respx.MockRouter, branches: list[str], tags: list[str]) -> None:
    mock.get(f"{BASE}/branches").respond(json=[{"name": b} for b in branches])
    mock.get(f"{BASE}/tags").respond(json=[{"name": t} for t in tags])


@pytest.fixture
async def client():
    async with httpx.AsyncClient() as c:
        yield c


@respx.mock
async def test_org_allow_list(client: httpx.AsyncClient) -> None:
    """§F/sources/repositories/000001: a repository of a different owner gives 404."""
    respx.get(BASE).respond(json=_repo_json(owner={"login": "someone"}))
    with pytest.raises(NotFoundError):
        await GitHub(client).repo("Demo")
    with pytest.raises(NotFoundError):
        await GitHub(client).repo("../other")


@respx.mock
async def test_public_only(client: httpx.AsyncClient) -> None:
    """§F/sources/repositories/000002: private, internal and unknown repositories give 404."""
    gh = GitHub(client, token="t")
    respx.get(BASE).respond(json=_repo_json(private=True, visibility="private"))
    with pytest.raises(NotFoundError):
        await gh.repo("Demo")
    respx.get(BASE).respond(json=_repo_json(visibility="internal"))
    with pytest.raises(NotFoundError):
        await gh.repo("Demo")
    respx.get(BASE).respond(404)
    with pytest.raises(NotFoundError):
        await gh.repo("Demo")
    respx.get(BASE).respond(json=_repo_json())
    assert await gh.repo("Demo") == REPO


@respx.mock
async def test_repository_list(client: httpx.AsyncClient) -> None:
    """§F/sources/repositories/000003: the public repositories, sorted by name."""
    page1 = [{"name": f"r{i:03}", "visibility": "public"} for i in range(100)]
    page2 = [
        {"name": "ui-kit", "visibility": "public"},
        {"name": "STUPA-Workflow", "visibility": "public"},
        {"name": "secret", "visibility": "private", "private": True},
    ]
    route = respx.get(f"{API}/orgs/STUPA-MAKERS/repos")
    route.side_effect = [httpx.Response(200, json=page1), httpx.Response(200, json=page2)]
    names = await GitHub(client).repos()
    assert names[-2:] == ["STUPA-Workflow", "ui-kit"]
    assert "secret" not in names
    assert len(names) == 102


@respx.mock
async def test_ref_kinds(client: httpx.AsyncClient) -> None:
    """§F/sources/refs/000004: a branch, a tag or a SHA; other refs give 404."""
    _refs(respx.mock, ["main", "claude/x"], ["v2026.11.9", "v2026.11.10"])
    respx.get(f"{BASE}/commits/claude%2Fx").respond(text=SHA)
    respx.get(f"{BASE}/commits/v2026.11.10").respond(text=SHA)
    gh = GitHub(client)
    refs = await gh.refs(REPO)
    assert refs.branches == ["claude/x", "main"]
    assert refs.tags == ["v2026.11.10", "v2026.11.9"]
    assert await gh.resolve(REPO, "claude/x") == SHA
    assert await gh.resolve(REPO, "v2026.11.10") == SHA
    with pytest.raises(NotFoundError):
        await gh.resolve(REPO, "no-branch")


@respx.mock
async def test_commit_sha(client: httpx.AsyncClient) -> None:
    """§F/sources/refs/000005: 7 to 40 hex characters; an ambiguous SHA gives 404."""
    _refs(respx.mock, ["main"], [])
    respx.get(f"{BASE}/commits/abcdef1").respond(text=SHA)
    respx.get(f"{BASE}/commits/abcdef2").respond(422)
    gh = GitHub(client)
    assert await gh.resolve(REPO, "abcdef1") == SHA
    with pytest.raises(NotFoundError):
        await gh.resolve(REPO, "abcdef2")
    with pytest.raises(NotFoundError):
        await gh.resolve(REPO, "abcdef")
    with pytest.raises(NotFoundError):
        await gh.resolve(REPO, "a" * 41)


@respx.mock
async def test_resolved_commit(client: httpx.AsyncClient) -> None:
    """§F/sources/refs/000006: a branch resolves to one full SHA; a bad answer is an error."""
    _refs(respx.mock, ["main", "odd"], [])
    respx.get(f"{BASE}/commits/main").respond(text=SHA + "\n")
    respx.get(f"{BASE}/commits/odd").respond(text="not a sha")
    gh = GitHub(client)
    assert await gh.resolve(REPO, "main") == SHA
    with pytest.raises(UpstreamError):
        await gh.resolve(REPO, "odd")


@respx.mock
async def test_branch_refresh(client: httpx.AsyncClient) -> None:
    """§F/sources/refs/000007: a branch resolves again after 60 seconds, a full SHA never."""
    _refs(respx.mock, ["main"], [])
    route = respx.get(f"{BASE}/commits/main")
    route.side_effect = [httpx.Response(200, text=SHA), httpx.Response(200, text="b" * 40)]
    clock = Clock()
    gh = GitHub(client, clock=clock)
    assert await gh.resolve(REPO, "main") == SHA
    clock.now = 59
    assert await gh.resolve(REPO, "main") == SHA
    clock.now = 61
    assert await gh.resolve(REPO, "main") == "b" * 40
    full = respx.get(f"{BASE}/commits/{SHA}").respond(text=SHA)
    assert await gh.resolve(REPO, SHA) == SHA
    clock.now = 1000
    assert await gh.resolve(REPO, SHA) == SHA
    assert full.call_count == 1


@respx.mock
async def test_github_hosts(client: httpx.AsyncClient) -> None:
    """§NF/security/network/000029: only api.github.com and codeload.github.com."""
    gh = GitHub(client)
    with pytest.raises(UpstreamError):
        await gh._get(  # pyright: ignore[reportPrivateUsage]
            "https://example.org/x"
        )
    with pytest.raises(UpstreamError):
        await gh._download(  # pyright: ignore[reportPrivateUsage]
            "http://169.254.169.254/x", io.BytesIO()
        )
    respx.get(f"{BASE}/branches").respond(301, headers={"Location": "https://example.org/"})
    with pytest.raises(UpstreamError):
        await gh.refs(REPO)


@respx.mock
async def test_token_server_only(client: httpx.AsyncClient) -> None:
    """§NF/security/network/000030: the token goes only to api.github.com."""
    api = respx.get(BASE).respond(json=_repo_json())
    load = respx.get(f"https://codeload.github.com/STUPA-MAKERS/Demo/tar.gz/{SHA}").respond(
        content=_tarball({"a.txt": b"a"})
    )
    gh = GitHub(client, token="secret")
    await gh.repo("Demo")
    await gh.tree(REPO, SHA)
    assert api.calls[0].request.headers["Authorization"] == "Bearer secret"
    assert "Authorization" not in load.calls[0].request.headers
    anonymous = GitHub(client)
    respx.get(f"{API}/repos/STUPA-MAKERS/Other").respond(json=_repo_json(name="Other"))
    await anonymous.repo("Other")
    assert "Authorization" not in respx.calls[-1].request.headers


def _tarball(files: dict[str, bytes]) -> bytes:
    buffer = io.BytesIO()
    with tarfile.open(fileobj=buffer, mode="w:gz") as archive:
        folder = tarfile.TarInfo("Demo-aaaa")
        folder.type = tarfile.DIRTYPE
        archive.addfile(folder)
        for name, data in files.items():
            info = tarfile.TarInfo(f"Demo-aaaa/{name}")
            info.size = len(data)
            archive.addfile(info, io.BytesIO(data))
    return buffer.getvalue()


@respx.mock
async def test_tarball_index(client: httpx.AsyncClient) -> None:
    """§NF/performance/loading/000032: one tarball gives every file without the top folder."""
    big = b"x" * (MAX_FILE_BYTES + 1)
    respx.get(f"https://codeload.github.com/STUPA-MAKERS/Demo/tar.gz/{SHA}").respond(
        content=_tarball({"specs/a.md": b"a", "big.bin": big})
    )
    files = await GitHub(client).tree(REPO, SHA)
    assert files == {"specs/a.md": b"a", "big.bin": b""}
    with pytest.raises(NotFoundError):
        await GitHub(client).tree(REPO, "main")


@respx.mock
async def test_size_limits(client: httpx.AsyncClient) -> None:
    """§NF/performance/loading/000034: a tarball above 200 MB gives TooLargeError."""
    url = f"https://codeload.github.com/STUPA-MAKERS/Demo/tar.gz/{SHA}"
    respx.get(url).respond(headers={"Content-Length": str(MAX_TARBALL_BYTES + 1)}, content=b"")
    with pytest.raises(TooLargeError):
        await GitHub(client).tree(REPO, SHA)


@respx.mock
async def test_size_limit_streamed(
    client: httpx.AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """§NF/performance/loading/000034: the limit holds also without Content-Length."""
    monkeypatch.setattr("app.github.MAX_TARBALL_BYTES", 10)

    class Chunks(httpx.AsyncByteStream):
        async def __aiter__(self):
            yield b"0123456789"
            yield b"x"

    url = f"https://codeload.github.com/STUPA-MAKERS/Demo/tar.gz/{SHA}"
    respx.get(url).respond(stream=Chunks())
    with pytest.raises(TooLargeError):
        await GitHub(client).tree(REPO, SHA)


@respx.mock
async def test_upstream_errors(client: httpx.AsyncClient) -> None:
    """A broken tarball or an error status of GitHub gives UpstreamError or NotFoundError."""
    url = f"https://codeload.github.com/STUPA-MAKERS/Demo/tar.gz/{SHA}"
    respx.get(url).respond(content=b"not a tarball")
    with pytest.raises(UpstreamError):
        await GitHub(client).tree(REPO, SHA)
    respx.get(url).respond(404)
    with pytest.raises(NotFoundError):
        await GitHub(client).tree(REPO, SHA)
    respx.get(url).respond(500)
    with pytest.raises(UpstreamError):
        await GitHub(client).tree(REPO, SHA)
    respx.get(f"{BASE}/branches").respond(404)
    with pytest.raises(NotFoundError):
        await GitHub(client).refs(REPO)


@respx.mock
async def test_repo_cache(client: httpx.AsyncClient) -> None:
    """A repository answer is kept for 60 seconds."""
    route = respx.get(BASE).respond(json=_repo_json())
    clock = Clock()
    gh = GitHub(client, clock=clock)
    await gh.repo("Demo")
    await gh.repo("demo")
    assert route.call_count == 1
    clock.now = 61
    await gh.repo("Demo")
    assert route.call_count == 2
