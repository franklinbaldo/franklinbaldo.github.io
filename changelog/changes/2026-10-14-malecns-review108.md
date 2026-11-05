---
type: changelog
date: 2026-10-14
description: "Review public Fly / Wirehead MaleCNS video-input demonstration, with mechanistic controls and causal limits."
tags: [malecns, tiers, okf, evidence]
---

# MaleCNS evidence curation — review 108

Add **Fly / Wirehead**, by `mattyhempstead/fly-wirehead`, as a materially distinct independent public project, at initial scientific **B**, interest **A**, confidence **medium**. Reviewed public revision: `fcefe9441f80e25aab713411ebced53f5e5ea172`. Its runtime descends explicitly from `nftechie/stonkfly`, but the video-frame transport, local stimulus and 3D neural readout constitute a distinct demonstration. The numerical graph is checksum-locked by the authors, and local testing is described in `docs/validation.md` and `tests/test_full_connectome.py`.

The author's matched stimuli report **127,378** versus **92,952** neural spikes in 100 ms (white versus black), and **261** versus **0** PAM11 spikes with versus without a 200 ms current pulse, alongside **3,087** changed weights. Freezing plasticity preserves the weights. None of this establishes learned preference or causal benefits of the connectome topology: the video advances on a timer, PAM11 current follows all accepted video frames, and the body movements are engineered or choreographed. Full dataset processing and native model were not independently executed.

**Selection:** objective criteria required public MaleCNS-derived implementation, inspectable source and controls, a distinct project identity and no duplicate in `main`, PR #2363, PR #2367 or the pending cards. The eligible remaining candidates were `PixelML/firefly`, `mattyhempstead/fly-wirehead` and `ashemag/fly-brain-atlas`. With one available slot, a real Bash `shuf -n 1` call on a non-Jatobá sandbox selected `mattyhempstead/fly-wirehead`. Scientific tier, interest tier and confidence were determined from evidence independently of the random draw. The other two remain eligible.

**Execution/publication:** canonical Markdown OKF only; Astro page is a derived projection. The GitHub writing action was blocked; this artifact is a local patch pending the already-open curatorial WIP reconciliation, normative `okf-parser`, Astro tests/build, CI and PT/EN inspection. No private or unpublished research is exposed. Jatobá was not used.
