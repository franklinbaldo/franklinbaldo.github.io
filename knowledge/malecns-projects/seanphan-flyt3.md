---
type: malecns-project
project_id: seanphan-flyt3
name: "FLYT3 / FLYC4"
ownership: independent
kind: "MaleCNS frozen-graph game agent and separate KC-to-MBON plasticity learner"
stage: "Public simulator, web/game code and model card; performance claims author-reported; trained weights and data not verified independently"
primary_url: https://github.com/seanphan/flyt3
repository: seanphan/flyt3
evidence_url: https://github.com/seanphan/flyt3/blob/18fd031f0e735ca3d80c94319df1fd9a0024f77b/MODEL_CARD.md
scientific_tier: B
interest_tier: A
confidence: medium
reviewed_at: '2026-10-14'
reviewed_revision: 18fd031f0e735ca3d80c94319df1fd9a0024f77b
summary: >-
  One public suite contains two different learning pathways: a fixed full-CNS
  MaleCNS spiking graph with REINFORCE-trained descending/VNC readout for
  tic-tac-toe, and a separate mushroom-body model with dopamine-gated
  KC-to-MBON synapse updates. The model card reports 62% and 74% wins over a
  random opponent after roughly one million games for the two pathways.
  The frozen-CNS fire-damage decoder reaches author-reported 60.8% five-class
  accuracy, but an input-matched pooled-pixel MLP reaches 85.7%.
  These are not topology-identifying results; the full-graph serving arm
  does not update its MaleCNS synapses, while the plastic arm is a smaller
  extracted circuit with engineered features and valence.
strongest_evidence:
  - >-
    Public connectome import, sparse LIF stepping, game environment, policy
    training, and MB plasticity implementation make both mechanisms inspectable.
    The MB code explicitly updates weights at existing KC-to-MBON synapses;
    this is distinct from dopamine input-current stimulation in the full graph.
  - >-
    MODEL_CARD.md reports 1,000,448 self-play games and 62% win against a
    random opponent for the readout arm, plus 1,000,000 games and 74% for the
    KC-to-MBON arm. Training artifacts are described, not independently run
    or checked in this review.
  - >-
    The documented satellite-damage result retains a negative non-connectome
    baseline: 60.8% for the frozen-connectome decoder versus 85.7% for a
    pooled-pixel MLP, with an explicitly acknowledged earlier mislabeled
    artifact. This is evidence against superiority on that task.
limitations:
  - >-
    The README still states that wiring is never modified, whereas the model
    card and mushroom.py describe a separate weight-changing arm. Neither
    one should be described as plasticity of the deployed whole CNS.
  - >-
    The play service is self-hosted, not publicly verified here. Reported
    trained weights and fire metrics are stored at paths outside this source
    repository; the benchmark and claimed win rates were not reproduced.
  - >-
    Retinal/current mappings, activity rules, motor decoding, reward and
    mushroom-body calibration are engineered. A win over random play is not
    evidence that biological topology caused the gain.
controls:
  - >-
    Positive game-rate comparison uses a random-opponent baseline, not a
    matched no-connectome, rewired or budget-equal game-controller baseline.
  - >-
    The five-class image branch documents an MLP baseline outperforming
    the circuit decoder, and a former mislabeled artifact, without claiming
    that the separate PixelML/firefly controlled study is a FLYT3 result.
  - >-
    Needed: fixed-split evaluation with public weights, multi-seed confidence
    intervals, topology-preserving versus rewired MB circuitry, and matched
    readout capacity and training compute.
history:
  - >-
    2026-10-14: initial scientific B / interest A / medium confidence.
    Both learning arms are distinguished, and the adverse 85.7%-versus-60.8%
    baseline is retained without crediting a separate repository's controls.
note: >-
  Nearest catalog neighbors: DOOMFLY and FlyDoom (spiking game interfaces),
  fly.ai/flybrain (frozen reservoir), and FlyLM (training-versus-topology
  confounds). The distinct PixelML/firefly study merits separate curation.
---
