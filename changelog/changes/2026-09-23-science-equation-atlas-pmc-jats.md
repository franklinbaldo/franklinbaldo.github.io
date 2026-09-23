---
type: changelog
date: "2026-09-23"
description: "Scientific Equation Atlas adds a license-filtered PMC/JATS bulk adapter and makes Parquet plus verified Internet Archive publication the common equation-lake contract."
tags: [science-equations, atlas, pmc, jats, parquet, internet-archive]
---

# Add PMC/JATS bulk lane to the Scientific Equation Atlas

- Adds a source adapter for attested `disp-formula` and `inline-formula` occurrences in license-safe PMC JATS XML.
- Uses the current PMC AWS Article Dataset distribution rather than retired legacy article-dataset endpoints.
- Fails closed to a first redistributable lane of explicit commercial Creative Commons licenses.
- Makes Apache Parquet the canonical mass-storage format and JSONL transient only.
- Adds a generic Parquet materializer and an idempotent, verified Internet Archive publisher for external executors.
- Keeps Git as the lightweight control plane and explicitly excludes GitHub Actions from bulk acquisition, materialization and publication.
