---
id: "000072"
title: The search finds rule ID and path of a reference
kind: functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-06
tests:
  - "frontend/src/app/model.spec.ts:references.refSearch"
implementation:
  - frontend/src/app/model.ts
scope:
  - frontend
---

# The search finds rule ID and path of a reference

The search of the page `Verweise` must match the rule ID and the file path of a reference. It
must ignore case.

Test: Unit test of the list filter.
