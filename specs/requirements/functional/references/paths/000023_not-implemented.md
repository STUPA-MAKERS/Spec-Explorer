---
id: "000023"
title: A spec without implementation shows it
kind: functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-06
tests:
  - "backend/tests/test_specindex.py:test_not_implemented"
  - "frontend/src/app/spec-detail.component.spec.ts:SpecDetailComponent.notImplemented"
implementation:
  - frontend/src/app/spec-detail.component.html
scope:
  - frontend
---

# A spec without implementation shows it

A spec with `implementation: null` must show `Nicht umgesetzt` in place of the paths.

Test: Unit test of the detail page.
