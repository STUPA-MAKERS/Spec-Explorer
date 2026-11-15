---
id: "000102"
title: The detail of a protocol spec shows version and media type
kind: functional
status: draft
owner: frederikbeimgraben
updated: 2026-11-15
tests:
  - "frontend/src/app/spec-detail.component.spec.ts:SpecDetailComponent.protocolHead"
implementation:
  - frontend/src/app/spec-detail.component.html
scope:
  - frontend
---

# The detail of a protocol spec shows version and media type

The head of the detail of a protocol spec must show `version` as `v<version>` and `media_type`
in the line of the front matter.

Test: Unit test of the detail page.
