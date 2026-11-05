---
type: changelog
date: 2026-10-14
description: 'Audit Firefly negative benchmark and its topology-null, lesion and reporting controls.'
tags: [malecns, tiers, okf, evidence]
---

# MaleCNS evidence curation — review 109

Add **PixelML/firefly**, an independent public MaleCNS-derived wildfire satellite classification experiment, at initial scientific **C**, interest **S**, confidence **medium**. Reviewed revision: 01fa1a6a287b81147cc37a7c59d53e5a1b61bf91.

Its authored benchmark reports ROC-AUC 0.6223 for frozen CNS features versus 0.7111 for direct pixels; this negative is retained as a point-estimate result. Source-level audit found that the supposed rewiring preserves directed adjacency, intervals use a different decoder seed from the headline metrics, lesions run after a random-sparse graph swap, and the label-shuffle uses pixels instead of CNS features. The small NumPy reproduction confirms the adjacency invariant and interval mismatch. No full-network benchmark was rerun and no topology-causal result is asserted.

Selection: after checking main, WIP PRs #2363/#2367 and the 13 cards on PR #2369, two independent eligible candidates remained (PixelML/firefly and ashemag/fly-brain-atlas). Actual Bash shuf -n 1 in the sandbox selected PixelML/firefly; tiers and confidence were judged from evidence, not chosen randomly. The atlas remains eligible. Public sources only; Markdown OKF is canonical and PT/EN pages derive from it.
