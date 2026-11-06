---
id: "000017"
title: The detail links to the spec file
kind: functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-06
tests:
  - "frontend/src/app/spec-detail.component.spec.ts:SpecDetailComponent.fileLink"
  - "frontend/src/app/model.spec.ts:blobUrl.fileLink"
implementation:
  - frontend/src/app/spec-detail.component.ts
  - frontend/src/app/model.ts
scope:
  - frontend
---

# The detail links to the spec file

The detail must link to the spec file on GitHub at the commit SHA of the source.

Reason: A link to a branch shows a different text after the next push.

Test: Unit test of the detail page.
