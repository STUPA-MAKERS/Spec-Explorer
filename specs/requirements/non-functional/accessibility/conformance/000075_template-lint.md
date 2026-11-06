---
id: "000075"
title: The template lint has the accessibility rules
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-06
implementation: null
scope:
  - frontend
---

# The template lint has the accessibility rules

The frontend must have ESLint with every rule of `@angular-eslint/template/accessibility` at
the level `error`. CI must run the lint.

Reason: The lint finds a missing label or a click on a `div` before review.

Test: The lint step in CI.
