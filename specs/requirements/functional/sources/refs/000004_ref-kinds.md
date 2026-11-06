---
id: "000004"
title: A source is a repository and a ref
kind: functional
status: draft
owner: frederikbeimgraben
updated: 2026-11-06
implementation: null
scope:
  - backend
  - frontend
---

# A source is a repository and a ref

A source must be one repository and one ref. The ref must be a branch, a tag or a commit SHA.
The ref picker must list the branches and the tags of the repository and must accept a commit
SHA.

Test: Unit test of the ref resolver.
