---
id: "000097"
title: Each view has a list with the same content
kind: functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-11
implementation: null
scope:
  - frontend
---

# Each view has a list with the same content

Each view must have the segments `Diagramm` and `Liste`. The list must show each element of the
view with its name and attributes, and below it the lines that start or end at the element. A
screen reader and the keyboard must reach every element and every line in the list. The SVG
diagram must have a text name and must point to the list.

Reason: A diagram alone is not a text alternative (WCAG 2.2 1.1.1), and a large diagram is hard
to read on a phone.

Test: axe test of both segments, unit test that the list holds each element and edge of a view.
