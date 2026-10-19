---
type: changelog
date: 2026-10-18
description: Add a bounded and hash-pinned replay of archived VASCO Gaia catalog records.
tags: [experiments, reproducibility, security]
---

# Bounded VASCO Gaia replay

- Adds a standard-library runner, externally anchored harvest verification, and eleven tests
- Preserves 36 archived stratified records with provenance and explicit scientific limits
- Runs only on relevant main changes or manual dispatch using a public standard runner, read-only contents permission, no secrets, and a five-minute timeout
- Records hashes and outcomes in logs; no artifact upload or cross-repository credential
- Global historical deduplication and fresh scientific collection remain pending
