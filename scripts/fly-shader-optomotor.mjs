// Headless optomotor assay for /fly-shader/ (phase readout).
//
// Runs the page's own sim.js against the same MaleCNS artifact over several
// static worlds: warm the brain, snapshot, then replay every stimulus speed
// open- and closed-loop from the snapshot (exactly what the page's "Run sweep"
// does once). Prints per-world odd/even summaries and writes the raw sweeps,
// with the connectome's sha256, to scripts/fly-shader-results/optomotor.json.
// Velocities are in x-units/s: the panorama is 2 x-units wide (360° in the
// compound-eye mapping), so 0.3 x/s is 54°/s.
//
//   node scripts/fly-shader-optomotor.mjs [--seeds 1,2,3] [--out file.json]
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import {
  RESULTS,
  loadConnectome,
  loadSim,
  readJson,
} from "./fly-shader-load.mjs";

const sim = await loadSim();

const { values: args } = parseArgs({
  options: {
    seeds: { type: "string", default: "1,2,3,4,5,6,7,8" },
    out: {
      type: "string",
      default: fileURLToPath(new URL("optomotor.json", RESULTS)),
    },
    warmup: { type: "string", default: "4" },
    gain: { type: "string", default: "1" },
  },
});

const { connectome, sha256 } = loadConnectome();
const circuit = sim.prepareCircuit(
  readJson("flydoom/malecns_circuit.json").data
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
const mid = shares.length >> 1;
const median =
  shares.length % 2 ? shares[mid] : (shares[mid - 1] + shares[mid]) / 2;
console.log(
  `open-loop slope > 0 in ${positive}/${results.length} worlds; ` +
    `median directional share ${(100 * median).toFixed(0)}%`
);
mkdirSync(dirname(args.out), { recursive: true });
writeFileSync(
  args.out,
  JSON.stringify(
    {
      assay: "optomotor",
      units: "velocity in x-units/s; panorama = 2 x-units = 360°",
      connectome_sha256: sha256,
      seeds,
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
