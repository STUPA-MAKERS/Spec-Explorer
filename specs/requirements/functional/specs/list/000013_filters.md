---
id: "000013"
title: The list filters by status and kind
kind: functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-06
tests:
  - "frontend/src/app/model.spec.ts:filterSpecs.statusAndKind"
implementation:
  - frontend/src/app/model.ts
  - frontend/src/app/explorer.component.html
scope:
  - frontend
---

# The list filters by status and kind

The list must have one filter for the status and one filter for the kind. Without a filter, the
list must show every status.

Test: Unit test of the list filter.
