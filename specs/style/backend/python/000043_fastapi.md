---
id: "000043"
title: The server is Python with FastAPI
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-06
implementation: null
scope:
  - backend
---

# The server is Python with FastAPI

The server must use Python 3.13 and FastAPI. It must pass `ruff check` and `basedpyright` in
strict mode.

Reason: STUPA-Workflow uses the same stack and the same checks.

Test: CI.
