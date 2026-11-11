---
id: "000088"
title: Focus goes to the heading after navigation
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-06
implementation: null
scope:
  - frontend
---

# Focus goes to the heading after navigation

After a route change, the focus must go to the `h1` of the new page. A detail pane that opens
beside a list must move the focus to its heading.

Reason: WCAG 2.4.3. Without this, a screen reader stays at the old link.
