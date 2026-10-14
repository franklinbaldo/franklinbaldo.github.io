---
type: malecns-project
project_id: "mattyhempstead-fly-wirehead"
name: "Fly / Wirehead"
ownership: "independent"
kind: "whole-MaleCNS spiking video-input and artificial reward visualization"
stage: "public runnable integration and authored paired numerical/transport assays; learned preference not demonstrated"
primary_url: "https://github.com/mattyhempstead/fly-wirehead"
repository: "mattyhempstead/fly-wirehead"
evidence_url: "https://github.com/mattyhempstead/fly-wirehead/blob/fcefe9441f80e25aab713411ebced53f5e5ea172/docs/validation.md"
scientific_tier: B
interest_tier: A
confidence: medium
reviewed_at: "2026-10-14"
reviewed_revision: "fcefe9441f80e25aab713411ebced53f5e5ea172"
summary: >-
  A distinct adaptation of Stonkfly's public whole-MaleCNS spiking runtime:
  browser video pixels are fed to a local numerical model, with measured
  neural activity and an engineered motor readout rendered in Three.js.
  Matched checkpoint tests show input-sensitive neural spikes and effective
  artificial PAM11 stimulation, but no video selection, learned addiction,
  preference, biological dopamine measurement, or benefit from the particular
  MaleCNS topology has been established.
strongest_evidence:
  - >-
    The authors' checksum-locked full-graph tests report 166,700 neurons,
    25,582,938 directed connections, 3,335 R1-R6 and 811 R8 mapped inputs;
    the full dataset and runtime were not rerun independently here.
  - >-
    After shared conditioning and checkpoint restore, 100 ms white and black
    inputs reportedly yield 127,378 and 92,952 spikes respectively.
    Same-input replay from the checkpoint preserves an exact spike hash.
  - >-
    In a matched 200 ms white-input test, PAM11 spiking is reported at zero
    without stimulation and 261 spikes with a 20 mV-equivalent current pulse;
    3,087 plastic edges changed. Frozen-plasticity control retained its weights.
  - >-
    Source includes opt-in full-connectome and HTTP-pixel transport tests.
    Validation logs also document presentation regressions corrected and
    browser tests; all of these are author-reported checks, not a new
    independent reproduction.
limitations:
  - >-
    The three-second short-video change is timed, not a choice learned or
    made by the fly model. Default PAM11 drive is injected on every accepted
    video frame, independent of content.
  - >-
    PAM11 firing frequency is not dopamine concentration or pleasure.
    Plastic edge updates are not proof of functional learning or reward.
  - >-
    Movement and the swipe gesture are amplified or choreographed mappings
    to an artistic avatar, not recovered motor behaviors or biophysical gait.
  - >-
    This review did not rerun the 1.1 GB graph preparation, native kernel,
    physical simulation or browser integration.
controls:
  - >-
    Matched white/black input and stimulated/unstimulated comparisons;
    frozen plasticity, checkpoint replay and disabled-video-reward tests.
    These establish response pathways, not behavioral learning.
  - >-
    Missing matched nonconnectome controller, true graph-rewired and
    degree-controlled nulls, content-conditioned preference test, replicated
    behavioral outcome, and quantified compute-vs-quality comparison.
history:
  - >-
    2026-10-14: initial scientific B / interest A / medium confidence based
    on public code and bounded authored mechanism checks, without independent
    full-network reproduction or a validated reward-learning claim.
note: >-
  Distinct from nftechie/stonkfly already catalogued: this project integrates
  video frame transport, reward pulses and a browser exhibit, while explicitly
  attributing and pinning the inherited numerical backend.
---
