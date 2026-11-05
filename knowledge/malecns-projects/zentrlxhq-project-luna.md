---
type: malecns-project
project_id: zentrlxhq-project-luna
name: "Project Luna — proposed connectome-controlled quadruped"
ownership: independent
kind: "Physical robotics concept with a proposed whole-MaleCNS spiking controller"
stage: "Public scaffold and illustrative media; no executable connectome-to-servo pipeline evidenced in reviewed source"
primary_url: "https://github.com/ZentrlxHQ/Project-Luna"
repository: "ZentrlxHQ/Project-Luna"
evidence_url: "https://github.com/ZentrlxHQ/Project-Luna/blob/65b278061e55478cd32656da51b9416ba37f80a1/sim/lif_engine.cu"
scientific_tier: F
interest_tier: B
confidence: high
reviewed_at: "2026-10-14"
reviewed_revision: "65b278061e55478cd32656da51b9416ba37f80a1"
summary: >-
  Ambitious public proposal to drive a robotic quadruped with the complete
  MaleCNS v1.0 graph, using camera/IMU sensors, a LIF spiking simulator, and
  VNC-motor-to-servo decoding. The README advertises completed parsing, a
  sub-5-ms CUDA engine and an unassisted gait; however the reviewed repository
  contains explicit unimplemented stubs for its loader, spike propagation,
  CUDA stepping, sensory encoders and motor bridge. These published files do
  not substantiate functioning simulation, biological control, or autonomous
  walking. Assessment is about this public revision, not whether a private
  physical prototype may exist.
strongest_evidence:
  - >-
    README roadmap marks full graph parsing, real-time LIF execution, sensor
    decoding, a first stand and a four-beat gait as complete; those are
    author assertions, not independently verified performance records.
  - >-
    connectome/loader.py raises NotImplementedError in both fetch() and
    load_graph(); sim/synapse_prop.py raises NotImplementedError in step().
    sim/lif_engine.cu prints an explicit stub message and has no integration
    or synaptic-propagation kernel.
  - >-
    bridge/sensor_encoder.py raises NotImplementedError in both input encoders;
    bridge/motor_decoder.py only prints its port and contains TODOs for
    serial/servo output; firmware/quadruped_hal.ino has TODOs rather than
    servo wiring/drive routines.
  - >-
    The only Python test is tests/test_placeholder.py asserting True.
    bridge/channel_map.yaml has empty input and motor neuron ID lists;
    the dashboard source directory documents a future implementation.
limitations:
  - >-
    There is no code path in the reviewed tree that could presently connect
    a MaleCNS input dataset to physical robot gait. A committed GIF is not
    evidence of how the movement was generated or that the connectome caused it.
  - >-
    No actual performance measurements, motor traces, synchronized recordings,
    frozen test fixtures or graph hashes were found in the inspected scaffold.
  - >-
    Roadmap claims conflict with the public code state. This is a source-level
    reproducibility concern and not an allegation about an author's intentions.
controls:
  - >-
    Before scientific promotion, provide running graph loading, neuron-state
    updates, camera/IMU-to-neuron encoding and VNC-to-servo mapping with
    synchronized raw traces and a reproducible hardware/software setup.
  - >-
    Compare the same motor decoder under MaleCNS, degree-matched rewired
    connectivity, random activity and a conventional robotic gait controller;
    report task performance and compute cost with equivalent budgets.
  - >-
    Include sensory-off, motor-silenced and serial-disconnected controls,
    alongside tests asserting actual output changes rather than placeholder
    success, and supply repeatable independent gait trials.
history:
  - >-
    2026-10-14: initial scientific F, interest B, confidence high. Explicit
    public stub audit outweighs unsourced README claims of completed gait;
    scientific tier may change on a verified functional artefact.
note: >-
  Compare with DesktopFly and Fly.exe, whose claimed actuator interfaces and
  simulation results are separately reviewed; project selection was random,
  but the evidence-based tier assignment was not. No claim about unshared data.
---
