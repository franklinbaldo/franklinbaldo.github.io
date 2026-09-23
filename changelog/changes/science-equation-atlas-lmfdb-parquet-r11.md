---
type: changelog
date: 2026-09-23
description: Add the LMFDB million-scale equation lane and make Parquet plus verified Internet Archive publication the Atlas bulk-storage contract.
tags: [science-equations, parquet, internet-archive, lmfdb]
---

# Add the LMFDB bulk equation lane

The Scientific Equation Atlas gains a source adapter for LMFDB elliptic curves over Q, a common Apache Parquet materializer and a verified Internet Archive publisher designed to run outside GitHub Actions. The source manifest records the current addressable `ec_curvedata` corpus without misreporting it as already ingested, and the run card keeps the remaining full-corpus execution boundary explicit.
