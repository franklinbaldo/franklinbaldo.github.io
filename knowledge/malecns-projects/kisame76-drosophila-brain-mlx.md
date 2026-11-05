---
type: malecns-project
project_id: kisame76-drosophila-brain-mlx
name: "drosophila-brain-mlx"
ownership: independent
kind: "Apple Silicon MLX/Metal connectome simulator and parity benchmark"
stage: "Published FlyWire and MaleCNS engines with performance files, parity gates and tests"
primary_url: "https://github.com/Kisame76/drosophila-brain-mlx"
repository: "Kisame76/drosophila-brain-mlx"
evidence_url: "https://github.com/Kisame76/drosophila-brain-mlx/blob/e417b33616513ef350b1b1c3cdf2b5b7a1799c8e/bench/results_malecns.json"
scientific_tier: A
interest_tier: A
confidence: medium
reviewed_at: "2026-10-14"
reviewed_revision: "e417b33616513ef350b1b1c3cdf2b5b7a1799c8e"
summary: >-
  Independent numerical implementation and performance comparison of a
  published leaky integrate-and-fire model on FlyWire and MaleCNS. Its
  main MaleCNS claim is a reproducible in-principle runtime/parity benchmark,
  not improved biological behavior. The model constants were calibrated
  to FlyWire rather than MaleCNS. All wall times are author-measured on
  Apple M4 Pro and were not independently reproduced here.
strongest_evidence:
  - >-
    MaleCNS v1.0 author-committed benchmark: 166,700 selected neurons,
    24,469,412 directed edges, 2,000 ticks, 100 high-out-degree sources
    at 150 Hz; fused Metal 1.1676 s per biological second versus sparse
    Metal 1.7055 and naive dense 34.2067, on Apple M4 Pro.
  - >-
    The benchmark records seed 20260816, per-run seconds, peak memory,
    spike-count SHA-256 and PASS parity for every optimized lane against
    the naive baseline (spike counts plus final voltage/conductance arrays).
    The published benchmark is a recorded author run, not a session rerun.
  - >-
    The repository documents a retracted ~213x Brian2 speedup based on
    invalid short-window extrapolation, replacing it with a timed ~7x
    figure for FlyWire (6.2x when accounting for output recording).
    This correction is evidence of benchmark-methodology scrutiny.
  - >-
    A five-seed degree-preserving shuffle control for sugar-to-MN9
    transmission is reported on FlyWire, not MaleCNS. It is not evidence
    that MaleCNS topology causes a particular sensorimotor response.
limitations:
  - >-
    Metal/MLX requires macOS Apple Silicon; no comparable independent
    MaleCNS timing on another device or live whole-body dynamics was run.
  - >-
    Equal spike-count hash and end-state parity among implementations
    establish computational consistency, not that the biological
    parameterization transfers from the FlyWire brain to MaleCNS/VNC.
  - >-
    The FlyWire topology-shuffle MN9 result must not be quoted as a MaleCNS
    topology experiment; cross-specimen spike counts are not interchangeable.
  - >-
    Peak-memory and speed figures depend on host load, compilation,
    warmup, recording mode, readout and kernel tuning. No independent
    equal-work hardware reproduction was performed.
controls:
  - >-
    Four same-pack MaleCNS lanes compare naive dense, chunked dense,
    sparse Metal and fused Metal; outputs are checked for numerical parity.
  - >-
    Brian2 reference comparisons are primarily FlyWire experiments;
    the author notes SpikeMonitor overhead and corrected short-run bias.
  - >-
    For higher confidence, rerun MaleCNS on an independent M-series host
    and compare matched recording/precision with a CPU reference; for a
    causal wiring claim, add a matched MaleCNS adjacency-null control.
  - >-
    Compare with CAOS_FlyCNS or soup-connectome as execution/parity
    neighbors, not as demonstration of learned behavior.
history:
  - >-
    2026-10-14: initial scientific A, interest A, confidence medium;
    performance files, code-level parity checks and corrected benchmarking
    justify strong methodology; no independent full-scale replication.
note: >-
  Author-reported Apple M4 Pro timings; this review inspected committed
  benchmark results and implementation but performed no Metal execution.
---
