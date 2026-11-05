---
type: changelog
date: 2026-10-13
description: 'Review flycns CAOS compiler/browser simulation with numerical controls and limitations.'
tags: [malecns, tiers, okf, evidence]
---

# MaleCNS evidence curation — review 102

Adds the independent **flycns / CAOS_FlyCNS** compiler and Python/TypeScript/WebGPU numerical runtime as a canonical Markdown OKF card, initially **scientific B / interest S / medium confidence**. The public v0.07.000 release, source, CI, Brian2/flyvis parity fixtures, whole-CNS moderate/strong drive measurements, and GPU/CPU divergences are documented separately from unproven biological competence and absent topology-destroying controls. Evaluated at public revision `a9814adeb56749a972274c1ec0803166e0a990a4`; no private sources exposed and no existing tiers changed.

## Eligibility and selection

After checking current `main`, drafts #2363 and #2367, the active empty curation branch, source availability, material project identity, public code and auditability, two independent projects were eligible for one new card: `NullLabTests/flybrain` (a current-injection arcade, not the music-response `sukoji/flyboard`) and `fsantibanezleal/CAOS_FlyCNS` (cross-language simulator and compiler). The real Bash `shuf -n 1` draw executed in the session sandbox selected **fsantibanezleal/CAOS_FlyCNS**. `NullLabTests/flybrain` remains eligible for later review. Tier/confidence were evidence-driven, not randomly assigned.

The earlier review 100–101 cards remain separately staged. This change only adds OKF and changelog Markdown, with Astro PT/EN pages derived from the existing OKF loader. Source code/tests were inspected but no MaleCNS benchmarks were rerun. No canonical parser, Node 24 Astro build or full e2e validation is claimed by this record.
