---
id: "000022"
title: The detail lists the implementation paths
kind: functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-06
tests:
  - "backend/tests/test_specindex.py:test_implementation_paths"
implementation:
  - backend/app/specindex.py
  - frontend/src/app/spec-detail.component.html
scope:
  - backend
  - frontend
---

# The detail lists the implementation paths

The detail must list each path of `implementation` with a link to GitHub at the commit SHA. A
path that does not exist at the commit must show as `fehlt`.

Test: Unit test of the index builder.
