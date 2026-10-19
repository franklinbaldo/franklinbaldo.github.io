---
type: changelog
date: 2026-09-24
description: Add a bulk LMFDB elliptic-curves-over-Q source lane that reconstructs generalized minimal Weierstrass equations from attested a-invariants.
tags: [science-equation-atlas, lmfdb, elliptic-curves, parquet, internet-archive]
---

# LMFDB elliptic-curves-over-Q source lane

Adds a deterministic source-first adapter and source descriptor for the LMFDB `ec_curvedata` table. The lane preserves stored a-invariants, marks emitted generalized Weierstrass notation as reconstructed, keeps live table cardinality in the dated run instead of the stable descriptor, and routes mass occurrences through the shared Parquet/Internet Archive data plane outside GitHub Actions.
