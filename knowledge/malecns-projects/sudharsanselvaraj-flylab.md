---
type: malecns-project
project_id: sudharsanselvaraj-flylab
name: "FlyLab — contact-gated coding fly"
ownership: independent
kind: "whole-CNS embodied browser interaction / constrained visual coding benchmark"
stage: "Public trained single-heading benchmark with logged whole-CNS episodes; no matched-topology comparison"
primary_url: https://github.com/Sudharsanselvaraj/Flylab
repository: Sudharsanselvaraj/Flylab
evidence_url: https://github.com/Sudharsanselvaraj/Flylab/blob/565abef46ad7c0e0d598422266aa3b941855936d/docs/physical-coding.md
scientific_tier: B
interest_tier: S
confidence: medium
reviewed_at: '2026-10-13'
reviewed_revision: 565abef46ad7c0e0d598422266aa3b941855936d
summary: >-
  A public screenshot-to-foreleg-to-native-Chromium-key controller linked to a
  MaleCNS-derived recurrent rate simulator. The project publishes auditable
  contact-gated browser sessions, trainable visual readouts, fault correction
  and a visual-input-silencing control. It reports a full-graph 176,422-state
  benchmark that completes narrowly trained HTML heading tasks, not open-ended
  code generation. Neither learned keystroke performance nor physical contact
  fidelity has been shown to depend specifically on MaleCNS topology.
strongest_evidence:
  - >-
    The public full-CNS manifest describes 176,422 included neuPrint Neuron
    records, 25,862,574 retained directed connections, all-positive incoming-
    normalized rate dynamics and 101 identified visual input sites feeding
    576 learned readout sites. This is a simulated network, not measured
    electrophysiology; the headline population differs from the curated
    approximately 166,700-neuron MaleCNS figure.
  - >-
    Committed headless full-CNS evaluation records the HTML heading Hello World
    produced from browser screenshots with 29 trusted native key-down events,
    one Backspace correction and zero final pixel MAE; a separate held-out
    Hello Fly episode records 25 trusted key-downs and zero final pixel MAE.
    These are author-run, narrow heading-curriculum results.
  - >-
    The full-network visual-input silencing artifact records zero decisions,
    zero keystrokes and an abstention; the subgraph evaluation also includes
    normal, wrong-key, held-out, silenced and restored conditions, with
    restored decisions matching the original run.
  - >-
    The project publishes evaluation JSON, dataset/checkpoint/graph hashes,
    replay indices, Chromium contact audit code, and a separate partial
    interactive full-CNS session with ten render-acknowledged key-down events.
    The completed full-CNS sessions were headless; they do not claim full
    interactive render acknowledgment.
limitations:
  - >-
    The task uses a fixed font, layout, keyboard and single-line HTML heading
    grammar. Held-out targets recombine known words/glyphs, not novel syntax,
    unseen UI layouts or general software engineering.
  - >-
    The retinal windows, learned glyph decoder, learned heading transducer,
    generic edit gate, foreleg kinematics and key-contact rules are engineered.
    The recurrent network is an all-positive rate model with no validated
    transmitter signs, synaptic physiology or insect biomechanics.
  - >-
    The accepted full-CNS run simulated 75.276 seconds in 695.39 wall seconds
    (0.108x real time under concurrent validation load). Author-run artifacts
    were inspected; the large connectome, browser stack and 71.9M threshold
    events were not independently reexecuted in this review.
  - >-
    Correct HTML from a trained downstream policy is not evidence of fly
    cognition or fly-specific causal wiring. Visual-input silencing also
    destroys the inputs needed by an ordinary vision-dependent controller.
controls:
  - >-
    Normal, fault-injected, held-out, visual-silenced and restored browser
    episodes test contact gate, recovery and dependency on visual input.
  - >-
    Headless completed sessions are distinguished from a partial interactive
    pose-acknowledged session; kernel numerical parity is an engineering
    control, not a topology comparison.
  - >-
    Missing: degree/sign/compute-matched rewired or non-connectome recurrent
    network and sensory-only controller with identical readout, training and
    task splits. These are needed before attributing coding performance to
    MaleCNS architecture.
history:
  - >-
    2026-10-13: Initial scientific B / interest S / medium confidence. Public
    audit trails, held-out heading task and silencing controls support a
    bounded engineering result; no topology-specific behavioral advantage
    is inferred.
note: >-
  Compared with FlyCoder, FlyLab uses a native Chromium contact-gated editor
  and physical key events instead of CSS control. Compared with FlyLM, it
  demonstrates embodiment and audited interaction, but lacks that project's
  more discriminating topology-control battery.
---
