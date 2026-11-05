---
type: malecns-project
project_id: "yusuftmle-flybrain-halflife"
name: "FlyBrain-HalfLife — synthetic-default connectome-inspired FPS agent"
ownership: independent
kind: "FPS hardware-in-the-loop controller / MaleCNS-inspired sparse-network simulator"
stage: "public 12,260-node modeled game controller and tests; actual MaleCNS topology conditional on separately supplied dataset"
primary_url: "https://github.com/Yusuftmle/FlyBrain-HalfLife"
repository: "Yusuftmle/FlyBrain-HalfLife"
evidence_url: "https://github.com/Yusuftmle/FlyBrain-HalfLife/blob/0ba5548be6fade5e7657b3cea4e8c6177591c7a1/data_loader.py"
scientific_tier: D
interest_tier: A
confidence: medium
reviewed_at: "2026-10-14"
reviewed_revision: "0ba5548be6fade5e7657b3cea4e8c6177591c7a1"
summary: >-
  A game-facing vision/LIF/action pipeline presents itself as a MaleCNS v1.0
  neural controller for Half-Life/ViZDoom, including a simulated retina,
  steering/escape logic, adaptive responses and tests. Crucially, the default
  `ConnectomeDataLoader.build_canonical_flywire_connectome()` path does NOT
  load the published MaleCNS connectome: absent a compatible user-supplied
  graph or cached graph, it deterministically creates artificial tract edges
  with `add_tract()`. Thus reported 12,260-node model operation and in-game
  clips cannot be interpreted as measured-connectome behavior by default.
strongest_evidence:
  - >-
    The public source defines a 3,600-neuron retina, 4,800 optic neurons,
    1,200 central-complex neurons, 2,400 KCs, 120 MBONs, 60 DANs and 80
    descending neurons (12,260 total) and a runnable PyTorch/SciPy LIF and
    motor-interface architecture.
  - >-
    Source-level provenance check: graph loader first accepts a special
    external `ptr/post/weight` NPZ when supplied and then a precompiled local
    cache, but otherwise synthesizes edges by arithmetic index rules
    `src_ids = arange(...)` and `dst_ids = ((arange(...)*3+shift)%dst_len)`.
    No MaleCNS edge table is read in this default branch.
  - >-
    Published tests exercise numerical stepping, retina gain, dry-run motor,
    reaction state transitions and a standalone synthetic game arena; these
    are engineering checks and do not demonstrate a connectome-caused action.
limitations:
  - >-
    The README's language of connectome-driven biologically generated actions
    overstates what its default graph source establishes. The user can
    optionally furnish compatible neural graph data, but there is no
    independently verified run using the measured topology in this review.
  - >-
    Reaction, damage, shooting and evasive behaviors include conventional
    image heuristics, thresholded decoders and imperative finite-state
    machine actions. Thus a video of game behavior cannot attribute all
    decisions to LIF dynamics or a biological pathway.
  - >-
    The experimental directory describes proposed paradigms rather than
    measured paired baselines. Main platform/game runtimes and full data
    deployment were not reproduced here.
controls:
  - >-
    Unit tests and dry-run input safety exercise component behavior; no
    published matched actual-MaleCNS vs synthetic/reconfigured graph ablation
    with identical game loop and resource budget was identified.
  - >-
    Required discriminating test: pin a provenance-checked MaleCNS edge
    table, document active-graph SHA and compare identical seeds/inputs to
    the current synthetic-default implementation and a matched topology
    control, with behavioral endpoints predeclared.
history:
  - "2026-10-14: initial scientific D / interest A / medium confidence; default synthesized edges directly observed in public loader, so biological/topology claims are not credited."
note: >-
  Compare with FlyDoom and flybrain-snake, where connectome-path
  attribution is also a central question. This rating assesses verifiable
  default operation, not the value of its visualization or control UI.
---
