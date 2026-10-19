---
type: malecns-project
project_id: aliozen0-malecns-virtual-brain-lab
name: "MaleCNS Virtual Brain Lab — synthetic-by-default 3D neuro-lab"
ownership: independent
kind: "FastAPI/React closed-loop virtual fly laboratory with sparse PyTorch LIF"
stage: "public source and Colab UI; default startup uses synthetic connectivity"
primary_url: https://github.com/aliozen0/malecns-virtual-brain-lab
repository: aliozen0/malecns-virtual-brain-lab
evidence_url: https://github.com/aliozen0/malecns-virtual-brain-lab/blob/a4bc51adda36fb346ef5809e95756ab461a677f8/apps/api/server.py
scientific_tier: D
interest_tier: A
confidence: medium
reviewed_at: '2026-10-10'
reviewed_revision: a4bc51adda36fb346ef5809e95756ab461a677f8
summary: >-
  Interactive 3D fly neural lab with LIF, sensory bridges, motor decoder and
  live WebSocket telemetry. The documented cold start calls a seeded synthetic
  connectome generator, not measured MaleCNS connectivity, even with the
  MALECNS_NEURONS full-size override unless a matching external cache is supplied.
  No biological topology-specific behavior has been demonstrated.
strongest_evidence:
  - >-
    apps/api/server.py init_state chooses a local cache if present and otherwise
    calls create_mock_connectome(5000), or create_mock_connectome(target_neurons)
    when MALECNS_NEURONS is set without an equal-size cache.
  - >-
    preprocessor.py creates synthetic neurons and edges. For N >= 100000
    it labels the mock as MaleCNS-v1.0-Janelia-Full. For N > 15000, its
    vectorized weights are exclusively positive even for annotated inhibitory
    neuron types; transmitter signs are ignored in this branch.
  - >-
    Neural code and software flight/maze tests are inspectable. Those tests
    validate engineered takeoff, movement, boundaries and telemetry rather
    than matched real-versus-shuffled connectivity effects.
limitations:
  - >-
    The large dataset label is not measured-data provenance; requested size
    does not authenticate source connectivity. An externally loaded cache
    might be real, but the reviewed API does not independently verify its
    provenance.
  - >-
    The LIF uses its own Euler update and immediate sparse spike propagation;
    Shiu/Brian2 semantic parity and fly-like emergent behavior are unverified.
controls:
  - >-
    Require source hashes and body IDs, fail closed on synthetic mode for
    biological claims, distinguish mock versus actual in the UI and telemetry.
  - >-
    Compare authentic MaleCNS against matched shuffled/synthetic/no-connectome
    drives with decoder and world fixed, including independent test seeds.
history:
  - >-
    2026-10-10: initial scientific D, interest A, medium confidence;
    source establishes a functional UI but synthetic neural default and
    misleading full-size metadata.
note: >-
  Engineering value differs from biological evidence. Compare to the synthetic
  fallback in Snake Training and FlyBrain-HalfLife and the authenticated pack
  handling of drosophila-brain-mlx.
---
