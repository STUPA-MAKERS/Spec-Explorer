---
id: "000026"
title: The detail lists the specs that name each other
kind: functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-06
implementation: null
scope:
  - backend
  - frontend
---

# The detail lists the specs that name each other

The detail must list the rule IDs that its body names. It must also list the specs whose body
names its rule ID. Each entry must link to the spec.

Reason: A spec refers to a different spec by rule ID without `§`.

Test: Unit test of the index builder.
