---
id: "000100"
title: The list shows the protocol specs
kind: functional
status: draft
owner: frederikbeimgraben
updated: 2026-11-15
tests:
  - "backend/tests/test_specindex.py:test_protocol_specs"
implementation:
  - backend/app/specindex.py
  - frontend/src/app/model.ts
  - frontend/src/app/i18n.ts
scope:
  - backend
  - frontend
---

# The list shows the protocol specs

The list must show every `.md` file below `specs/protocols/` as a spec of the kind `protocol`
with the ID `P/<area>/<topic>/<number>`. The kind filter must offer the kind with the label
`Schnittstelle` in German and `Protocol` in English.

Reason: The rules of the spec format know a fourth kind for data exchange formats. The German
word `Protokoll` already names the meeting protocol of the app.

Test: Unit test of the index builder.
