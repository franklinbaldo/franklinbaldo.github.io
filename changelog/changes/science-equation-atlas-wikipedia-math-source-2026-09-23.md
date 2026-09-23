---
type: changelog
date: 2026-09-23
description: Integrate the official English Wikipedia XML dump as a checksum-pinned, attested-math source lane for the Scientific Equation Atlas.
tags: [science, equations, datasets, parquet, wikipedia]
---

# Scientific Equation Atlas — Wikipedia math dump lane

- Adds a streaming adapter for `<math>...</math>` occurrences from official Wikimedia pages-articles XML dumps.
- Pins the complete English Wikipedia 20260901 dump metadata and official checksum surface without treating the dump date alone as final snapshot identity.
- Preserves exact expression text, page/revision attribution, source locators, context and exact/text-normalized hashes.
- Keeps JSONL transient; canonical bulk materialization remains Zstd Parquet and publication remains Internet Archive from an external executor, never GitHub Actions.
