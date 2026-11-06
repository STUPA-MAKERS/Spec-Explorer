---
id: "000031"
title: Spec Markdown renders without raw HTML
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-06
implementation: null
scope:
  - frontend
---

# Spec Markdown renders without raw HTML

The Markdown renderer must not render raw HTML from a spec. A link target must be `http`,
`https` or relative.

Reason: Every branch of a public repository can hold a spec file, and a spec file must not run
script in the page.

Test: Unit test of the Markdown renderer.
