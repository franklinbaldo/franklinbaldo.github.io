---
type: changelog
date: 2026-09-20
description: "Fixes stdout capture in the one-shot pre-recreation backup exporter and retriggers the verified export."
tags: [backup, migration, fix]
---

# Pre-recreation backup exporter captures Git output correctly

- Git helper commands now return captured stdout to the exporter.
- The export workflow is retriggered so bundle/LFS/issue/PR preservation can complete.
- A malformed literal newline in the workflow header is corrected so Actions can allocate a runner.

- The verified Git bundle is split into transport-sized artifacts so the private backup can be copied outside Actions storage.

- Bundle transport is reduced to 80 MiB chunks so each verified part can be copied into private durable storage through the connector.
