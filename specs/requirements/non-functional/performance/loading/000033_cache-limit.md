---
id: "000033"
title: The cache holds at most 20 commits
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-06
tests:
  - "backend/tests/test_cache.py:test_cache_limit"
implementation:
  - backend/app/cache.py
scope:
  - backend
---

# The cache holds at most 20 commits

The index cache must hold at most 20 commits. When it is full, it must drop the commit with the
oldest use.

Test: Unit test of the index cache.
