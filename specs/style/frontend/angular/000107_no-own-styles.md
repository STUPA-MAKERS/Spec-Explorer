---
id: "000107"
title: The frontend has no styles of its own
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-24
tests:
  - "scripts/check_styles.py:main"
implementation:
  - frontend/src/styles.scss
scope:
  - frontend/src
---

# The frontend has no styles of its own

The frontend must not have a style of its own. It must not have a `.scss` or `.css` line other
than the `@use` lines of `src/styles.scss`, and it must not use `class=`, `[class`, `[ngClass]`,
`style=`, `[style`, `styles:` or `styleUrl`. A look that the kit does not have must go into the
kit first.

Reason: The ui-kit bans own styles in an app (ui-kit 002205), and the ratchet is at zero in the
explorer, so every look comes from the kit.

Test: `scripts/check_styles.py` counts the hooks of the ui-kit ratchet (ui-kit 002213) and fails
on any count above zero.
