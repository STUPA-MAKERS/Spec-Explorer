---
id: "000076"
title: Every component has a jest-axe test
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-06
implementation: null
scope:
  - frontend
---

# Every component has a jest-axe test

Every component in `frontend/src/app/` must have a jest-axe test. The test must render each
state of the component and expect no violations.

Reason: The test finds a missing name or a wrong role at once.

Test: `toHaveNoViolations` in the spec of each component.
