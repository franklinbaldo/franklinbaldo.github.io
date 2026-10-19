---
type: changelog
date: 2026-09-22
description: Add a GitHub Actions runner in the blog repository for exact-SHA experiments from franklinbaldo/papers with harvestable provenance bundles.
tags: [ci, research, github-actions, reproducibility]
---

# Exact-SHA runner for papers experiments

The blog repository can now act as an execution fallback for experiments whose canonical source lives in `franklinbaldo/papers`. The manual workflow requires an exact source commit SHA, verifies the resolved checkout, captures stdout/stderr and workspace diffs, packages the requested result files, and emits a machine-readable provenance manifest for later harvest back into the research repository.

The workflow does not publish results or change publication readiness by itself. A harvested result still has to be reconciled against the canonical paper, evidence, or findings state in `franklinbaldo/papers`.
