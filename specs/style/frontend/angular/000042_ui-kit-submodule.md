---
id: "000042"
title: The ui-kit is a git submodule
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-06
implementation:
  - .gitmodules
  - frontend/package.json
scope:
  - frontend
---

# The ui-kit is a git submodule

The frontend must use Angular 20 and must include `STUPA-MAKERS/ui-kit` as the git submodule
`frontend/vendor/ui-kit`.

Reason: STUPA-Workflow includes the ui-kit the same way, so a ui-kit change reaches both apps
the same way.

Test: Review.
