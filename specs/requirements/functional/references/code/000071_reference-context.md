---
id: "000071"
title: A broken reference shows its lines
kind: functional
status: draft
owner: frederikbeimgraben
updated: 2026-11-06
implementation: null
scope:
  - backend
  - frontend
---

# A broken reference shows its lines

The detail of a broken reference must show the four lines before and the four lines after the
reference, with their line numbers. It must link to the file at the commit SHA.

Reason: The reader sees the claim of the code without a change to GitHub.

Test: Unit test of the index builder.
