---
id: "000103"
title: The detail shows the schema as a field table and as raw JSON
kind: functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-24
tests:
  - "backend/tests/test_specindex.py:test_protocol_schema"
  - "frontend/src/app/model.spec.ts:schemaFields.fieldTable"
implementation:
  - backend/app/specindex.py
  - frontend/src/app/model.ts
  - frontend/src/app/spec-detail.component.ts
scope:
  - backend
  - frontend
---

# The detail shows the schema as a field table and as raw JSON

The detail of a protocol spec with a schema file must show a table with one row for each field
of the schema: the path, the type, whether it is required and the description. A nested field
must have the path of its parent, a `.` and its name. An item of an array must have `[]` after
the path of the array. Below the table, the raw schema must open on demand.

Reason: The table reads like documentation. The raw schema is for tools and for the details
that the table leaves out.

Test: Unit test of the index builder and of the field table.
