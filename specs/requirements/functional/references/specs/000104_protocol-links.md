---
id: "000104"
title: The detail lists the protocols of a rule and the rules of a protocol
kind: functional
status: draft
owner: frederikbeimgraben
updated: 2026-11-15
tests:
  - "backend/tests/test_specindex.py:test_protocol_links"
implementation:
  - backend/app/specindex.py
  - frontend/src/app/spec-detail.component.ts
scope:
  - backend
  - frontend
---

# The detail lists the protocols of a rule and the rules of a protocol

The detail of a spec must list each protocol spec of its `protocols` key. The detail of a
protocol spec must list each spec that names it in `protocols`. Each entry must link to the
spec.

Test: Unit test of the index builder.
