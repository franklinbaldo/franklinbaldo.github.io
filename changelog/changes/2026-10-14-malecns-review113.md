---
type: changelog
date: 2026-10-14
description: "Review Project Luna's reproducibility gap and Kill the Flies' real-graph survival prototype."
tags: [malecns, tiers, okf, evidence]
---

# MaleCNS review 113 — source-versus-claim and connectome survival

- Rebuilt public main (37 `malecns-project` cards), draft PR #2369 (14 distinct additions), #2363 and #2367, checked blog OKF specification and `franklinbaldo/papers` MaleCNS C1 source-of-truth. No private artefact was promoted.
- Objective shortlist: seven independent public repositories with explicit MaleCNS-specific scope, reachable README/code, distinct project identity and no matching main/WIP cards. A real non-Jatobá Bash `shuf -n 2` selected `ZentrlxHQ/Project-Luna` and `Guillaume-ds/kill-the-flies` for this pass; selection only, not ranking.
- **Project Luna** initial scientific **F**, interest **B**, confidence **high**: its README claims an implemented real-time CNS and autonomous robot gait, but the published loader, CUDA engine, synapse propagator, sensor encoder and motor bridge are explicit stubs; sole test is a placeholder. This is a bounded revision-specific public-source audit, not a judgement about possible private prototypes.
- **Kill the Flies** initial scientific **C**, interest **A**, confidence **medium**: substantial code/tests, genuine real-data input path and toy-circuit/genetic survival architecture, while escape direction is geometric; null topology, matched compute and independent end-to-end training tests are absent.
- Previous public tiers unchanged; new cards are additive, preserve failures, and use only public pinned revisions. Markdown OKF remains canonical; PT/EN UI derived without JSON/TypeScript catalog.
- `okf-parser` normative, Astro Node 24, independent datasets/benchmarks and browser visual inspection are **not_run** in this sandbox. Source inspection, offline YAML/spec checks and local Git patch checks are independent, narrower gates.
- GitHub integration refused the safety-checked workflow edit on PR #2369, so no new commit or merge may be reported; Jatobá was not used.
