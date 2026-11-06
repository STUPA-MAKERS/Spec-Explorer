---
id: "000019"
title: The detail lists the code references
kind: functional
status: draft
owner: frederikbeimgraben
updated: 2026-11-06
implementation: null
scope:
  - backend
  - frontend
---

# The detail lists the code references

The server must find every `§` reference in the files of the source outside `specs/`. It must
use the pattern `§ ?((?:F|NF|S)/[a-z0-9/-]+/[0-9]{6})`. The detail must list each reference to
the spec with path and line.

Reason: The pattern is the same as the pattern of the format check, so both find the same
references.

Test: Unit test of the index builder.
