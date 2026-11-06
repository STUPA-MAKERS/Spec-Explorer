---
id: "000008"
title: The default source is the default branch of STUPA-Workflow
kind: functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-06
tests:
  - "frontend/src/app/routes.spec.ts:routes.defaultSource"
  - "backend/tests/test_api.py:test_default_source"
implementation:
  - frontend/src/app/routes.ts
  - backend/app/main.py
scope:
  - frontend
---

# The default source is the default branch of STUPA-Workflow

A URL without a source must open the default branch of `STUPA-MAKERS/STUPA-Workflow`.

Test: Unit test of the routes.
