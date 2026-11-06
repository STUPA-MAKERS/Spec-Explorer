---
id: "000021"
title: The page Verweise lists every reference and filters by spec
kind: functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-06
tests:
  - "backend/tests/test_specindex.py:test_broken_references"
  - "frontend/src/app/model.spec.ts:references.refRows"
  - "frontend/src/app/model.spec.ts:references.specFilter"
implementation:
  - backend/app/specindex.py
  - frontend/src/app/refs.component.ts
scope:
  - backend
  - frontend
---

# The page Verweise lists every reference and filters by spec

The page `Verweise` must list every `§` reference at the source, with rule ID, path and line.
It must show the references in two groups:

- `Ohne Spec`: the reference names no spec at the source. This group comes first.
- `Mit Spec`: the reference names a spec at the source.

A filter `Spec` with the options `Alle`, `Mit Spec` and `Ohne Spec` must limit the list to one
group. The detail of a reference with a spec must link to that spec.

Reason: A reference to a missing rule is an error that no spec detail shows. The references with
a spec show where the code implements a rule.

Test: Unit test of the index builder and of the list filter.
