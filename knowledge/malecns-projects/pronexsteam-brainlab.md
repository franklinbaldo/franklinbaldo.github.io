---
type: malecns-project
project_id: pronexsteam-brainlab
name: "BrainLab — cross-connectome simulation atlas"
ownership: independent
kind: "Multi-connectome LIF simulator, reproducibility gates and cross-dataset synapse-count audit"
stage: "Public code, explicit reproduction protocols and committed comparative results; full independent rerun pending"
primary_url: "https://github.com/Pronexsteam/brainlab"
repository: "Pronexsteam/brainlab"
evidence_url: "https://github.com/Pronexsteam/brainlab/blob/0b413899e50390eba614c5f6e5cc2c39bb6a4bb1/docs/2026-09-15-banc-native-synapse-check.md"
scientific_tier: A
interest_tier: A
confidence: medium
reviewed_at: "2026-10-14"
reviewed_revision: "0b413899e50390eba614c5f6e5cc2c39bb6a4bb1"
summary: >-
  Independent, version-aware simulation work comparing the Shiu et al. LIF
  model across FlyWire/FAFB, BANC and MaleCNS v0.9. Its principal finding is
  sensitivity of transferred absolute per-synapse model weights to differences
  in detected synapse counts. The public implementation and committed data
  support a serious computational-model audit, not a demonstrated neural or
  behavioral difference between living flies. All large-data results remain
  author-reported and have not been independently reproduced in this review.
strongest_evidence:
  - >-
    The committed fly-taste atlas reports 76.7 Hz sugar-evoked MN9 output in
    FAFB v783, 17.8 Hz in BANC v888 and 68.9 Hz in MaleCNS v0.9 with unchanged
    LIF parameters; sugar-plus-bitter rates are 0.0, 4.4 and 0.0 Hz. Experiments
    and results are linked to named runs and a common stimulation protocol.
  - >-
    The project specifies a Shiu 2024 FlyWire reference gate and reports
    MN9 111.0 Hz versus a 93.27 Hz recorded oracle (ratio 1.19), Spearman
    0.926 over the 200 most active cells, and a separate local Brian2 output
    of 82.67 Hz. The gate passes its stated tolerance, not exact reproduction.
  - >-
    A native BANC v888 synapse-table audit reports 42,309,621 synapses whose
    pre- and postsynaptic cells have metadata, equal to the published
    compiled-edgelist total. The median BANC/FAFB count ratio across nine
    sugar-path neuron types is 0.35 when restricting to metadata cells and
    0.47 when including additional presynaptic BANC segments.
  - >-
    Public controls report FAFB MN9 70.0 Hz when lowering the edge-count
    threshold to one (versus 76.7 Hz at five); global BANC weight rescaling
    does not restore selective MN9 response, while per-type normalization
    raises MN9 to 57.8 Hz but increases the active population roughly 12-fold.
limitations:
  - >-
    MaleCNS data used here are version 0.9, not version 1.0. Its comparisons
    must not be presented as a MaleCNS v1.0 replication or as proof of
    biologically meaningful sexual dimorphism.
  - >-
    The underlying recordings are a simulated Shiu-style LIF model with
    transmitter-derived sign rules, absolute synaptic weights and imperfect
    cross-dataset cell-type matching. Different synapse detection thresholds,
    proofreading and model transfer are confounded with biological wiring.
  - >-
    The reported native table and GPU experiments require multi-GB datasets
    and were not rerun by this curator. Fast GitHub CI tests explicitly exclude
    the large fly datasets and the main scientific gates; committed results are
    not independent experimental reproduction.
  - >-
    The self-test intentionally reports a red overall verdict because the
    C. elegans touch-response gate remains red. An independent living-animal
    observation or calibrated physiology would be required for biological claims.
controls:
  - >-
    The FlyWire Shiu-reference gate fixes rate and rank-correlation tolerances
    rather than silently fitting them to the MaleCNS comparison; Brian2 is
    separately consulted as a reference implementation.
  - >-
    Native-vs-compiled BANC synapse reconciliation rules out one specific
    preprocessing-threshold explanation within the available tables, but
    cannot recover synapses already omitted upstream of their publication.
  - >-
    Threshold-one versus threshold-five, global scaling and type-normalized
    counterfactuals distinguish numerical sensitivity from selectivity, and
    preserve failed normalization outcomes instead of reporting only successes.
  - >-
    A stronger next test would rerun on MaleCNS v1.0 and data-version-matched
    source tables, use independently calibrated gains and multiple seeds,
    and externally reproduce the native-row counts and gate results.
  - >-
    Compare with MaleCNS NT Audit (annotation and sign accounting),
    drosophila-brain-mlx (runtime parity) and CAOS_FlyCNS (cross-backend
    numerical consistency); none establishes the living-animal interpretation.
history:
  - >-
    2026-10-14: initial scientific A, interest A, confidence medium. Awarded
    for quantified cross-dataset model sensitivity, raw-table accounting and
    meaningful negative controls, not for biological-behavior success.
note: >-
  The project uses MaleCNS v0.9; its cross-dataset LIF results, synapse
  counts and Brian2 comparator are author reports, not independently rerun.
  Dataset licensing differs across sources; no raw data are mirrored here.
---
