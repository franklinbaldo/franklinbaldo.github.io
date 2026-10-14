---
type: changelog
date: 2026-10-14
description: "Evaluate BrainLab's MaleCNS cross-connectome sensitivity study and retain failed controls."
tags: [malecns, tiers, okf, evidence]
---

# MaleCNS review 111 — BrainLab cross-dataset comparability

- Reconstructed public WIP: #2369 remains draft with 14 new OKF cards, and
  #2363/#2367 are also open. The two review110 cards and normative-CI gate
  are still pending integration, so this round does not alter existing tiers.
- Filtered the remaining public, uncatalogued candidates to
  `anzal1/samesmell` and `Pronexsteam/brainlab`. A real Bash `shuf -n 1` on
  the session sandbox selected BrainLab; Same Smell remains eligible.
- BrainLab: scientific **A**, interest **A**, confidence **medium**. Its
  committed MaleCNS **v0.9** experiment gives MN9 68.9 Hz, versus FAFB v783
  76.7 Hz and BANC v888 17.8 Hz under the author's Shiu LIF transfer.
- Retain the red C. elegans gate, imperfect Shiu/Brian2 agreement, failed
  global synaptic-gain fix and per-type-normalization overactivity. Do not
  infer living-animal differences from version-confounded LIF simulations.
- Reviewed the committed native BANC synapse check and the named atlas runs;
  source-code inspection is not a dataset-scale independent reproduction.
- Source is public; no private data or raw connectome datasets are copied.
- GitHub writes including the normative workflow were rejected by connector
  safety checks. The new OKF files are prepared locally only; normative
  okf-parser, Astro build, independent benchmarks and visual PT/EN are not_run.
- Jatoba was not used. The blog UI remains a derivative of Markdown OKF.
