---
type: changelog
date: 2026-09-23
description: "Establish and validate local data plane toolchain, doctor preflight, and Parquet pipeline for Scientific Equation Atlas."
tags: [science-equations, data-plane, parquet, doctor, okf]
---

# Scientific Equation Atlas — Local Data Plane Setup and Validation

- Establishes and verifies the local execution environment for the Scientific Equation Atlas without dependency on GitHub Actions.
- Introduces `scripts/science-equations/doctor.py` (`npm run atlas:doctor`) to dynamically discover integrated sources, audit prerequisites, verify credentials, and test endpoint reachability.
- Declares Python data-plane dependencies in `scripts/science-equations/requirements.txt`.
- Adds source descriptors for OEIS (`oeis.json`) and Wikidata P2534 (`wikidata-p2534.json`).
- Fixes argument validation bug in `harvest-pmc-jats.mjs` for unbounded harvesting.
- Enhances `materialize-parquet.py` with multi-encoding detection for PowerShell stream redirection.
- Validates end-to-end pipeline with real PMC JATS XML, extracting 11 attested formulas and materializing a canonical Zstd Parquet shard and manifest.
