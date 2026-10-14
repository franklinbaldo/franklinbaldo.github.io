---
type: malecns-project
project_id: charbelkassab-flybrain-snake
name: "flybrain-snake"
ownership: independent
kind: "MaleCNS-derived Snake sensorimotor wiring ablation and learned readout"
stage: "Public code, reproducibility script, video and 100-game scoreboard; author-run single-rewiring control"
primary_url: https://github.com/charbelkassab/flybrain-snake
repository: charbelkassab/flybrain-snake
evidence_url: https://github.com/charbelkassab/flybrain-snake/blob/6dcaacb62f2efdc3a624be06962084052664f373/results/scoreboard.json
scientific_tier: B
interest_tier: A
confidence: medium
reviewed_at: '2026-10-14'
reviewed_revision: 6dcaacb62f2efdc3a624be06962084052664f373
summary: >-
  Runs an engineered leaky integrate-and-fire approximation of 165,122 traced
  MaleCNS neurons with visual input routed through annotated LC10a/LPLC2/LC4
  populations. The code contrasts real connections with random-target wiring,
  untrained turning-neuron decisions, random movement and a teacher controller.
  A 1,314-DN trained decoder scores an author-reported 25.4 fruit per 100-game
  evaluation against 4.06 for scrambled wiring. Crucially, the same teacher
  rule without a brain also scores 25.4, and gameplay uses a held-out bank of
  precomputed neuronal responses rather than live network simulation per move.
  The result supports task-relevant stimulus-to-DN information routing in
  this engineered model, not independently acquired Snake-playing intelligence.
strongest_evidence:
  - >-
    Committed results/scoreboard.json and inspectable experiment.py report
    real-plus-decoder 25.4 versus scrambled-plus-decoder 4.06 mean fruit,
    wiring-only 2.92 versus scrambled wiring-only 0.06, and random play 0.16
    over 100 games each. A no-brain reference rule also scores 25.4.
  - >-
    experiment.py records 12 Poisson responses per each of 32 sensory states
    and splits six training responses from six held-out responses before
    fitting a logistic readout; the six test responses are reused throughout
    gameplay. This tests generalization across neural-noise repetitions, not
    to novel game sensory configurations.
  - >-
    The zero-training left-eye to ipsilateral DNa01/DNa02 steering result is
    documented; looming signals fail to activate those four turning neurons,
    preserving the negative limitation on collision avoidance.
limitations:
  - >-
    Stabilization removes selected KC-KC, modulatory and sensory incoming
    edges, changes synaptic gain and time step, and adds spike adaptation.
    This is not a faithful intact biological fly brain or body.
  - >-
    The scrambled control reassigns targets while retaining each source
    column's weights/outgoing contacts; it does not preserve each target's
    incoming degree, and only one rewiring seed is shown. It is not a full
    degree-preserving topology-control ensemble.
  - >-
    The learned decoder imitates the engineered teacher move; the no-brain
    teacher matches its score. All reported performance is from committed
    author-run artifacts, not a rerun with the 1.1 GB connectome in this review.
controls:
  - >-
    Real versus random-target wiring is compared with the same decoder family,
    and separate no-training, random-play, four-steering-neuron and teacher
    controls distinguish routing from learned policy and decision logic.
  - >-
    Training/test splitting is by Poisson response repetitions for 32 fixed
    sensory configurations, not by new games/tasks; no multi-seed topology
    distribution or matched in/out-degree graph rewire is supplied.
  - >-
    Needed: repeat across independent scramble seeds, match incoming/outgoing
    degrees and E/I budgets, test fresh spiking trajectories and new sensory
    patterns, and compare policy fidelity to a no-connectome feature decoder.
history:
  - >-
    2026-10-14: initial scientific B / interest A / medium confidence.
    Favor positive routing evidence while preserving negative looming response,
    teacher-rule parity, response-bank reuse and topology-control limitations.
note: >-
  Nearest catalog neighbors are FlyDoom/DOOMFLY (game readouts), fly.ai/flybrain
  (spiking simulation) and FLYT3 (frozen connectome with trained policy).
  The author's flybrain-intransitive is a separate possible project, not a
  variant of this Snake evaluation.
---
