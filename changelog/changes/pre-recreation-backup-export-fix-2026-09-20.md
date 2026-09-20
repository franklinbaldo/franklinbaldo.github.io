---
type: changelog
date: 2026-09-20
description: "Fixes stdout capture in the one-shot pre-recreation backup exporter and retriggers the verified export."
tags: [backup, migration, fix]
---

# Pre-recreation backup exporter captures Git output correctly

- Git helper commands now return captured stdout to the exporter.
- The export workflow is retriggered so bundle/LFS/issue/PR preservation can complete.
