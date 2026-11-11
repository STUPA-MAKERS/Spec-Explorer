---
id: "000098"
title: An element opens a detail with its path and its specs
kind: functional
status: draft
owner: frederikbeimgraben
updated: 2026-11-11
implementation: null
scope:
  - frontend
---

# An element opens a detail with its path and its specs

A click on an element, in the diagram or in the list, must open its detail in the right column.
The detail must show the name, the attributes, the `path` as a link to the file on GitHub at the
resolved commit, the lines to and from the element as links to the other elements, and the
section `Specs`: every spec whose `implementation` holds the path of the element or a
folder above it.

Reason: The view answers which rules control a part of the code, the same question that the
references of a spec answer in the other direction.

Test: Unit test of the spec match by path, unit test of the detail.
