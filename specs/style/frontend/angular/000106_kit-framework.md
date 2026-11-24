---
id: "000106"
title: The frontend runs on the ui-kit framework
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-24
implementation:
  - frontend/src/main.ts
  - frontend/src/app/config.ts
  - frontend/src/app/app.ts
  - frontend/src/app/routes.ts
scope:
  - frontend
---

# The frontend runs on the ui-kit framework

The frontend must start the ui-kit framework with `provideFramework` and must show the
`app-framework-shell`. Every list page must be a `app-list-detail-screen`, and every detail must
be a `app-detail-screen`. The shell must always use the rail frame without a person, because the
explorer has no login.

Reason: STUPA-Workflow builds its pages on the same framework (ui-kit 002200), so both apps look
and behave the same, and a kit change reaches both.

Test: Review.
