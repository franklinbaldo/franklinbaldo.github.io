---
type: changelog
date: 2026-10-14
description: 'Curate FLYT3 and flybrain-snake with plasticity boundaries, negative baselines and topology-control limitations.'
tags: [malecns, tiers, okf, evidence]
---

# MaleCNS project curation — review 105

Adds two materially distinct, independent public evidence cards as Markdown OKF without changing existing classifications or introducing parallel data catalogs.

- **FLYT3 / FLYC4** (`seanphan/flyt3`), scientific **B**, interest **A**, medium confidence. Distinguishes whole-CNS frozen spiking/readout learning from a separate dopamine-updated mushroom-body circuit, and preserves the reported negative five-class satellite damage baseline (60.8% MaleCNS decoder vs 85.7% pooled-pixel MLP). Public code is auditable, but weights and reported scores were not independently reproduced; reviewed public SHA `18fd031f0e735ca3d80c94319df1fd9a0024f77b`.
- **flybrain-snake** (`charbelkassab/flybrain-snake`), scientific **B**, interest **A**, medium confidence. The author-reported 100-game result is 25.4 for real wiring plus trained descending-neuron decoder versus 4.06 for target-scrambled wiring; the no-brain reference rule also achieves 25.4. The benchmark reuses held-out precomputed neural responses rather than simulating the whole network during every game move, and the target-scramble does not preserve target in-degree. Reviewed public SHA `6dcaacb62f2efdc3a624be06962084052664f373`.

**Eligibility and selection.** Objective filters: publicly readable code and evidence, actual MaleCNS-derived model/experiment, materially distinct project identity, no main/open-PR card, and no private material. Three candidates passed before the final draw: `seanphan/flyt3`, `charbelkassab/flybrain-snake`, `PixelML/firefly`. Capacity was two; sandbox Bash `shuf -n 2` selected FLYT3 and flybrain-snake. PixelML/firefly (strong controlled negative evidence) remains eligible for the next review. The draw never determined evidence tiers or confidence. No numerical benchmark was rerun, and no private papers research was published.
