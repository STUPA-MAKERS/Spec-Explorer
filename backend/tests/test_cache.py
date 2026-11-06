"""Tests of the index cache."""

# pyright: standard

from __future__ import annotations

import asyncio
from typing import Any

from app.cache import IndexCache


async def test_index_cache() -> None:
    """§NF/performance/loading/000032: one build per commit, also for parallel requests."""
    cache = IndexCache()
    builds = 0

    async def build() -> dict[str, Any]:
        nonlocal builds
        builds += 1
        await asyncio.sleep(0.01)
        return {"n": builds}

    results = await asyncio.gather(*(cache.get(("r", "a"), build) for _ in range(5)))
    assert builds == 1
    assert all(r == {"n": 1} for r in results)
    assert await cache.get(("r", "a"), build) == {"n": 1}
    assert builds == 1


async def test_cache_limit() -> None:
    """§NF/performance/loading/000033: at most 20 commits; the oldest use goes first."""
    cache = IndexCache()

    async def build() -> dict[str, Any]:
        return {}

    for i in range(20):
        await cache.get(("r", str(i)), build)
    await cache.get(("r", "0"), build)
    await cache.get(("r", "20"), build)
    assert len(cache) == 20
    assert ("r", "0") in cache
    assert ("r", "1") not in cache
