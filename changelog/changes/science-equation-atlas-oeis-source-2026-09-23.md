---
type: changelog
date: 2026-09-23
description: Add a pinned OEIS bulk formula-field ingestion lane to the Scientific Equation Atlas.
tags: [science, equations, okf, datasets, ingestion]
---

# Scientific Equation Atlas — OEIS bulk source

- Integrates the official `oeis/oeisdata` Git export as the Atlas's next source-first corpus lane.
- Pins the 2026-09-23 OEIS export commit and timestamp in a machine-readable manifest instead of harvesting a mutable latest state.
- Adds a `git grep`-based streaming harvester that emits one JSONL occurrence for every `%F` formula line in the pinned corpus without page-by-page scraping.
- Preserves A-number, path, source line, original formula notation, pinned record URL, license/provenance metadata and source-record checksum.
- Adds separate exact-text and whitespace-normalized fingerprints to support the first two deduplication layers without claiming mathematical equivalence.
- Keeps OEIS program fields out of the attested-formula lane so future reconstructions from code remain explicitly `reconstructed`.
- Adds end-to-end fixture coverage against a temporary Git repository and records the unexecuted full-corpus materialization boundary instead of inventing ingestion counts.
- Records the source-sized run in `knowledge/science-equations/runs/2026-09-23-oeis-source-integration-r8.md`.
