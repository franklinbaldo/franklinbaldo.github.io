---
type: malecns-project
project_id: pixelml-firefly
name: "Firefly — wildfire-damage classification"
ownership: independent
kind: "Frozen MaleCNS feature-extraction benchmark for satellite image classification"
stage: "Public code and negative benchmark; topology and ablation controls need correction"
primary_url: "https://github.com/PixelML/firefly"
repository: "PixelML/firefly"
evidence_url: "https://github.com/PixelML/firefly/blob/01fa1a6a287b81147cc37a7c59d53e5a1b61bf91/results/benchmark.json"
scientific_tier: C
interest_tier: S
confidence: medium
reviewed_at: "2026-10-14"
reviewed_revision: "01fa1a6a287b81147cc37a7c59d53e5a1b61bf91"
summary: >-
  Independent negative benchmark: 99 retinal samples from wildfire satellite
  tiles feed a frozen MaleCNS simulator, and a learned MLP decodes downstream
  spike counts. Author-reported direct pixels outperform the CNS feature
  extractor (ROC-AUC 0.7111 versus 0.6223), but the claimed
  degree-preserving topology-null preserves source-target adjacency.
  Additional source-level defects undermine ablation and CI claims; the
  full-connectome results were not independently rerun.
strongest_evidence:
  - >-
    Authored benchmark.json has 18,318 unique tiles (1,222 undamaged and
    17,096 damaged), 2,749 validation samples, 48 CNS ticks, a fixed
    1,024-neuron readout and three decoder seeds. Its real CNS condition
    reports ROC-AUC 0.6223 / balanced accuracy 0.5883, versus direct-pixel
    MLP 0.7111 / 0.6547.
  - >-
    Nominal shuffled connectivity reports ROC-AUC 0.6253. Source inspection
    and minimal NumPy reproduction show that row-wise permutations change
    weights assigned to targets but not which directed source-target edges
    exist. Thus this is not adjacency rewiring.
  - >-
    The reported point scores are from the last decoder seed, whereas
    bootstrap CIs use seed 0. Several published point/CI pairs are
    incompatible with being the same score estimator.
  - >-
    Lesions occur after the active graph becomes random sparse, without
    restoring real topology. The label-shuffle control trains with pixel
    features instead of the MaleCNS neural feature family.
limitations:
  - >-
    The task and interface are artificial: 99 red-dominance/brightness
    patches and a 48-tick response do not establish biological vision.
  - >-
    Similar scores for the real and nominal shuffle arms do not establish
    causal irrelevance of MaleCNS topology; the latter preserves adjacency.
  - >-
    Lesion results are not real-connectome ablations as implemented; CIs
    cannot be interpreted alongside differently seeded point scores.
  - >-
    Tile-level splits lack scene metadata; near-duplicate scenes may cross
    the split. Full-data GPU and 25-million-edge simulation were not rerun.
controls:
  - >-
    Pixel-only MLP with the same decoder family is a valuable baseline;
    its author-reported lead is preserved as a bounded negative result.
  - >-
    Reported random sparse and all-excitatory conditions alter more than
    one structural feature, and the within-row shuffle is not a topology null.
  - >-
    Required: real degree-preserving edge swaps with changed adjacency,
    separate within-row weight-shuffle, equalized compute and random seeds,
    and paired confidence intervals for performance differences.
  - >-
    Restore real weights for each lesion, label-shuffle CNS features,
    save per-seed prediction arrays, and test scene-separated data and
    ecologically informed retinal interfaces.
history:
  - >-
    2026-10-14: initial scientific C, interest S, confidence medium;
    negative direct-pixel finding retained, named topology-null and
    lesion conclusions withheld after bounded source and NumPy audit.
note: >-
  Author-reported scores, independently inspected public code. No
  misconduct claim or full-model reproduction. Compare with FlyLM
  and FLYT3, which likewise separate readout baselines from wiring effects.
---
