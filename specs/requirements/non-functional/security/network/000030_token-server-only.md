---
id: "000030"
title: A GitHub token stays on the server
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-06
implementation: null
scope:
  - backend
---

# A GitHub token stays on the server

The server must run without a GitHub token. A token must be read only from the environment and
must not reach the browser.

Reason: Without a token, GitHub allows 60 API requests per hour, so production uses one.

Test: Unit test of the API responses.
