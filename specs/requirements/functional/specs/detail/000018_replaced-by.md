---
id: "000018"
title: A replaced spec links to its successor
kind: functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-24
tests:
  - "backend/tests/test_specindex.py:test_replaced_by"
implementation:
  - backend/app/specindex.py
  - frontend/src/app/spec-detail.component.ts
scope:
  - backend
  - frontend
---

# A replaced spec links to its successor

A spec with `replaced_by` must link to the new spec. The new spec must list every spec that it
replaces.

Test: Unit test of the index builder.
