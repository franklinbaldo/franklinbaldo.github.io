---
type: changelog
date: 2026-09-23
description: "Add the PMC/JATS bulk formula lane and the Parquet-to-Internet-Archive storage contract for the Scientific Equation Atlas."
tags: [science-equations, parquet, internet-archive, pmc, jats]
---

# Scientific Equation Atlas — PMC/JATS Parquet lane

- Adds a source-specific PMC/JATS adapter for `disp-formula` and `inline-formula` from the official AWS Article Datasets service.
- Makes Apache Parquet the canonical bulk-occurrence format and Internet Archive the durable external store for redistributable snapshots.
- Adds deterministic shard manifests and a fail-closed Internet Archive publisher with post-upload verification.
- Keeps GitHub Actions out of the Atlas data plane; bulk execution runs on external executors/sandboxes.
