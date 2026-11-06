---
id: "000027"
title: The server only reads
kind: non-functional
status: draft
owner: frederikbeimgraben
updated: 2026-11-06
implementation: null
scope:
  - backend
---

# The server only reads

The server must accept only `GET` and `HEAD` requests. Every other method must get status 405.

Reason: The explorer has no write function, so a write route is only attack surface.

Test: Unit test of the routes.
