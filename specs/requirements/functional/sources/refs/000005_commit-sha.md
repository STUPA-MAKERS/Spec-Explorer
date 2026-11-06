---
id: "000005"
title: A commit SHA has 7 to 40 hex characters
kind: functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-06
implementation: null
scope:
  - backend
---

# A commit SHA has 7 to 40 hex characters

A commit SHA must have 7 to 40 hexadecimal characters. A short SHA that matches more than one
commit must get status 404.

Reason: An ambiguous SHA does not name one state of the repository.

Test: Unit test of the ref resolver.
