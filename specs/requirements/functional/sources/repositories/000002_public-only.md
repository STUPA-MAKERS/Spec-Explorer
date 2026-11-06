---
id: "000002"
title: The explorer reads only public repositories
kind: functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-06
tests:
  - "backend/tests/test_github.py:test_public_only"
implementation:
  - backend/app/github.py
scope:
  - backend
---

# The explorer reads only public repositories

The server must read only public repositories. A private or internal repository must get status
404, also when the server token can read it.

Reason: The gate lets in people who are not readers of a private repository.

Test: Unit test of the source resolver.
