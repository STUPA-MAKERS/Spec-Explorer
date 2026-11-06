---
id: "000006"
title: The page shows the commit of the source
kind: functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-06
tests:
  - "backend/tests/test_github.py:test_resolved_commit"
implementation:
  - backend/app/github.py
  - frontend/src/app/source.component.ts
scope:
  - backend
  - frontend
---

# The page shows the commit of the source

The server must resolve a branch or a tag to one commit SHA when it loads the source. The page
must show the first 7 characters of that SHA.

Reason: A branch moves. The SHA tells the reader which state of the repository the page shows.

Test: Unit test of the ref resolver.
