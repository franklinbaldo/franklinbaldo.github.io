---
type: changelog
date: 2026-09-23
description: Add a bulk LMFDB number-field source adapter for reconstructed defining polynomials and the shared Parquet/Internet Archive lake.
tags: [science-equation-atlas, lmfdb, parquet, internet-archive]
---

# LMFDB number-field source lane

Adds a deterministic source-first adapter and descriptor for the LMFDB `nf_fields` table. The lane preserves the stored coefficient vector and marks the generated `P(x)=0` notation as reconstructed before downstream Parquet materialization and external Internet Archive publication.
