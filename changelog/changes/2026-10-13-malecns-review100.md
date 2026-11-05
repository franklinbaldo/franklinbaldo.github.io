---
type: changelog
date: 2026-10-13
description: 'Curate two independent MaleCNS research projects and audit frozen versus plastic controls.'
tags: [malecns, tiers, okf, evidence]
---

# MaleCNS evidence curation — review 100

Adds two independent public evidence cards to the canonical Markdown OKF directory; PT/EN Astro pages continue to render those cards without a parallel semantic catalogue.

- **Fruit fly brain / optic-v2** (`AbijahKaj/fruit-fly-brain-research`): real MaleCNS visual subset plus browser WebGPU control, positive selectivity after fitting, negative frontal/contrast cases, and an unresolved HS-to-DNg02 descending motor bridge. Initial scientific **B**, interest **S**, medium confidence.
- **FlyLM** (`alexbuildstech/fly-connectome-lm`): controlled full-network **negative** frozen-graph result, public metrics and code; later plastic score difference is **not topology-identifying** because 100% of real synapses were trained against 20% of random synapses, with additional sign differences. Initial scientific **A**, interest **S**, medium confidence.

## Review selection and provenance

Objective eligibility filter: public independently owned repository, actual MaleCNS-derived executable/model, auditable source and result/methodology, not already represented by a card on `main` or the two open curation PR branches, and no sensitive/private evidence. Eligible candidates: `AbijahKaj/fruit-fly-brain-research`, `NullLabTests/flybrain`, `Sudharsanselvaraj/Flylab`, `alexbuildstech/fly-connectome-lm`. Capacity was two new cards; actual Bash `shuf -n 2` in the session sandbox selected **AbijahKaj** and **alexbuildstech**. Neither tier nor confidence was drawn randomly. The two unselected eligible candidates remain available for later evidence review.

Primary records are pinned to reviewed public SHA `c28066a5b9eff03efdb002f6779980d29f70634c` and `184d3a6be57a0843165595bc398c3920e1fe311e`, respectively. All reported metrics are source-author reports or inspected committed artifacts, not independent benchmark reruns. No change to existing tier or status, no private paper details promoted into the public curation.
