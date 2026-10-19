---
type: changelog
date: 2026-09-24
description: "Add GitHub Actions workflow for bounded IETF RFCXML lane with Parquet materialization and Internet Archive publication."
tags: [science-equations, atlas, rfcxml, github-actions, parquet]
---

# Scientific Equation Atlas — IETF RFCXML Actions Lane

- Adds `.github/workflows/atlas-rfcxml.yml` providing an executable workflow for the IETF RFCXML bulk lane.
- Supports bounded execution with configurable RFC selection (defaulting to RFC 9000).
- Downloads official RFC XML files, computes deterministic inventory SHA-256, and extracts attested formal blocks.
- Validates occurrence schemas with Pydantic and materializes canonical Zstandard Parquet shards.
- Supports publishing verified snapshots to Internet Archive using configured repository secrets and uploading Parquet datasets as workflow artifacts.
