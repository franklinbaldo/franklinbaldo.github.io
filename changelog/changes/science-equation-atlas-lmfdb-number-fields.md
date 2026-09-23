---
type: changelog
date: 2026-09-23
description: Add a bulk LMFDB number-field source adapter for reconstructed defining polynomials and align the Atlas routine with Parquet-only canonical bulk storage.
tags: [science-equation-atlas, lmfdb, parquet, internet-archive]
---

# LMFDB number-field source lane

Adds a deterministic source-first adapter and stable source descriptor for the LMFDB `nf_fields` table. The lane preserves the stored coefficient vector, marks generated `P(x)=0` notation as reconstructed, keeps transient cardinality in dated runs rather than the source descriptor, and routes accepted mass occurrences through the shared Parquet/Internet Archive data plane.
