---
id: "000011"
title: The list groups by kind, area and topic
kind: functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-06
tests:
  - "frontend/src/app/model.spec.ts:groupSpecs.treeGroups"
implementation:
  - frontend/src/app/model.ts
scope:
  - frontend
---

# The list groups by kind, area and topic

The list must group the specs by kind, then by area and topic, in the order of
`specs/README.md`. Inside a topic, the list must sort by number.

Reason: The reader finds a rule at the same place as in the repository.

Test: Unit test of the list groups.
