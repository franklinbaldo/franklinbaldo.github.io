---
type: Changelog
title: Hrönir becomes OKF-native and publishes Parquet
date: 2026-09-18
description: Strengthen the Hrönir data contract and publish a normalized Parquet dataset with the GitHub Pages site.
tags: [hronir, okf, parquet, performance]
---

# Hrönir becomes OKF-native and publishes Parquet

- New Hrönir evaluations carry an explicit `hronir-evaluation-v1` data schema instead of using the prompt version as a schema surrogate.
- Existing immutable rate files remain untouched and are normalized into the same public projection.
- The build emits `/data/hronir.json`; deploy materializes `/data/hronir.parquet` with DuckDB and publishes both through GitHub Pages.
- JSON/Parquet stay derived artifacts; OKF Markdown remains the canonical record.
