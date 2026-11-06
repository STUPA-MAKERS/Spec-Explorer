"""The index cache: one built index per commit, at most `LIMIT` commits.

The files at a commit never change, so the server loads a commit once and serves every later
request from the cache (§NF/performance/loading/000032). When the cache is full, it drops the
commit with the oldest use (§NF/performance/loading/000033).
"""

from __future__ import annotations

import asyncio
from collections import OrderedDict
from collections.abc import Awaitable, Callable
from typing import Any

LIMIT = 20

Key = tuple[str, str]
Index = dict[str, Any]


class IndexCache:
    """An LRU cache of indexes by repository and commit SHA."""

    def __init__(self, limit: int = LIMIT) -> None:
        """Start with an empty cache."""
        self._limit = limit
        self._items: OrderedDict[Key, Index] = OrderedDict()
        self._locks: dict[Key, asyncio.Lock] = {}

    def __len__(self) -> int:
        """Return the number of cached commits."""
        return len(self._items)

    def __contains__(self, key: Key) -> bool:
        """Return whether the commit is in the cache."""
        return key in self._items

    async def get(self, key: Key, build: Callable[[], Awaitable[Index]]) -> Index:
        """Return the index of a commit. Build it once, also for parallel requests."""
        if key in self._items:
            self._items.move_to_end(key)
            return self._items[key]
        lock = self._locks.setdefault(key, asyncio.Lock())
        try:
            async with lock:
                if key in self._items:
                    self._items.move_to_end(key)
                    return self._items[key]
                index = await build()
                self._items[key] = index
                while len(self._items) > self._limit:
                    self._items.popitem(last=False)
                return index
        finally:
            if not lock.locked():
                self._locks.pop(key, None)
