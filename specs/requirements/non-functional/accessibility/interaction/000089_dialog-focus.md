---
id: "000089"
title: A dialog keeps the focus inside
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-06
implementation: null
scope:
  - frontend
---

# A dialog keeps the focus inside

A dialog must move the focus into itself when it opens. The focus must not leave it while it
is open. Escape must close it, and the focus must go back to the control that opened it.

Reason: WCAG 2.1.2 and 2.4.3.
