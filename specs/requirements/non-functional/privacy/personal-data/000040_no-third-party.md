---
id: "000040"
title: The browser loads nothing from other hosts
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-06
implementation: null
scope:
  - frontend
---

# The browser loads nothing from other hosts

The page must not load scripts, fonts or images from a different host.

Reason: A request to a different host tells that host who reads the specs.

Test: Unit test of the built index.html.
