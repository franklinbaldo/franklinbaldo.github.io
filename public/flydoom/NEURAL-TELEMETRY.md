# FlyDoom Neural Telemetry Contract

The Neural Observatory is a passive, read-only consumer of simulation telemetry. Visualization must never modify recurrent state, weights, sensory drive, physics, steering, or learning.

## Canonical DTO

```ts
interface NeuralTelemetryDTO {
  tick?: number;
  simTimeMs?: number;

  // Macro 3D + Population Timeline
  macroActivity?: {
    optic: number;       // normalized [0, 1]
    central: number;     // normalized [0, 1]
    descending: number;  // normalized [0, 1]
  };

  // Top Active Neurons + Active Somata 3D
  topK?: {
    indices: Uint32Array | number[];      // SpMV indices [0..N-1]
    activities: Float32Array | number[];  // current simulated activity

    // Optional enrichments. Static metadata SHOULD be looked up client-side
    // from an index-aligned asset when possible instead of resent every tick.
    coords?: Float32Array | number[];     // packed x,y,z triples, real soma coordinates only
    bodyIds?: BigUint64Array | number[] | string[];
    regions?: Uint8Array | number[];
    labels?: string[];
  };

  // Compact observed-channel raster for the current tick.
  rasterSlice?: Uint8Array | number[];

  // 3x3 instantaneous weighted-contribution proxy:
  // optic / central / descending -> optic / central / descending.
  // This is NOT a causal estimate.
  regionalFlow?: number[][];
}
```

## Client views

| View | Renderer | Primary telemetry | Missing-data behavior |
| --- | --- | --- | --- |
| Macro 3D | Three.js | `macroActivity` | schematic geometry remains visible, clearly labeled |
| Active somata 3D | Three.js | `topK` + real soma XYZ | `WAITING FOR XYZ`; never invent coordinates |
| Spike / activity raster | Canvas 2D | `rasterSlice` | waits; Top-K activity may be shown only as an explicit fallback |
| Population timeline | Canvas 2D | history of `macroActivity` | waits for real macro telemetry |
| Top active neurons | Canvas 2D | `topK` | waits for Top-K |
| Regional flow | Canvas 2D | `regionalFlow` | waits for contribution telemetry |

## Transport rules

1. The recurrent worker is the source of runtime truth.
2. Never post the dense 165k-neuron state to the render thread each tick.
3. Compute summaries while state is already hot in worker memory and send only compact telemetry.
4. Prefer static index-aligned metadata assets for body IDs, region codes, labels and soma XYZ. Per-tick payload should normally contain indices and activities only.
5. TypedArrays are accepted directly. Renderers may retain compact slices only when history requires it.
6. Visualization is fail-open: telemetry/rendering failure must not stop FlyDoom.

## Semantics

`regionalFlow` is an **instantaneous weighted-contribution proxy** (for example, an aggregation of `W_ij * x_j` over region pairs). It must not be described as causal influence. Causal language is reserved for explicit intervention/counterfactual experiments.

Soma coordinates must originate from the pinned MaleCNS release (`somaLocation`) and be aligned to exactly the same neuron index order as the runtime operator. Missing soma coordinates stay missing.

Macro region codes are likewise valid only after the region artifact has been proven to use the exact runtime index order. A plausible body-ID ordering is not sufficient evidence.
