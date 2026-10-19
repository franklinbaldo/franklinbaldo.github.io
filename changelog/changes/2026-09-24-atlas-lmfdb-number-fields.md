---
type: changelog
date: 2026-09-24
description: Add a bulk LMFDB number-field source adapter and source descriptor for reconstructed defining polynomials.
tags: [science-equation-atlas, lmfdb, parquet, internet-archive]
---

# LMFDB number-field source lane

Adds a deterministic source-first adapter and stable source descriptor for the LMFDB `nf_fields` table. The lane preserves the stored coefficient vector, marks generated `P(x)=0` notation as reconstructed, keeps transient cardinality in dated runs rather than the source descriptor, and routes accepted mass occurrences through the shared Parquet/Internet Archive data plane.
