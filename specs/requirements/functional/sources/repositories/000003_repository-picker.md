---
id: "000003"
title: The repository picker lists the public repositories
kind: functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-06
tests:
  - "backend/tests/test_github.py:test_repository_list"
implementation:
  - backend/app/github.py
  - frontend/src/app/source.component.ts
scope:
  - backend
  - frontend
---

# The repository picker lists the public repositories

The repository picker must list every public repository of `STUPA-MAKERS`. It must sort them by
name.

Test: Unit test of the repository list.
