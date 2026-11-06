"""The HTTP server: the read-only API and the built frontend on one port.

The configuration comes only from the environment (§NF/compatibility/deploy/000036):

- `GITHUB_TOKEN`: optional. Without it, GitHub allows 60 API requests per hour.
- `STATIC_DIR`: the folder of the built frontend. The default is `static` beside `app/`.

The server has no login, no session and no cookie (§NF/security/access/000028).
"""

from __future__ import annotations

import asyncio
import os
from collections.abc import AsyncGenerator, Awaitable, Callable
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

import httpx
from fastapi import FastAPI, Request, Response
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse, JSONResponse

from app.cache import IndexCache
from app.github import GitHub, NotFoundError, TooLargeError, UpstreamError
from app.specindex import build_index

# §F/sources/refs/000008: a URL without a source opens this repository.
DEFAULT_REPO = "STUPA-Workflow"
# §NF/security/access/000027: the only methods the server accepts.
READ_METHODS = frozenset({"GET", "HEAD"})
DEFAULT_STATIC = Path(__file__).resolve().parent.parent / "static"


def create_app(github: GitHub | None = None, static_dir: Path | None = None) -> FastAPI:
    """Return the app. Tests pass their own client and folder."""
    static = (static_dir or Path(os.environ.get("STATIC_DIR", DEFAULT_STATIC))).resolve()
    cache = IndexCache()
    state: dict[str, GitHub] = {}

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncGenerator[None]:
        if github is not None:
            state["github"] = github
            yield
            return
        async with httpx.AsyncClient(timeout=httpx.Timeout(30.0)) as client:
            state["github"] = GitHub(client, os.environ.get("GITHUB_TOKEN") or None)
            yield

    app = FastAPI(
        title="Spec-Explorer",
        lifespan=lifespan,
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
    )
    app.add_middleware(GZipMiddleware, minimum_size=1024)

    @app.middleware("http")
    async def read_only(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        if request.method not in READ_METHODS:
            return JSONResponse(
                {"detail": "Method Not Allowed"}, status_code=405, headers={"Allow": "GET, HEAD"}
            )
        try:
            return await call_next(request)
        except NotFoundError:
            return JSONResponse({"detail": "Not Found"}, status_code=404)
        except TooLargeError:
            return JSONResponse({"detail": "Content Too Large"}, status_code=413)
        except UpstreamError:
            return JSONResponse({"detail": "Bad Gateway"}, status_code=502)

    def gh() -> GitHub:
        return state["github"]

    @app.api_route("/api/repos", methods=["GET", "HEAD"])
    async def repos() -> dict[str, Any]:
        return {"repos": await gh().repos(), "default": DEFAULT_REPO}

    @app.api_route("/api/repos/{name}/refs", methods=["GET", "HEAD"])
    async def refs(name: str) -> dict[str, Any]:
        repo = await gh().repo(name)
        found = await gh().refs(repo)
        return {
            "repo": repo.name,
            "defaultBranch": repo.default_branch,
            "branches": found.branches,
            "tags": found.tags,
        }

    @app.api_route("/api/repos/{name}/index", methods=["GET", "HEAD"])
    async def index(name: str, ref: str | None = None) -> dict[str, Any]:
        repo = await gh().repo(name)
        wanted = ref or repo.default_branch
        sha = await gh().resolve(repo, wanted)

        async def build() -> dict[str, Any]:
            tree = await gh().tree(repo, sha)
            return await asyncio.to_thread(build_index, tree)

        built = await cache.get((repo.name, sha), build)
        return {"repo": repo.name, "ref": wanted, "sha": sha, **built}

    @app.api_route("/api/{rest:path}", methods=["GET", "HEAD"])
    async def api_not_found(rest: str) -> Response:
        return JSONResponse({"detail": "Not Found"}, status_code=404)

    @app.api_route("/{rest:path}", methods=["GET", "HEAD"])
    async def frontend(rest: str) -> Response:
        """Serve a built file, or `index.html` for a route of the app."""
        target = (static / rest).resolve()
        if rest and target.is_file() and target.is_relative_to(static):
            return FileResponse(target)
        page = static / "index.html"
        if not page.is_file():
            return JSONResponse({"detail": "Not Found"}, status_code=404)
        return FileResponse(page, headers={"Cache-Control": "no-cache"})

    return app


app = create_app()
