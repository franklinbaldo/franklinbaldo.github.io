---
type: malecns-project
project_id: us-connectorch
name: "ConnecTorch — differentiable sparse biological connectomes"
ownership: independent
kind: "PyTorch connectome compiler and controlled MaleCNS motif experiments"
stage: "Public package, test suite, five-seed controlled results and full-graph resource benchmark; independent replication pending"
primary_url: "https://github.com/us/connectorch"
repository: "us/connectorch"
evidence_url: "https://github.com/us/connectorch/blob/c2bb1e838ee56ab67bb4d620895e5d63f43a274c/docs/findings.md"
scientific_tier: A
interest_tier: S
confidence: medium
reviewed_at: "2026-10-15"
reviewed_revision: "c2bb1e838ee56ab67bb4d620895e5d63f43a274c"
summary: >-
  Compiles traced MaleCNS connectivity to differentiable sparse recurrent
  PyTorch operators while holding graph topology fixed. Five-seed studies
  find a benefit of intact signed early-visual wiring on an engineered
  endpoint-free 1-D motion task, while generic MNIST and 2-D motion give
  negative results. This is evidence about artificial tasks and circuit
  inductive bias, not fly behavioral fidelity.
strongest_evidence:
  - >-
    The source implements a fixed-topology trainable sparse recurrent network
    and biological sign-constrained weights. The author's GB10 whole-graph
    resource test reports 164,587 nodes, 25,563,197 directed connections
    and 1,129 ms forward plus backward (batch=4, steps=8, 7.84 GiB VRAM).
  - >-
    Endpoint-free 1-D visual motion on 41,826 nodes / 262,585 edges:
    accuracy 0.9535 ± 0.0382 intact, 0.8352 ± 0.1592 random,
    0.6941 ± 0.0726 sign-shuffled, and 0.5801 ± 0.1427 with collapsed
    excitation/inhibition (five seeds, three epochs).
  - >-
    Negative controls are retained: 100-neuron MNIST yields 0.9611
    intact vs 0.9641 random; 2-D endpoint-free flow yields 0.2918
    intact vs 0.2895 random (chance 0.25). Delay removal improved
    1-D accuracy to 0.9832 instead of lowering it.
limitations:
  - >-
    Input stimuli, transmitter signs, dynamics and readouts are modeled,
    not measured fly responses. Some random-control parameter budgets
    differ slightly (42,412 versus 42,188 in 1-D motion).
  - >-
    The full-span motion stimulus leaks endpoint information; the
    endpoint-free condition mitigates but does not establish general
    2-D perception or distribution-shift robustness.
  - >-
    Five-seed tables and hardware measurements are author-reported,
    not independently reproduced here. A separate positive worm
    chemotaxis study is not counted as MaleCNS evidence.
controls:
  - >-
    Public controls include degree-preserving rewires, random topology,
    sign shuffles, weight shuffles, inhibitory collapse, delay removal
    and downstream silencing, depending on the task.
  - >-
    Independently rerun paired seeds and exact parameter/compute-matched
    topology controls on held-out stimulus families.
  - >-
    Compared with game-policy projects FlyDurak and Fly Meijin,
    ConnecTorch probes circuit computation and a reusable operator
    rather than reporting game wins.
history:
  - >-
    2026-10-15: first evidence-driven tier scientific A, interest S,
    confidence medium. Negative experiments preserved without
    claiming full-fly biological fidelity.
note: "Only public source-pinned evidence reviewed; no full graph simulation rerun."
---

# ConnecTorch — connected circuits, controlled tasks

A meaningful 1-D circuit result coexists with negative MNIST and 2-D flow
results. Credit goes to the controls and distinctions, not node count alone.
