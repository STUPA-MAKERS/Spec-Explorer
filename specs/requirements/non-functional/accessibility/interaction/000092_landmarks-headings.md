---
id: "000092"
title: Each page has landmarks and one h1 per pane
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-24
implementation: null
scope:
  - frontend
---

# Each page has landmarks and one h1 per pane

Each page must have the landmarks `header`, `nav` and `main`. Each pane must have exactly one
`h1`: a list page has the `h1` of the list, and an open detail has its own `h1`, as in the ui-kit
detail screen. The focus moves to the `h1` of a detail when it opens. Headings must not skip a
level. The rendered spec text starts one level below the heading of its pane.

Reason: WCAG 1.3.1 and 2.4.6.
