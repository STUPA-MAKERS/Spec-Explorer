---
id: "000101"
title: A protocol spec shows its format errors
kind: functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-15
tests:
  - "backend/tests/test_specindex.py:test_protocol_format_errors"
implementation:
  - backend/app/specindex.py
scope:
  - backend
---

# A protocol spec shows its format errors

The index must report a protocol spec without `version` or `media_type`, without the sections
`## Transport`, `## Schema`, `## Example` and `## Compatibility` in this order, or without the
schema file of a JSON format. It must report a `protocols` entry that names no protocol spec.

Reason: The explorer and `scripts/check_specs.py` of the source must report the same errors.

Test: Unit test of the index builder.
