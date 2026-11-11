---
id: "000095"
title: The page UML shows the views of specs/uml
kind: functional
status: draft
owner: frederikbeimgraben
updated: 2026-11-11
implementation: null
scope:
  - backend
  - frontend
---

# The page UML shows the views of specs/uml

The navigation must have the entry `UML` next to `Specs` and `Verweise`. The page must list the
views of the folder `specs/uml/` at the selected ref, in this order: Komponenten, Klassen,
Verteilung, then the state views by name. The URL must hold the repository, the ref and the
view, for example `/STUPA-Workflow/development/uml/classes`.

When the ref has no folder `specs/uml/`, the page must show the empty state `Keine UML-Daten`.
When a file breaks the keys of the UML format, the page must show the file and the error
instead of the view, like a format error of a spec.

Reason: The model of the app belongs to the same ref as its rules, so the reader picks both
with one repository and ref picker.

Test: Unit test of the routes and the page, API test of the UML endpoint.
