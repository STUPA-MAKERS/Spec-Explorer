---
id: "000032"
title: One commit is loaded once
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-06
tests:
  - "backend/tests/test_cache.py:test_index_cache"
  - "backend/tests/test_github.py:test_tarball_index"
implementation:
  - backend/app/cache.py
  - backend/app/github.py
scope:
  - backend
---

# One commit is loaded once

The server must load a commit as one tarball and build its index once. It must keep the index
in a cache by commit SHA.

Reason: The files at a commit never change, so one download serves every later request.

Test: Unit test of the index cache.
