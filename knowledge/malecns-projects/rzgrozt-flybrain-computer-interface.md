---
type: malecns-project
project_id: rzgrozt-flybrain-computer-interface
name: "FlyBrain Computer Interface — full-graph sensory-to-motor falsification"
ownership: independent
kind: "Verified full MaleCNS sparse-event LIF, retinotopic graded vision, bounded observability and sandbox-only cursor decoding"
stage: "public reproducible engineering and sensory experiments; anatomy-driven held-out readout works, canonical descending-motor propagation fails"
primary_url: https://github.com/rzgrozt/Flybrain-Computer-Interface
repository: rzgrozt/Flybrain-Computer-Interface
evidence_url: https://github.com/rzgrozt/Flybrain-Computer-Interface/blob/af85576ff66b86510988546181c0c6fedec7c443/docs/spatial-motor-pathway-localization-2026-09-18.md
scientific_tier: A
interest_tier: S
confidence: medium
reviewed_at: '2026-10-10'
reviewed_revision: af85576ff66b86510988546181c0c6fedec7c443
summary: >-
  A well-documented MaleCNS computer-interface research platform that
  verifies whole-graph sparse point-LIF dynamics against an independent
  Brian2 reference and runs progressively more informative visual-to-motor
  tests. A fixed retinotopic voltage/drive readout decodes unseen bar
  positions, but the anatomically grounded motor populations remain
  silent under the unchanged canonical model. A strong mechanistic negative
  result is localized to non-spiking first-hop relays. Scientific A rewards
  reference equivalence, predeclared gates, explicit negative results and
  reproducible assumptions, not evidence of a working brain-controlled
  desktop or fly-like visual behavior.
strongest_evidence:
  - >-
    Official MaleCNS v1.0 inputs are hash-bound and normalized to a
    166,700-neuron, 25,582,938-directed-edge graph. Sparse source-major
    event propagation, target-major reference CSR and explicit transmitter
    policies are distinguished; a 0.1 ms exact-state LIF scheduler compares
    spike times, membrane and synaptic-drive trajectories on three real-data
    64-neuron subgraphs with Brian2. Reported full-graph 100-step sparse-input
    throughput is 0.444 simulated/wall time on the author's CPU, not real time.
  - >-
    An anatomically fixed backprojection onto 113 visible optic columns
    rescues a failed sample-starved 256D ridge decoder. With five calibration
    positions and four unseen positions per axis, reported voltage-centroid
    held-out MAE is 0.0162 horizontal and 0.0355 vertical, with correlations
    0.9971 and 0.9866 and monotonic predictions. The spike-only representation
    is identically zero in all 18 position runs; the external centroid
    computation is not an endogenous CNS motor policy.
  - >-
    A predeclared DNa02/DNg13/DNp09/MDN motor-state gate fails: ten selected
    descending motor neurons remain at baseline, and a 0 to 1.25 mV tonic
    sensitivity sweep also fails. Every motor target is anatomically reachable
    through two or three effective chemical hops, but the first ordinary
    spiking relays receive as much as 4.534 mV of visual voltage shift without
    firing; second-hop drive and downstream motor signals stay exactly zero.
    The September 22 revisions add bounded observation of verified routes
    without reclassifying anatomical reachability as neural transmission.
limitations:
  - >-
    The full network uses modeled point-LIF dynamics, artificial sensory
    transfer functions, a hybrid externally clamped graded retina and
    chosen transmitter-sign rules. Neither anatomy nor Brian2 equivalence
    validates those choices against living-fly physiology.
  - >-
    The successful visual-position readout is an engineered scientific probe
    with a very small held-out bar-position set; it must not be counted as
    spontaneous vision, behavioral generalization, learned control or an
    actual cursor action chosen by downstream MaleCNS dynamics.
  - >-
    The computer motor boundary is a sandbox-only virtual cursor, not a
    connected desktop-control API. No plasticity or stable sensory-to-DN
    neural command has been demonstrated; full reruns and the author's
    private local processed datasets were not available in this review.
controls:
  - >-
    Public negative protocols retain a failed 256D ridge gate, zero-spike
    control, no-baseline-activity cases, predeclared tonic sweep, exact
    signed-path correction, reference versus Numba/NumPy comparisons,
    bounded memory accounting and subnormal-handling trade-offs.
  - >-
    Next controls should include matched rewired/degree-and-sign-preserving
    MaleCNS graphs, tested physiology-sensitive graded relay alternatives,
    broader held-out visual stimuli and a downstream action-ablation test
    before attributing any control advantage to measured topology.
history:
  - >-
    2026-10-10: initial scientific A / interest S / medium confidence;
    source-pinned reference validations and mechanistic failed motor gate
    credited, with no claim of cursor control or MaleCNS topology superiority.
note: >-
  Compare with Byun11/flyvl, where improved retinotopic and sign-preserving
  controls erased earlier apparent topology gains; with
  Doga0/flycns-sim, which demonstrates separate anatomical body/CNS
  interfaces; and with maleCNS-to-humanoid, whose high-level hunger drive
  can directly stimulate motor-command cells.
---
