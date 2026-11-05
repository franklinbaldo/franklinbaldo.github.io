---
type: changelog
date: 2026-10-14
description: 'Review independent MaleCNS FLYBOARD arcade and reproduce a rolling-baseline defect.'
tags: [malecns, tiers, okf, evidence]
---

# MaleCNS evidence curation — review 104

Adds `NullLabTests/flybrain` (FLYBOARD current-injection arcade) as a distinct public MaleCNS v1.0 visualization project, not the music-oriented `sukoji/flyboard` already in draft PR #2363. Initial scientific **C**, interest **A**, medium confidence; public evidence pinned to SHA `9b922ae3e4bee3122e6c8fb996e054719fe71c05`.

A static source audit plus a minimal NumPy reproduction uncovered a ring-buffer aliasing bug: the old row is overwritten before subtracting it from the rolling sum, leaving `window_sum` at zero. As a result, the `burst minus baseline` leaderboard does not currently demonstrate intended baseline-corrected stimulation effects. The published functional tests and the author's full-network throughput measurements remain explicitly separate from independent reproduction. There is no topology-matched rewired control.

Selection: `NullLabTests/flybrain`, `seanphan/flyt3`, `charbelkassab/flybrain-snake` were public, independent, materially distinct, result/code-bearing candidates not on `main` or PRs #2363/#2367. Real Bash `shuf -n 1` in the session sandbox selected NullLabTests; the others remain eligible. No tier was randomized. Private papers information was not carried into this public card. No existing tier was changed.
