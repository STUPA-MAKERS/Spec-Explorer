---
id: "000014"
title: A file with a format error stays in the list
kind: functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-06
tests:
  - "backend/tests/test_specindex.py:test_format_error"
  - "backend/tests/test_specindex.py:test_format_error_rules"
  - "frontend/src/app/model.spec.ts:filterSpecs.formatError"
  - "frontend/src/app/spec-detail.component.spec.ts:SpecDetailComponent.formatError"
implementation:
  - backend/app/specindex.py
  - frontend/src/app/spec-detail.component.html
scope:
  - backend
  - frontend
---

# A file with a format error stays in the list

A file that breaks the spec format must stay in the list with the status `Fehler`. Its detail
must show each violation.

Reason: A hidden file looks like a missing rule.

Test: Unit test of the index builder with broken files.
