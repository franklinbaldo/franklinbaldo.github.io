---
type: Finding
title: "VASCO × Gaia: verified 2,500-row Hamburg 7538 replay on versioned runner"
description: "Bounded replay of previously archived real APPLAUSE DR4 rows, with source and program SHA anchors."
status: exploratory
research_front: vasco-historical-transients-falsification
timestamp: 2026-10-18
tags: [vasco, e0, gaia, archival-replay, provenance]
---

# Hamburg 7538 / scan 9720 — archived 2,500-source replay

## Question

Can the committed, bounded `experiments/vasco-gaia/run.py` and independent `tools/experiment_harvest.py` reproduce the previously reported 2,500-row classification counts on the **same frozen real-source CSV**, instead of only the intentionally stratified 36-row fixture?

## Source / identity

- Declared upstream source: APPLAUSE DR4 `applause_dr4.source_calib`, [DR4 DOI](https://doi.org/10.17876/plate/dr.4/13). This run **did not download new APPLAUSE observations**.
- Dataset on remote Colab CPU: `/content/vasco_e7_patch_7538.csv` (2500 records, plate 7538, scan 9720 only, sky-window subset; **not** a random or complete survey sample).
- Frozen input bytes: 270,450; SHA-256 `816378fedaf6cb3a48ac3c2ff8c863320840f70f0fcd76e9c0a365077c07c38a`.
- Versioned program from blog main commit `abed010123dc7bc3ce89498f37011f304c139e5f`; its `experiments/vasco-gaia/run.py` SHA-256 `ac7972ae69b855ca3db330b1a551eba1c6dd12e44d156ac2cdafd6eacef883f0`, independent harvester SHA-256 `b14f48708b4021624729a068147bb223bea1427cb4bdcf7e231066993c1970db`.
- Output `classifications.csv` SHA-256 `a0b4ba327364ac3a0af6e3135f791a62cbe24398bc4f34fdc356578f46211426`.
- Manifest `run_identity`: `3895c793704e097c04bc827977e580567d5bf23a5cd8e53be77d918050f19f32`.
- Environment: free Google Colab CPU, Python 3.13.16, invoked through Jatobá as a *lightweight CLI bridge*; Jatobá itself performed no scientific computation.

## Executed counts

| Category | Count | Operational meaning |
|---|---:|---|
| `gaia_clean` | 1803 | Existing upstream Gaia ID and SExtractor flags equal zero |
| `no_gaia_clean` | 230 | Upstream Gaia ID missing, SExtractor flags zero; **not a confirmed Gaia nonmatch** |
| `review` | 467 | Nonzero extraction flags or invalid Gaia ID |
| **Total** | **2500** | Bounded, earlier-collected, nonrandom source subset |

Both the production classifier and independently recomputing harvester completed with exit code 0 and produced **identical 1,803 / 230 / 467 counts**. The earlier separate 36-source archived fixture has an intentionally balanced 12/12/12 count and should **not** be used as a population estimate.

## Falsification and negative evidence

During the same session, **two new official synchronous TAP requests failed**, including a small bounded spatial selection and a query restricted to one specific Gaia ID. Both returned HTTP 400 with `canceling statement due to statement timeout`. The VOTable error-body bytes had SHA-256 `98fff3f97472a97c4a53cc86a73838c34bc94278a274bfbe657df1172db1d47d`. Thus **no fresh source sample** is claimed.

The replay establishes reproducibility of existing catalog-identifier accounting, **not** independent Gaia catalog validation, astrometric epoch propagation, photometric PSF fit, scanner-artifact rejection, completeness, a new transient, or an astrophysical origin.

## Gates and next action

- **PASS:** committed runner retrieved by exact main SHA, frozen-input SHA checked, 2500-row classification executed, independent harvester reproduced exact records and hashes.
- **FAIL (external data acquisition):** synchronous APPLAUSE TAP statement timeout; no false claim of zero sources.
- **NOT_RUN:** new Gaia xmatch, epoch motion, FITS injection/recovery, full Hamburg source census, independent Vatican/Hamburg true-image unmatched controls, Github Actions remote run.
- **Next:** recover TAP query service and use a tested small indexed retrieval + immutable raw source manifests; only then feed new data to the same runner. Separately apply image-level sensitivity and independent exposure checks before labeling any `no_gaia_clean` source as a physical transient.

The earlier result is now verified against code in GitHub; this authored Finding preserves **that precise, limited claim**, not an updated S0 population or an E7 transient discovery.
