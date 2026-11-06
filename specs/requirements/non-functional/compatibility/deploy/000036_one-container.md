---
id: "000036"
title: The explorer is one container
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-06
implementation:
  - deploy/Dockerfile
  - backend/app/main.py
scope:
  - deploy
---

# The explorer is one container

The explorer must run as one container that serves the frontend and the API on one port. The
configuration must come only from environment variables.

Reason: One container keeps the deploy in nixos-stupa to one service.

Test: Review.
