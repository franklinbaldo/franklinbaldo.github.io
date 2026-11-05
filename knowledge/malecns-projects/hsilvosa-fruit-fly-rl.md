---
type: malecns-project
project_id: hsilvosa-fruit-fly-rl
name: "Fly RL — whole-connectome PPO navigation with shuffled-wiring controls"
ownership: independent
kind: "Full MaleCNS reservoir, synthetic 3D environments and external PPO actor/critic"
stage: "Published source, authored multi-seed development results, controlled rewiring and frozen release gate; final reserved pool unopened"
primary_url: "https://github.com/hsilvosa/fruit-fly-rl"
repository: "hsilvosa/fruit-fly-rl"
evidence_url: "https://github.com/hsilvosa/fruit-fly-rl/blob/634f583528de2b8cd6a9354bde211c06de50367f/docs/results/FINDINGS.md"
scientific_tier: A
interest_tier: S
confidence: medium
reviewed_at: "2026-10-15"
reviewed_revision: "634f583528de2b8cd6a9354bde211c06de50367f"
summary: >-
  Fixed MaleCNS v1.0 recurrent reservoir (167,184 selected neurons, 25,583,622
  retained edges) feeds 256 pooled activity features into an external PPO
  actor/critic in procedurally generated 3D rooms. Training enables partial
  navigation of held-out layouts in trained families but fails the predefined
  full release gate and large-room/maze tests. Real anatomical wiring has
  not been shown to outperform a degree-preserving shuffled control.
strongest_evidence:
  - >-
    After approximately two million additional PPO transitions, three
    development runs reach 49, 54 and 55 successes of 64 in medium rooms
    and 42, 36 and 39 of 64 in partitioned passages. Level C development
    scenes yield 95, 108 and 108 of 168 versus 71 for the starting policy.
    These are authored, inspected pools, not an unopened final test.
  - >-
    No family meets the frozen acceptance gate of at least 52 successes
    and at most three collisions per 64 trials. Large rooms score 2, 0,
    0 of 32; mazes score 0, 0, 0 of 32. The 147/168 architecture-scene
    search-planner result is a separate engineered reference, not learned PPO.
  - >-
    Real-versus-rewired fresh-chain comparison C1.1 is 16.0 versus 25.5
    successes of 64 on passages, but the chain reproduction check fails.
    After further training C1.2 is 27.5 real versus 21.0 shuffled; the
    predeclared 28/64 chain gate still fails by 0.5. High seed spread
    and a single rewiring prohibit either causal superiority claim.
  - >-
    Repository documents source-data hashes, checkpoint lineage,
    negative interventions, pool status, deterministic versus sampled
    evaluation, and independent reproducibility checks of historical
    checkpoint outcomes. Whole-network training was not rerun here.
limitations:
  - >-
    Synthetic sensors, dynamics, brain equations and flight physics are
    engineered; neurons do not model measured biological spikes. The PPO
    policy is learned outside the frozen connectome.
  - >-
    Architecture scenes reuse headings from fixed situations; development
    pools were inspected, and reserved final pools remain unopened.
  - >-
    Only two fresh-chain seeds per arm and one rewired graph exist; chain
    reproduction failed. No matched artificial controller has been shown
    inferior to MaleCNS wiring.
controls:
  - >-
    Compares real anatomical wiring with degree/sign/weight-preserving
    edge shuffle under matched fresh training; keeps explicit search
    planner separate from learned policies and freezes acceptance rules.
  - >-
    Require a successfully reproduced training chain, multiple
    independent rewires, larger seed counts and an unopened final pool
    before ranking anatomy-specific generalization.
  - >-
    Unlike MaleCNS game-policy projects, this project probes geometry
    transfer and rewiring explicitly, but neither line proves an
    advantage over computationally comparable artificial networks.
history:
  - >-
    2026-10-15: initial scientific tier A, interest S, confidence medium;
    failed release gates, original-vs-shuffled ambiguity and underpowered
    control findings preserved.
note: "Reported evaluations are author-run development measurements, not independent full simulation reproductions."
---

# Fly RL — policy learning without proven topological advantage

The meaningful result is partial PPO navigation using a complete connectome
reservoir. The equally meaningful negative is that preregistered gates and
anatomical specificity tests have not succeeded.
