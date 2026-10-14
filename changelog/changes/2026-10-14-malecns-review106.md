---
type: changelog
date: 2026-10-14
description: 'Review three public MaleCNS-derived projects, separating measured connectome from synthetic game-control pathways.'
tags: [malecns, tiers, okf, evidence]
---

# MaleCNS evidence curation — review 106

Three independently owned, materially distinct public projects are represented as canonical Markdown OKF cards, with no JSON/TypeScript semantic index and no changes to pre-existing tiers:

- **DesktopFly** (`DenisSergeevitch/desktop-fly`): model-level locomotor intervention suite with a real 1,045-node MaleCNS VNC/descending extract coupled through a **modeled** adapter to a different female FlyWire graph. Scientific **A**, interest **S**, medium confidence.
- **Fruitless** (`nicodunks/fruitless`): paired mAL-output-block intervention across a 36-run factorial model, preserving previous failures and candidate P1 identity limits. Scientific **A**, interest **S**, medium confidence.
- **FlyBrain-HalfLife** (`Yusuftmle/FlyBrain-HalfLife`): source check found that, absent a user-provided NPZ or cached graph, the default `data_loader.py` **synthesizes** neural tracts instead of loading MaleCNS edges. Scientific **D**, interest **A**, medium confidence; do not attribute game behavior to the measured connectome.

## Objective eligibility and random operational selection

Public independent repositories were required to demonstrate an inspectable MaleCNS-linked implementation and executable source, committed numeric results or tests, material identity distinct from the 37 current `main` cards, both open MaleCNS curation drafts and the eight pending review 100–105 cards, and safe public provenance. Six met this test: `PixelML/firefly`, `nicodunks/fruitless`, `DenisSergeevitch/desktop-fly`, `mattyhempstead/fly-wirehead`, `Yusuftmle/FlyBrain-HalfLife`, `ashemag/fly-brain-atlas`. Three slots were available and Bash `shuf -n 3` in the session sandbox selected the three cards above. The list and draw output are saved with the local review artifacts. Tier and confidence ratings are evidence-based, not randomly assigned; unselected projects remain eligible.

This round did not run full MaleCNS benchmark datasets, desktop/macOS application, native Windows integrations, or browser visual gates. Existing WIP PRs were read without being merged. No contents from private `papers` were carried to the public patch. The page stays an Astro projection from Markdown OKF.
