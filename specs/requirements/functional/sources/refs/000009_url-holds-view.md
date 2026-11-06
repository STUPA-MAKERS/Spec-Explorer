---
id: "000009"
title: The URL holds the source and the rule
kind: functional
status: draft
owner: frederikbeimgraben
updated: 2026-11-06
implementation: null
scope:
  - frontend
---

# The URL holds the source and the rule

The URL must have the form `/<repository>/<ref>/<rule ID>`. A `/` in the ref must be encoded as
`%2F`. The rule ID keeps its `/`.

Reason: A copied link must open the same view. Branch names such as `claude/x` contain `/`.

Test: Unit test of the routes.
