---
id: "000093"
title: The page language follows the UI language
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-06
implementation:
  - frontend/src/app/app.ts
scope:
  - frontend
---

# The page language follows the UI language

The `lang` attribute of the `html` element must be the current UI language.

Reason: WCAG 3.1.1. A screen reader picks its voice from this attribute.
