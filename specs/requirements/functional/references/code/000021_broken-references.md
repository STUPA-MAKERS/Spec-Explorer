---
id: "000021"
title: Broken references have their own list
kind: functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-06
implementation: null
scope:
  - backend
  - frontend
---

# Broken references have their own list

The page `Verweise` must list every `§` reference that names no spec at the source, with path
and line.

Reason: A reference to a missing rule is an error that no spec detail shows.

Test: Unit test of the index builder.
