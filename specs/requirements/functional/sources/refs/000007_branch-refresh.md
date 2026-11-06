---
id: "000007"
title: A branch resolves again after 60 seconds
kind: functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-06
tests:
  - "backend/tests/test_github.py:test_branch_refresh"
implementation:
  - backend/app/github.py
scope:
  - backend
---

# A branch resolves again after 60 seconds

The server must resolve a branch or a tag again when the last resolution is older than 60
seconds.

Reason: A push to a branch must show without a restart of the server.

Test: Unit test of the ref cache.
