---
type: changelog
date: 2026-10-14
description: "Curate MaleCNS morphology atlas and numerically verified MLX runtime."
tags: [malecns, tiers, okf, evidence]
---

# MaleCNS review 110 — distinct anatomy and runtime contributions

- Applied objective screening to four uncatalogued public projects:
  `ashemag/fly-brain-atlas`, `anzal1/samesmell`,
  `Kisame76/drosophila-brain-mlx`, `Pronexsteam/brainlab`.
- Ran a real `shuf -n 2` in the session Bash sandbox. Selected the atlas and
  MLX runtime for full public-source review; other candidates remain eligible.
- Atlas: scientific **B**, interest **A**, confidence **medium**. Strong
  checksum/provenance and morphology display; no full dynamics or causal tests.
- MLX: scientific **A**, interest **A**, confidence **medium**. MaleCNS
  author-committed performance/parity; FlyWire-only shuffled topology control
  explicitly not misattributed to MaleCNS. Old Brian2 overstatement retained
  as a correction in the project history.
- Existing published tiers and negative controls are unchanged; no parallel
  TypeScript/JSON catalog was created. Both projects use public sources only.
- GitHub PR #2369 remains the intended WIP destination; the connected write
  operation was blocked. These files are a safe local patch pending upload.
- `okf-parser` normative, full Astro build, and PT/EN visual audit: **not_run**
  in this sandbox because pinned tooling/dependencies are not available.
- No Jatoba execution; no merge without the normative parser and green CI.
