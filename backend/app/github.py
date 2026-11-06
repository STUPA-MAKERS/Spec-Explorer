"""The read access to GitHub: repositories, refs and the tarball of a commit.

Every request goes through `GitHub._get`, which accepts only the hosts of `ALLOWED_HOSTS`
and never follows a redirect, so a crafted source cannot reach a different host.
"""

from __future__ import annotations

import re
import tarfile
import tempfile
import time
from collections.abc import Callable
from dataclasses import dataclass
from typing import IO
from urllib.parse import quote, urlsplit

import httpx

ORG = "STUPA-MAKERS"
API = "https://api.github.com"
CODELOAD = "https://codeload.github.com"
# §NF/security/network/000029: the only hosts the server sends requests to.
ALLOWED_HOSTS = frozenset({"api.github.com", "codeload.github.com"})
# §F/sources/refs/000005: a commit SHA has 7 to 40 hexadecimal characters.
SHA = re.compile(r"^[0-9a-fA-F]{7,40}$")
FULL_SHA = re.compile(r"^[0-9a-f]{40}$")
REPO_NAME = re.compile(r"^[A-Za-z0-9._-]{1,100}$")
# §F/sources/refs/000007: a branch or a tag resolves again after 60 seconds.
REF_TTL = 60.0
# §NF/performance/loading/000034: the largest tarball the server reads.
MAX_TARBALL_BYTES = 200 * 1024 * 1024
MAX_FILE_BYTES = 1_000_000
PAGE_SIZE = 100
MAX_PAGES = 50


class NotFoundError(Exception):
    """The source does not exist or the server must not read it."""


class TooLargeError(Exception):
    """The tarball of the commit is larger than `MAX_TARBALL_BYTES`."""


class UpstreamError(Exception):
    """GitHub sent an answer that the server cannot use."""


@dataclass(frozen=True)
class Repo:
    """A public repository of the organization."""

    name: str
    default_branch: str


@dataclass(frozen=True)
class Refs:
    """The branches and the tags of a repository."""

    branches: list[str]
    tags: list[str]


def _version_key(tag: str) -> list[tuple[int, int | str]]:
    """Sort key that puts `v2026.11.10` after `v2026.11.9`."""
    return [(0, int(p)) if p.isdigit() else (1, p) for p in re.split(r"[.\-v]", tag) if p]


class GitHub:
    """A small GitHub client with the caches of the ref resolver.

    The token comes only from the environment. It goes only into the header of a request to
    `api.github.com`, never into an answer of the server (§NF/security/network/000030).
    """

    def __init__(
        self,
        client: httpx.AsyncClient,
        token: str | None = None,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        """Keep the HTTP client, the token and the clock of the caches."""
        self._client = client
        self._token = token
        self._clock = clock
        self._resolved: dict[tuple[str, str], tuple[str, float]] = {}
        self._refs: dict[str, tuple[Refs, float]] = {}
        self._repos: dict[str, tuple[Repo, float]] = {}

    async def _get(self, url: str, accept: str = "application/vnd.github+json") -> httpx.Response:
        """Send one GET request to an allowed host."""
        host = urlsplit(url).hostname
        if host not in ALLOWED_HOSTS:
            raise UpstreamError(f"host {host!r} is not allowed")
        headers = {"Accept": accept, "X-GitHub-Api-Version": "2022-11-28"}
        if self._token and host == "api.github.com":
            headers["Authorization"] = f"Bearer {self._token}"
        return await self._client.get(url, headers=headers, follow_redirects=False)

    async def _pages(self, url: str) -> list[dict[str, object]]:
        """Return every item of a paged list, 100 items per page.

        The server counts the pages itself and does not follow the `Link` header, because
        GitHub writes its next page as `/repositories/<id>/…`, a path that names no owner.
        """
        items: list[dict[str, object]] = []
        page = 1
        while True:
            page_url = f"{url}{'&' if '?' in url else '?'}per_page={PAGE_SIZE}&page={page}"
            response = await self._get(page_url)
            if response.status_code == 404:
                raise NotFoundError(url)
            if response.status_code != 200:
                raise UpstreamError(f"{url}: status {response.status_code}")
            batch: list[dict[str, object]] = response.json()
            items += batch
            if len(batch) < PAGE_SIZE or page >= MAX_PAGES:
                return items
            page += 1

    async def repos(self) -> list[str]:
        """Return the public repositories of the organization, sorted by name.

        §F/sources/repositories/000003
        """
        items = await self._pages(f"{API}/orgs/{ORG}/repos?type=public")
        names = [
            str(i["name"])
            for i in items
            if i.get("visibility") == "public" and not i.get("private")
        ]
        return sorted(names, key=str.lower)

    async def repo(self, name: str) -> Repo:
        """Return a repository of the organization, or raise NotFoundError.

        §F/sources/repositories/000001 and §F/sources/repositories/000002: a different owner, a
        private or an internal repository gives NotFoundError, also when the token can read it.
        """
        if not REPO_NAME.match(name):
            raise NotFoundError(name)
        cached = self._repos.get(name.lower())
        if cached and self._clock() - cached[1] < REF_TTL:
            return cached[0]
        response = await self._get(f"{API}/repos/{ORG}/{quote(name, safe='')}")
        if response.status_code != 200:
            raise NotFoundError(name)
        data = response.json()
        owner = str(data.get("owner", {}).get("login", ""))
        if (
            owner.lower() != ORG.lower()
            or data.get("private")
            or data.get("visibility") != "public"
        ):
            raise NotFoundError(name)
        repo = Repo(str(data["name"]), str(data["default_branch"]))
        self._repos[name.lower()] = (repo, self._clock())
        return repo

    async def refs(self, repo: Repo) -> Refs:
        """Return the branches and the tags of a repository. §F/sources/refs/000004."""
        cached = self._refs.get(repo.name)
        if cached and self._clock() - cached[1] < REF_TTL:
            return cached[0]
        base = f"{API}/repos/{ORG}/{quote(repo.name, safe='')}"
        branches = [str(b["name"]) for b in await self._pages(f"{base}/branches")]
        tags = [str(t["name"]) for t in await self._pages(f"{base}/tags")]
        refs = Refs(sorted(branches), sorted(tags, key=_version_key, reverse=True))
        self._refs[repo.name] = (refs, self._clock())
        return refs

    async def resolve(self, repo: Repo, ref: str) -> str:
        """Return the full commit SHA of a branch, a tag or a commit SHA.

        A branch or a tag resolves again after `REF_TTL` seconds (§F/sources/refs/000007). A
        ref that is no branch, no tag and no SHA of 7 to 40 characters, and a short SHA that
        matches more than one commit, give NotFoundError (§F/sources/refs/000005).
        """
        key = (repo.name, ref)
        cached = self._resolved.get(key)
        if cached and (FULL_SHA.match(ref) or self._clock() - cached[1] < REF_TTL):
            return cached[0]
        refs = await self.refs(repo)
        if ref not in refs.branches and ref not in refs.tags and not SHA.match(ref):
            raise NotFoundError(ref)
        url = f"{API}/repos/{ORG}/{quote(repo.name, safe='')}/commits/{quote(ref, safe='')}"
        response = await self._get(url, accept="application/vnd.github.sha")
        if response.status_code in (404, 409, 422):
            raise NotFoundError(ref)
        sha = response.text.strip()
        if response.status_code != 200 or not FULL_SHA.match(sha):
            raise UpstreamError(f"{url}: status {response.status_code}")
        if len(self._resolved) > 1000:
            self._resolved.clear()
        self._resolved[key] = (sha, self._clock())
        return sha

    async def tree(self, repo: Repo, sha: str) -> dict[str, bytes]:
        """Load the tarball of a commit and return its files up to `MAX_FILE_BYTES` each.

        A larger file is in the result with no content, so that its path still exists. A
        tarball larger than `MAX_TARBALL_BYTES` gives TooLargeError
        (§NF/performance/loading/000034).
        """
        if not FULL_SHA.match(sha):
            raise NotFoundError(sha)
        url = f"{CODELOAD}/{ORG}/{quote(repo.name, safe='')}/tar.gz/{sha}"
        with tempfile.SpooledTemporaryFile(max_size=16 * 1024 * 1024) as buffer:
            await self._download(url, buffer)
            buffer.seek(0)
            return _read_tar(buffer)

    async def _download(self, url: str, buffer: IO[bytes]) -> None:
        """Stream a tarball into the buffer and stop at `MAX_TARBALL_BYTES`."""
        if urlsplit(url).hostname not in ALLOWED_HOSTS:
            raise UpstreamError(url)
        async with self._client.stream("GET", url, follow_redirects=False) as response:
            if response.status_code == 404:
                raise NotFoundError(url)
            if response.status_code != 200:
                raise UpstreamError(f"{url}: status {response.status_code}")
            length = response.headers.get("content-length")
            if length and length.isdigit() and int(length) > MAX_TARBALL_BYTES:
                raise TooLargeError(url)
            size = 0
            async for chunk in response.aiter_bytes():
                size += len(chunk)
                if size > MAX_TARBALL_BYTES:
                    raise TooLargeError(url)
                buffer.write(chunk)


def _read_tar(buffer: IO[bytes]) -> dict[str, bytes]:
    """Return the regular files of a GitHub tarball, without its top folder."""
    files: dict[str, bytes] = {}
    try:
        with tarfile.open(fileobj=buffer, mode="r:gz") as archive:
            for member in archive:
                if not member.isfile():
                    continue
                _, _, path = member.name.partition("/")
                if not path:
                    continue
                if member.size > MAX_FILE_BYTES:
                    files[path] = b""
                    continue
                handle = archive.extractfile(member)
                files[path] = handle.read() if handle else b""
    except (tarfile.TarError, EOFError, OSError) as error:
        raise UpstreamError("broken tarball") from error
    return files
