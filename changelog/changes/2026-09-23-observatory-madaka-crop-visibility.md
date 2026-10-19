---
type: changelog
date: 2026-09-23
description: "Refine Madaka17's helmet-validation blocker using real-crop evidence that separates head visibility from conditional classifier accuracy, while preserving the unused initial-touch gate after two failed write paths."
tags: [ai-epistemic-worlds, solo-builder, observatory, intervention, harvest]
---

Run mode: `harvest-matching`.

The merged `solo-builder-triage`, `solo-builder`, `ai-epistemic-intervention` and `ai-epistemic-convergence` contracts were re-read from current GitHub state. No observatory PR was open. A canonical queue refresh for 2026-09-22 under criteria version `2026-09-21` was attempted through Jatoba, but the MCP endpoint timed out before GH Archive sampling; no recurrence claim, admission-band value or `times_sampled` value changed.

The pass harvested the existing actionable `madaka17` field-validation chain rather than creating a new card. Direct repository inspection found material evidence after the prior baseline: commit `22c804063d9dfbf2627abef9fb0e38cabf559a39` reports a local-detector pass over 200 recent real helmet crops where 148 contain no visible head and only about 5% receive a confident local verdict. Together with the earlier synthetic result — degraded-validation mAP50 53% -> 72% while clean validation moves 76.5% -> 73.7% — this separates two previously conflated deployment questions: whether the capture/crop contains usable head evidence, and whether the helmet classifier is correct conditional on that evidence.

The strongest corpus comparison remains `forwaryan + mikesandoval10creator + smirre111`: evidence/replay and blinded comparison, frozen-evidence release gates, and measured-versus-assumed provenance. `match_quality` remains `actionable`, but the proposed frozen real-camera holdout is now explicitly two-stage: label head visibility first, then compare clean detector, degraded detector and cloud-agent helmet decisions on the same fixed evidence while retaining negative and abstention cases.

Accumulated reception was refreshed to 0 stars, 0 forks, 0 watchers, 0 subscribers, 0 external issues and 0 external pull requests; discussions are disabled and distinct external contributors remain `not_measured`. No account-wide isolation claim is made.

The smallest useful contact surface remains a new issue because fresh searches found no existing issue or pull request framing the validation question. The 2026-09-23 connector write returned `403 Resource not accessible by integration` before creating an issue. A Jatoba `gh` fallback was attempted immediately afterward, but the MCP endpoint timed out before command execution. No public artifact exists, so `uptake` remains none and the account-level `initial-touch` gate remains unused and eligible.
