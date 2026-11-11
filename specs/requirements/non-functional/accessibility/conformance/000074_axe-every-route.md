---
id: "000074"
title: Every route passes an axe check in both themes
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-06
implementation: null
scope:
  - frontend
---

# Every route passes an axe check in both themes

A browser test must run axe-core on every route, in the light theme and in the dark theme.
The check must use the tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and `wcag22aa`. A
violation must fail CI.

Reason: jsdom cannot compute contrast or layout, so only a real browser finds these errors.

Test: A Playwright test with `@axe-core/playwright`.
