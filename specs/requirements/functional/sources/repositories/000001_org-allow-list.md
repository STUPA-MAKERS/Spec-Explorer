---
id: "000001"
title: The explorer reads only repositories of STUPA-MAKERS
kind: functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-06
tests:
  - "backend/tests/test_github.py:test_org_allow_list"
implementation:
  - backend/app/github.py
scope:
  - backend
---

# The explorer reads only repositories of STUPA-MAKERS

The server must read only repositories of the GitHub organization `STUPA-MAKERS`. A request for
a repository of a different owner must get status 404.

Reason: The allow list stops the server from being a proxy for any repository on GitHub.

Test: Unit test of the source resolver.
