# FlyDoom Neural Telemetry Contract

The Neural Observatory is a passive, read-only consumer of simulation telemetry. Visualization must never modify recurrent state, weights, sensory drive, physics, steering, or learning.

## Phase 2A contract — PR #1755

Only macro telemetry is in runtime scope for this PR:

```ts
interface NeuralTelemetryDTO {
  tick?: number;
  simTimeMs?: number;
  macroActivity?: {
    optic: number; // normalized [0, 1]
    central: number; // normalized [0, 1]
    descending: number; // normalized [0, 1]
  };
}
```

The worker emits only these three scalar summaries. It must never post the dense runtime state to the render thread.

## Compiled-runtime truth

`malecns_l3_compact.mcns` is a simplified compiled projection used by FlyDoom. It is not a 1:1 serialization of the full 165,122-neuron MaleCNS graph, so Phase 2A must not infer direct index equality between those representations.

The deterministic offline compiler must emit one coherent bundle in the same compilation run:

- `circuit.mcns`: compact topology and weights consumed by the browser SpMV runtime;
- `provenance.parquet` (or JSON): exactly `Ncompact` rows, where row `i` describes compact slot `i`, including whether it came from one body, a cluster, or a pooling/intermediate unit;
- `region_map.bin`: exactly `Ncompact` uint8 values, where slot `i` is `0=other`, `1=optic`, `2=central`, or `3=descending`.

The provenance table is the scientific bridge from full MaleCNS identity to compact runtime identity. Region membership must be resolved during compilation, not reconstructed later from matching counts, sorted IDs, morphology, or topology.

`scripts/build_flydoom_region_map.py` validates the contract against the actual FlatBuffer offsets vector and emits a hash-pinned compact `region_map.bin`. It requires:

1. `len(provenance) == Ncompact`;
2. contiguous `compact_index == 0..Ncompact-1`;
3. a valid `region_code` for every compact slot;
4. a hash chain over `circuit.mcns`, provenance, and `region_map.bin`.

If the historical compact compiler cannot be recovered, recreate the compact compilation deterministically from the full graph and emit provenance as part of that new compilation. Do not reverse-engineer biological identity from the already-compiled runtime artifact.

## Phase 2A views

| View | State in #1755 |
| --- | --- |
| Macro 3D | active after compact provenance + `region_map.bin` |
| Population timeline | active from the same `macroActivity` samples |
| Active somata 3D | `WAITING FOR TELEMETRY` — Phase 2B |
| Top active neurons | `WAITING FOR TELEMETRY` — Phase 2B |
| Spike / activity raster | `WAITING FOR TELEMETRY` — Phase 2C |
| Regional flow | `WAITING FOR TELEMETRY` — Phase 2C |

The client may expose all six choices, but #1755 must not add runtime extraction for Top-K, soma coordinates, raster slices, or regional-flow matrices.

## Worker contract

The worker is deliberately agnostic to MaleCNS lineage:

1. load `region_map.bin` as a contiguous `Uint8Array(Ncompact)`;
2. keep it index-aligned with the compact state vector;
3. while the state is already hot in worker memory, accumulate only the optic, central, and descending summaries;
4. emit `{ optic, central, descending }` plus tick/time metadata;
5. never interpret `bodyId`, clusters, ROIs, or provenance at runtime.

## Transport and performance

1. The recurrent worker is the runtime source of truth.
2. Visualization remains fail-open: telemetry/rendering failure must not stop FlyDoom.
3. Benchmark the same compact SpMV workload before and after the three macro accumulators over 1,000 ticks.
4. Record mean, median, and p95 delta.
5. Phase 2A passes only if added telemetry cost is **< 0.5 ms per tick** and there is no observable FPS regression.

## Merge gate

Phase 2A leaves draft only when the compact compiler/provenance path is reproducible, the three artifacts are hash-pinned, Macro 3D and Population Timeline show measured runtime activity, the four later views still say `WAITING FOR TELEMETRY`, the benchmark passes, and CI is green.

## Later phases

Phase 2B may add sparse Top-K plus real soma coordinates. Phase 2C may add raster slices and a regional weighted-contribution matrix.

Any future `regionalFlow` value is a contribution proxy, not causal influence. Causal language is reserved for explicit intervention/counterfactual experiments.
