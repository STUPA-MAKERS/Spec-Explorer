---
id: "000029"
title: The server calls only GitHub
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-06
tests:
  - "backend/tests/test_github.py:test_github_hosts"
implementation:
  - backend/app/github.py
scope:
  - backend
---

# The server calls only GitHub

The server must send requests only to `api.github.com` and `codeload.github.com`.

Reason: A fixed host list stops a crafted source from reaching internal hosts.

Test: Unit test of the HTTP client.
