// Headless optomotor assay for /fly-shader/ (phase readout).
//
// Runs the page's own sim.js against the same MaleCNS artifact over several
// static worlds: warm the brain, snapshot, then replay every stimulus speed
// open- and closed-loop from the snapshot (exactly what the page's "Run sweep"
// does once). Prints per-world odd/even summaries and writes the raw sweeps,
// with the connectome's sha256, to fly-shader-optomotor.json.
//
//   node scripts/fly-shader-optomotor.mjs [--seeds 1,2,3] [--out file.json]
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";

const PUBLIC = new URL("../public/", import.meta.url);
const sim = await import(new URL("fly-shader/sim.js", PUBLIC).href);

const { values: args } = parseArgs({
  options: {
    seeds: { type: "string", default: "1,2,3,4,5,6,7,8" },
    out: { type: "string", default: "fly-shader-optomotor.json" },
    warmup: { type: "string", default: "4" },
    gain: { type: "string", default: "1" },
  },
});

// Same FlatBuffer layout app.js reads in the browser.
function loadConnectome() {
  const raw = readFileSync(new URL("flydoom/malecns_l3_compact.mcns", PUBLIC));
  const buffer = raw.buffer.slice(
    raw.byteOffset,
    raw.byteOffset + raw.byteLength
  );
  const view = new DataView(buffer);
  const root = view.getUint32(0, true);
  const vtable = root - view.getInt32(root, true);
  const vtableLen = view.getUint16(vtable, true);
  const getVector = (fieldIndex, ArrayType) => {
    const offset = 4 + fieldIndex * 2;
    if (offset >= vtableLen) throw new Error(`missing field ${fieldIndex}`);
    const position = root + view.getUint16(vtable + offset, true);
    const start = position + view.getUint32(position, true);
    return new ArrayType(buffer, start + 4, view.getUint32(start, true));
  };
  return {
    sha256: createHash("sha256").update(raw).digest("hex"),
    connectome: {
      offsets: getVector(5, Uint32Array),
      scales: getVector(6, Float32Array),
      deltas: getVector(7, Uint16Array),
      weights: getVector(8, Uint8Array),
      lut: getVector(9, Float32Array),
    },
  };
}

const { connectome, sha256 } = loadConnectome();
const circuit = sim.prepareCircuit(
  JSON.parse(
    readFileSync(new URL("flydoom/malecns_circuit.json", PUBLIC), "utf8")
  )
);
const brain = sim.createBrain(circuit, connectome);
const seeds = args.seeds.split(",").map(Number);
const warmup = Number(args.warmup);
const steerGain = Number(args.gain);
const stepsPerTick = Math.round(1 / (sim.NEURAL_HZ * sim.WORLD_DT));
const results = [];

for (const seed of seeds) {
  const rng = sim.seededRandom(seed);
  const coeff = new Float32Array(sim.KNOB_COUNT);
  for (let i = 0; i < coeff.length; i++) coeff[i] = (rng() * 2 - 1) * 0.25;
  brain.state.fill(0);
  const eye = sim.createEye();
  const steer = sim.createSteer();
  let t = 0;
  // Static world, drift frozen (tau = 0), so the snapshot is not a cold start.
  for (let k = 0; k < warmup / sim.WORLD_DT; k++) {
    if (k % stepsPerTick === 0) {
      const dn = sim.brainStep(brain, sim.sampleEye(eye, coeff, t, 0));
      sim.readSteer(
        steer,
        sim.steerSignal(dn, circuit.dn_side),
        stepsPerTick * sim.WORLD_DT,
        steerGain
      );
    }
    t += sim.WORLD_DT;
  }
  const sweep = sim.optomotorSweep(
    {
      coeff,
      t,
      tau: 0,
      eye,
      steer,
      brainState: new Float32Array(brain.state),
      params: { steerGain },
    },
    brain,
    sim.OPTO_VELOCITIES
  );
  const open = sim.optomotorSummary(sweep.velocities, sweep.response);
  const closed = sim.optomotorSummary(sweep.velocities, sweep.yaw);
  results.push({ seed, open, closed, sweep });
  console.log(
    `seed ${seed}: open slope ${open.slope.toExponential(2)}, ` +
      `directional ${(100 * open.directional).toFixed(0)}% | ` +
      `closed yaw/v ${closed.slope.toFixed(3)}`
  );
}

const positive = results.filter((r) => r.open.slope > 0).length;
const shares = results.map((r) => r.open.directional).sort((a, b) => a - b);
console.log(
  `open-loop slope > 0 in ${positive}/${results.length} worlds; ` +
    `median directional share ${(100 * shares[shares.length >> 1]).toFixed(0)}%`
);
writeFileSync(
  args.out,
  JSON.stringify(
    {
      connectome_sha256: sha256,
      warmup,
      steerGain,
      velocities: sim.OPTO_VELOCITIES,
      window: sim.OPTO_WINDOW,
      results,
    },
    null,
    1
  )
);
