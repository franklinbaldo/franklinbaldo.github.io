---
type: changelog
date: 2026-09-24
description: Add GovInfo eCFR bulk XML as a legal/regulatory source lane for explicit MATH blocks.
tags: [science-equation-atlas, govinfo, ecfr, regulation, parquet]
---

# GovInfo eCFR math source lane

Adds the first dedicated legal/regulatory bulk source to the Scientific Equation Atlas. The lane consumes official GovInfo eCFR XML, preserves explicit `<MATH>` blocks and linked graphic references as attested source artifacts, performs no OCR or reconstruction at the extracted stage, and routes accepted occurrences through the shared Parquet/Internet Archive data plane. It also adds a reusable deterministic SHA-256 inventory builder for file-based source snapshots.
