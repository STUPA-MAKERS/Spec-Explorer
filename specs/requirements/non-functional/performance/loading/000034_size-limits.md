---
id: "000034"
title: Large archives and files are refused
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-06
tests:
  - "backend/tests/test_github.py:test_size_limits"
  - "backend/tests/test_github.py:test_size_limit_streamed"
  - "backend/tests/test_specindex.py:test_size_limit"
implementation:
  - backend/app/github.py
  - backend/app/specindex.py
scope:
  - backend
---

# Large archives and files are refused

The server must refuse a tarball larger than 200 MB with status 413. It must not search a file
larger than 1 MB for references.

Reason: A large archive must not use all memory of the server.

Test: Unit test of the index builder.
