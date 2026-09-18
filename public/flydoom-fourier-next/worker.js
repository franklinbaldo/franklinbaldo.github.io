let connectome = null;
let circuit = null;
let state = null;
let nextState = null;
let drive = null;

function clamp(value, lo, hi) {
  return Math.min(hi, Math.max(lo, value));
}

function bucketForCell(cell) {
  const col = cell % 8;
  const row = Math.floor(cell / 8);
  if (col < 4) {
    return { side: "left", index: row * 4 + col };
  }
  return { side: "right", index: row * 4 + (col - 4) };
}

self.onmessage = (event) => {
  const msg = event.data;

  if (msg.type === "init") {
    circuit = msg.circuit;
    connectome = {
      nNeurons: msg.nNeurons,
      offsets: new Uint32Array(msg.offsets),
      scales: new Float32Array(msg.scales),
      deltas: new Uint16Array(msg.deltas),
      weights: new Uint8Array(msg.weights),
      lut: new Float32Array(msg.lut),
    };
    state = new Float32Array(connectome.nNeurons);
    nextState = new Float32Array(connectome.nNeurons);
    drive = new Float32Array(connectome.nNeurons);
    self.postMessage({
      type: "ready",
      neurons: connectome.nNeurons,
      descending: circuit.dn_all.length,
    });
    return;
  }

  if (msg.type !== "step" || !connectome) return;

  const started = performance.now();
  const features = msg.features || [];
  const gains = msg.gains || [];
  const featureCount = msg.featureCount || 6;
  const cellCount = msg.cellCount || 32;
  drive.fill(0);

  // Every spatial cell owns one pre-existing MaleCNS visual ingress bucket.
  // Within that bucket, feature × sign partitions create distinct artificial
  // proprioceptive "flavours" without erasing spatial locality.
  const partitions = featureCount * 2;
  for (let cell = 0; cell < cellCount; cell++) {
    const mapped = bucketForCell(cell);
    const buckets =
      mapped.side === "left" ? circuit.ray_vpl : circuit.ray_vpr;
    const population = buckets[mapped.index] || [];

    for (let feature = 0; feature < featureCount; feature++) {
      const raw = clamp(
        Number(features[cell * featureCount + feature]) || 0,
        -1,
        1,
      );
      const gain = clamp(Number(gains[feature]) || 1, 0, 4);
      const magnitude = Math.abs(raw) * gain;
      if (magnitude < 1e-6) continue;

      const sign = raw >= 0 ? 0 : 1;
      const residue = feature * 2 + sign;
      for (let i = residue; i < population.length; i += partitions) {
        drive[population[i]] += magnitude;
      }
    }
  }

  const N = connectome.nNeurons;
  const offsets = connectome.offsets;
  const scales = connectome.scales;
  const deltas = connectome.deltas;
  const weights = connectome.weights;
  const lut = connectome.lut;

  for (let row = 0; row < N; row++) {
    const start = offsets[row];
    const end = offsets[row + 1];
    let column = 0;
    let accumulator = 0;

    for (let edge = start; edge < end; edge++) {
      column += deltas[edge];
      const packed = weights[edge >> 1];
      const weight = lut[(packed >> (4 * (edge & 1))) & 0x0f];
      accumulator += weight * state[column];
    }

    nextState[row] =
      0.65 * state[row] +
      0.35 * Math.tanh(accumulator * scales[row] * 3.5 + drive[row]);
  }

  const swap = state;
  state = nextState;
  nextState = swap;

  const dnValues = new Float32Array(circuit.dn_all.length);
  for (let i = 0; i < circuit.dn_all.length; i++) {
    dnValues[i] = state[circuit.dn_all[i]];
  }

  self.postMessage(
    {
      type: "result",
      dnValues,
      latency: performance.now() - started,
    },
    [dnValues.buffer],
  );
};
