# FlyDoom Neural Telemetry Contract

The Neural Observatory is a passive, read-only consumer of simulation telemetry. Visualization must never modify recurrent state, weights, sensory drive, physics, steering, or learning.

## Phase 2A contract — PR #1755

Only macro telemetry is in runtime scope for this PR:

```ts
interface NeuralTelemetryDTO {
  tick?: number;
  simTimeMs?: number;
  macroActivity?: {
    optic: number;       // normalized [0, 1]
    central: number;     // normalized [0, 1]
    descending: number;  // normalized [0, 1]
  };
}
```

The worker must emit only these three scalar activity summaries for the selected fly. It must never post the dense 165,122-neuron state to the render thread.

## Phase 2A views

| View | State in #1755 |
| --- | --- |
| Macro 3D | active after canonical index proof + `region_map.bin` |
| Population timeline | active from the same `macroActivity` samples |
| Active somata 3D | `WAITING FOR TELEMETRY` — Phase 2B |
| Top active neurons | `WAITING FOR TELEMETRY` — Phase 2B |
| Spike / activity raster | `WAITING FOR TELEMETRY` — Phase 2C |
| Regional flow | `WAITING FOR TELEMETRY` — Phase 2C |

The client may expose all six choices, but #1755 must not add runtime extraction for Top-K, soma coordinates, raster slices, or regional-flow matrices.

## Index proof

Before `region_map.bin` is accepted, prove that its body order is exactly the runtime operator order. The proof is intentionally minimal:

1. compare the full two body-ID vectors;
2. print the first and last five IDs from each;
3. compare SHA-256 over little-endian int64 IDs;
4. stop if any value or hash differs.

`scripts/verify_flydoom_index.py` is the complete index-order gate. No per-neuron morphological or ROI re-validation belongs in this proof.

## Transport and performance

1. The recurrent worker is the runtime source of truth.
2. Compute the three macro accumulators while the state is already resident in worker memory.
3. Send only `{ optic, central, descending }` plus tick/time metadata.
4. Visualization remains fail-open: telemetry/rendering failure must not stop FlyDoom.
5. Benchmark SpMV-only against SpMV + the three macro accumulators over 1,000 ticks.
6. Phase 2A passes only if added telemetry cost is **< 0.5 ms** under the recorded benchmark protocol.

## Later phases

Phase 2B may add sparse Top-K plus index-aligned real soma coordinates. Phase 2C may add raster slices and a regional weighted-contribution matrix.

Any future `regionalFlow` value is a contribution proxy, not causal influence. Causal language is reserved for explicit intervention/counterfactual experiments.
