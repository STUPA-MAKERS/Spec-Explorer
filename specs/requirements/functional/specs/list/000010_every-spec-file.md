---
id: "000010"
title: The list shows every spec file
kind: functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-06
tests:
  - "backend/tests/test_specindex.py:test_every_spec_file"
implementation:
  - backend/app/specindex.py
scope:
  - backend
  - frontend
---

# The list shows every spec file

The list must show every `.md` file below the kind folders of `specs/` at the source. Each row
must show the rule ID, the title and the status.

Test: Unit test of the index builder.
