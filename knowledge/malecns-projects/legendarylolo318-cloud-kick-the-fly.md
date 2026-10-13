---
type: malecns-project
project_id: legendarylolo318-cloud-kick-the-fly
name: "Kick the Fly — full-brain game and validation bench"
ownership: independent
kind: "interactive full-brain game / experimental validation bench"
stage: "Public 4.0 Rust release with bundled MaleCNS brain pack and 21-test held-out validation suite; 12 PASS / 9 FAIL"
primary_url: https://github.com/legendarylolo318-cloud/kick-the-fly
repository: legendarylolo318-cloud/kick-the-fly
evidence_url: https://github.com/legendarylolo318-cloud/kick-the-fly/blob/c8bf4ee52ed132e485b984f4a0ee457964143621/docs/results/4.0/validation_results.json
scientific_tier: A
interest_tier: S
confidence: medium
reviewed_at: '2026-10-13'
reviewed_revision: c8bf4ee52ed132e485b984f4a0ee457964143621
summary: >-
  A native Rust/Bevy game and laboratory around a 166,700-neuron MaleCNS model.
  Its strongest scientific contribution is not the kick-the-buddy presentation
  but a held-out validation battery: 12 of 21 circuit/learning tests pass and
  nine fail, with the failures preserved and traced through the model. The
  suite supports several known sensor-to-command responses but also shows that
  important motor, compass and higher-order learning effects do not emerge.
strongest_evidence:
  - >-
    Version 4.0 records 21 validation tests on seeds 1000-1009, held out from
    exploratory seeds 0-299. Twelve pass and nine fail. Examples that pass
    include looming LPLC2/LC4 -> DNp01 escape, sugar-pathway -> MN9 feeding,
    antennal mechanosensory -> grooming command neurons and optomotor turning.
  - >-
    The looming assay reports a mean driven/baseline ratio of 11.81 versus
    0.80 for 311 matched other visual projection neurons (one-sided Wilcoxon
    p=0.0009765625). The sugar assay reports 2.11 versus 1.25 for the bitter
    control under the same ten held-out seeds.
  - >-
    Negative evidence is explicit: MDN fails to increase leg-motor output
    (mean ratio 0.96), aDN grooming output remains below the 1.5x criterion,
    the E-PG compass tests fail, P1 courtship-song drive is too weak, and the
    second-order conditioning and extinction assays fail after earlier
    protocol/rule artifacts were removed.
  - >-
    The 4.0 Rust simulator is checked against the legacy Python implementation
    with golden tests; the public release also exposes headless validation,
    protocols, rerunnable bundles and failure-autopsy reports rather than
    hiding failed biological expectations.
limitations:
  - >-
    Pass criteria and thresholds were chosen after exploratory probing for the
    release, not copied directly from the cited experiments. A PASS means the
    model shows the stated direction/strength under its criteria, not that it
    numerically matches biological measurements.
  - >-
    Many visible game behaviors still depend on engineered mappings from
    simulated descending activity to game rules and physics. A compelling game
    reaction is not automatically evidence that the full biological pathway is
    reproduced; several downstream motor assays explicitly fail.
  - >-
    The current validation pack retains about 10.27 million connections under
    its data/model rules rather than every raw synaptic contact, and neuronal
    dynamics remain an engineered LIF-style approximation.
  - >-
    This review inspected code and published result artifacts but did not rerun
    the whole 166,700-neuron release or independently reproduce the experiments.
controls:
  - >-
    Most validation tests compare driven populations against matched-size
    alternative neuron populations from the same saved brain state, with ten
    held-out seeds and a predeclared 1.5x plus p<0.01 criterion for standard
    drive assays.
  - >-
    The project preserves failures and documents two earlier mushroom-body
    passes that disappeared after protocol/rule corrections, providing a useful
    guard against promoting artifacts as biological capabilities.
  - >-
    The battery is not a degree/sign-preserving rewiring benchmark for the
    entire game. A stronger topology-specific test would retrain/replay matched
    original, rewired and random graphs under identical sensory/game inputs.
history:
  - >-
    2026-10-13: Initial scientific A / interest S / medium confidence. Held-out
    validation, matched controls and explicit failure autopsies justify A for
    evidence quality; mixed biological outcomes and no independent full rerun
    keep confidence at medium.
note: >-
  The project is especially useful as a calibration case: the same application
  can be spectacular as a demo while its laboratory simultaneously reports
  which expected pathways do and do not survive the chosen dynamics.
---
