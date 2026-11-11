---
id: "000096"
title: A view is drawn as a diagram with the colours of the kit
kind: functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-11
tests:
  - "frontend/src/app/uml-layout.spec.ts:umlLayout.layoutComponents"
  - "frontend/src/app/uml-layout.spec.ts:umlLayout.umlGraph"
  - "frontend/src/app/uml-diagram.component.spec.ts:UmlDiagramComponent.drawing"
  - "frontend/src/app/uml-diagram.component.spec.ts:UmlDiagramComponent.zoom"
  - "frontend/src/app/uml-diagram.component.spec.ts:elkLayout.layoutUml"
  - "frontend/src/app/uml.spec.ts:uml.filterClasses"
implementation:
  - frontend/src/app/uml-layout.ts
  - frontend/src/app/uml-diagram.component.ts
  - frontend/src/app/uml-diagram.component.scss
  - frontend/src/app/uml.ts
  - frontend/src/styles.scss
scope:
  - frontend
---

# A view is drawn as a diagram with the colours of the kit

The page must draw the selected view as an SVG diagram in UML notation. A layout library (ELK)
must place the elements, and the page must not store positions. The lines and boxes must use the
colour tokens of ui-kit, so the diagram follows light, dark and very high contrast.

- Komponenten: one box per module, in one row per layer from layer 1 at the top, and one arrow
  per import with the count as label.
- Klassen: one class box per model with the attributes, grouped in one frame per module, and one
  line per foreign key with the multiplicity at both ends. A filter must show one module and the
  classes that it is linked to.
- Verteilung: one node per service in one frame per network, and one dashed arrow per
  `depends_on`.
- State view: one rounded box per state, a filled start point before the initial state, and one
  arrow per transition with the trigger as label.

The diagram must zoom with the buttons `+`, `−` and `Einpassen`, with the keyboard and with the
mouse wheel, and it must move by drag.

Reason: The explorer draws the data itself, so the diagram has the same look and the same
accessibility settings as the rest of the app.

Test: Unit test of the layout input per view, screenshot test of each view in light, dark and
very high contrast.
