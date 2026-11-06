---
id: "000014"
title: A file with a format error stays in the list
kind: functional
status: draft
owner: frederikbeimgraben
updated: 2026-11-06
implementation: null
scope:
  - backend
  - frontend
---

# A file with a format error stays in the list

A file that breaks the spec format must stay in the list with the status `Fehler`. Its detail
must show each violation.

Reason: A hidden file looks like a missing rule.

Test: Unit test of the index builder with broken files.
