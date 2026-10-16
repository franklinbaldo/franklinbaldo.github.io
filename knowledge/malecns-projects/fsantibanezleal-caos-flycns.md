---
type: malecns-project
project_id: fsantibanezleal-caos-flycns
name: "flycns / CAOS_FlyCNS"
ownership: independent
kind: "versioned MaleCNS compiler and cross-language visual/spiking simulation runtime"
stage: "public v0.07.000 Python/npm releases and CI; author-tested full-CNS CPU/WebGPU parity; independent biology validation pending"
primary_url: https://github.com/fsantibanezleal/CAOS_FlyCNS
repository: fsantibanezleal/CAOS_FlyCNS
evidence_url: https://github.com/fsantibanezleal/CAOS_FlyCNS/blob/a9814adeb56749a972274c1ec0803166e0a990a4/docs/models/06_browser.md
scientific_tier: B
interest_tier: S
confidence: medium
reviewed_at: '2026-10-13'
reviewed_revision: a9814adeb56749a972274c1ec0803166e0a990a4
summary: >-
  A packaged MaleCNS v1.0 graph compiler plus Python, TypeScript CPU and WebGPU
  implementations of published fly spiking and graded-vision equations, with
  left/right optic-lobe column maps and a hybrid whole-CNS bridge. Source,
  published packages, tests and author-reported parity results support a strong
  numerical/runtime-engineering contribution, not biological fidelity or
  autonomous behavior. The unmodified published LIF model does not itself
  see through the modeled eyes; the visual/graded bridge is additional modeling.
strongest_evidence:
  - >-
    The v0.07.000 source and tagged release publish Python `flycns` and browser
    `@fasl-work/flycns` implementations, with hash-checked MaleCNS compilation,
    879 left and 892 right optic-lobe columns, and explicit provenance of the
    Shiu LIF and flyvis/Lappalainen graded visual equations. Public CI completed
    successfully; package publication is distinct from independent reproduction.
  - >-
    The authored parity suite includes Brian2-checked circuits, a flyvis-based
    graded-vision reference, eight committed scenarios and 10,005 RNG keys.
    The TypeScript CPU engine reproduces recorded Python reference spikes/traces
    exactly within the documented fixture contract; WebGPU comparisons use
    explicit numerical tolerances rather than bit-identity claims.
  - >-
    On a 200 ms, 57-gustatory-neuron moderate-drive full-CNS run, the author's
    Python and TypeScript CPU executions record 18,063 spikes, identical
    spike-by-spike; WebGPU has the same 18,063 spikes and per-neuron counts
    (count correlation and Jaccard 1.0), but diverges in exact temporal spike
    sequence after step 1,112 because of float32 versus float64 thresholds.
  - >-
    Strong-drive tests expose stochastic high-state variability. In a reported
    five-seed GPU-versus-five-seed reference comparison, mean-rate correlation
    was 0.9836, compared against a split-sample reference distribution whose
    5th percentile was 0.8908; this is numerical agreement, not biological
    calibration.
limitations:
  - >-
    Numerical parity with a reference implementation checks adherence to the
    specified simulated equations. It does not validate those equations against
    male-fly electrophysiology or show real behavioral perception/control.
  - >-
    Hybrid transfers flyvis-derived graded optic dynamics onto MaleCNS
    anatomy, introducing transfer/bridge assumptions; the published LIF
    configuration alone does not implement the visual path.
  - >-
    WebGPU parity requires a local GPU/WebGPU adapter; the project documents
    its GPU-specific CI tests as skipped on runners without hardware. Numerical
    timings and full-scale parity here are author reports, not rerun in this
    curation. GPU full spike order is not exactly equivalent to CPU.
  - >-
    No matched degree-preserving topology-destroying null, alternative graph,
    or task-specific behavioral comparison establishes a MaleCNS-specific
    cognitive advantage. The software's scope is simulation infrastructure.
controls:
  - >-
    SHA-256 and shape checks on compiled arrays, fixture regeneration checks,
    Brian2 reference circuits, NumPy-versus-TypeScript CPU exact parity and
    WebGPU tolerance comparisons test numerical correctness.
  - >-
    Multiple seeds and a split-reference baseline assess agreement under
    stochastic high-activity regimes; the documented GPU order divergence
    is preserved as a negative boundary.
  - >-
    Missing independent re-execution, in-vivo calibration and matched
    rewired/random topology controls forbid biological or topology-specific
    performance claims.
history:
  - >-
    2026-10-13: initial scientific B / interest S, medium confidence. Credit
    released dual-language runtime and detailed cross-backend/source controls;
    reserve biological and topology claims pending causal validation.
note: >-
  Related but not equivalent to soup-connectome (portable deterministic runtime),
  fly.ai/flybrain (controlled pathway/reservoir experiments), and
  AbijahKaj/fruit-fly-brain-research (engineered visual-flight loop). The v0.07
  release documents numerical fidelity, not a validated embodied fly.
---
