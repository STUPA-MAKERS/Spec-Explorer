---
id: "000028"
title: The explorer has no login
kind: non-functional
status: draft
owner: frederikbeimgraben
updated: 2026-11-06
implementation: null
scope:
  - backend
  - frontend
---

# The explorer has no login

The explorer must not have a login, a session or a cookie of its own. The OAuth2 proxy in front
of it is the access gate.

Reason: One gate for every internal page keeps the login in one place.

Test: Review.
