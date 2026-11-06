---
id: "000034"
title: Large archives and files are refused
kind: non-functional
status: draft
owner: frederikbeimgraben
updated: 2026-11-06
implementation: null
scope:
  - backend
---

# Large archives and files are refused

The server must refuse a tarball larger than 200 MB with status 413. It must not search a file
larger than 1 MB for references.

Reason: A large archive must not use all memory of the server.

Test: Unit test of the index builder.
