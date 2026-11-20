---
id: "000105"
title: A reference with a repository name links to that repository
kind: functional
status: draft
owner: frederikbeimgraben
updated: 2026-11-20
tests:
  - "backend/tests/test_specindex.py:test_external_references"
implementation:
  - backend/app/specindex.py
  - frontend/src/app/data.service.ts
scope:
  - backend
  - frontend
---

# A reference with a repository name links to that repository

A rule ID with a repository name and a colon before it, for example `ui-kit:NF/usability/layout/000192`
in a spec body or `§ui-kit:NF/usability/layout/000192` in code, must name a spec of that
repository. The explorer must list such a reference with the repository name and must link it
to the spec in that repository: at the same branch or tag when that repository has it, else at
its default branch. Such a reference must not count as broken.

Reason: The ui-kit and STUPA-Workflow share one number space and refer to each other's specs
(ui-kit `S/specs/sharing/002212`).

Test: Unit test of the index builder.
