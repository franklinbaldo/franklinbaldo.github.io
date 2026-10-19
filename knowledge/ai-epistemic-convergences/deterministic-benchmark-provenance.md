---
type: ai-epistemic-convergence
name: "Deterministic benchmark provenance as a transferable test harness"
hypothesis_key: deterministic-benchmark-provenance
summary: "Three AI-assisted systems expose complementary pieces of the same evaluation problem. Medieval Economy already makes simulation runs reproducible through seeded worlds, hashed configuration, manifests and multi-seed batches; Rumor Checking preserves claim/evidence/replay bundles around machine judgments; ISU Survivor explicitly wants model-vs-model league comparisons but currently lacks exact round-scoped provenance and event attribution. The useful bridge is to treat one comparison unit as a frozen manifest plus replayable evidence, so post-selection or model comparisons can be independently re-run instead of reconstructed from timestamps or prose."
case_slugs: [rhausch, isualc, forwaryan]
overlap_dimensions: [method, provenance, benchmark, replay, evaluation]
independence_status: not-established
evidence_quality: medium
testable_predictions:
  - "If ISU Survivor adopts a canonical round manifest carrying round ID, scenario, roster, model/backend, persona/memory refs, loadout and exact event links, league_report should no longer need timestamp-based round assignment or text-derived kill hints for matched comparisons."
  - "If Medieval Economy evaluates its evolved deciders on held-out world seeds after all parameter-range and curriculum choices are frozen, the utility-versus-rules ordering can be separated from optimization/search-space effects; failure to preserve the ordering would identify selection sensitivity rather than a stable decider advantage."
  - "If Rumor Checking stores benchmark conditions and outputs as immutable replay bundles with explicit perturbation IDs, the same evidence can be re-evaluated under fast/deep/critic ablations without conflating retrieval drift with reasoning-path changes."
cross_pollination_candidates:
  - "rhausch -> isualc: transfer deterministic seed/config-hash/run-manifest discipline to the DayZ arena so every model/memory/persona comparison has an exact round identity and replay surface."
  - "forwaryan -> rhausch: transfer explicit frozen evidence/replay and retained negative/null-case discipline to the post-evolution comparison bundle, especially for held-out-seed evaluation after tuning is complete."
  - "rhausch -> forwaryan: reuse separated-seed/matched-batch thinking as a template for repeated perturbation families rather than interpreting a single replay set as robust evidence."
source_urls:
  - "https://github.com/rhausch/medieval-economy/blob/main/CLAUDE.md"
  - "https://github.com/rhausch/medieval-economy/blob/main/docs/decisions.md"
  - "https://github.com/rhausch/medieval-economy/pull/18"
  - "https://github.com/Isualc/dayz-ai-survivor/blob/main/daemon/league_report.py"
  - "https://github.com/forwaryan/rumor-checking"
updated: 2026-09-22
---

No independence claim is made from different maintainers alone, and no observatory contact has yet linked these projects. If a future intervention transfers one of these methods, later adoption must be recorded as diffusion rather than independent convergence.
