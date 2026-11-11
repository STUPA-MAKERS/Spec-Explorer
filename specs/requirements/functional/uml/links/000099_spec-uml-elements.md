---
id: "000099"
title: The detail of a spec lists its UML elements
kind: functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-11
implementation: null
scope:
  - frontend
---

# The detail of a spec lists its UML elements

The detail of a spec must show the section `UML` in the right column after `Andere Specs`. The
section must list each UML element whose path is below a path of the `implementation` of the
spec, with the view, and each entry must open the element in its view. A spec without such an
element must not show the section.

Reason: A reader of a rule sees at once which modules, models or services it controls.

Test: Unit test of the spec detail.
