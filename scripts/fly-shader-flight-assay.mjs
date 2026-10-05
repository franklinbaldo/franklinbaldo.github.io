// Headless assays for /fly-shader/'s flight mode, with the page's own sim.js.
//
// stimuli: does the giant fiber (DNp01) respond to what the compound eye sees?
//   Per world: warm the brain 4 s on a static world, snapshot, then run each
//   stimulus for 3 s from the same snapshot and average the giant fiber over
//   0.5–3 s. Reported as the difference from the static branch.
// learn: is there giant-fiber-specific learning? Per world, four conditions
//   with the same world and noise seed: control (no learning), learn (reward =
//   giant fiber), sham (same learner, reward = two random non-GF DNs) and fast
//   (reward = giant fiber, higher rate). Crossings of the giant fiber's 3σ
//   threshold (the takeoff proxy) are counted by an independent tracker with
//   the policy's own rule, so the sham is scored exactly like the learner.
//
// Jobs run in parallel worker threads; results go to
// scripts/fly-shader-results/flight-assay.json with seeds, configuration and
// the sha256 of the connectome and eye tables.
//
//   node scripts/fly-shader-flight-assay.mjs [--assay stimuli,learn]
//        [--seeds 2,3,4] [--seconds 600] [--out file.json]
import { mkdirSync, writeFileSync } from "node:fs";
import { availableParallelism } from "node:os";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} from "node:worker_threads";
import {
  RESULTS,
  loadConnectome,
  loadSim,
  readJson,
} from "./fly-shader-load.mjs";

const CONDITIONS = {
  control: { eta: 0, sham: false },
  learn: { eta: 3e-3, sham: false },
  sham: { eta: 3e-3, sham: true },
  fast: { eta: 1e-2, sham: false },
};
const SIGMA = 0.5;
const INIT_SCALE = 0.6;
const STIMULI = ["static", "yaw", "loom", "recede", "contrastUp", "dim"];

async function setup() {
  const sim = await loadSim();
  const { connectome, sha256 } = loadConnectome();
  const eye = readJson("fly-shader/eye_columns.json");
  const types = readJson("fly-shader/dn_types.json");
  const circuit = sim.attachEye(
    sim.prepareCircuit(readJson("flydoom/malecns_circuit.json").data),
    eye.data,
    types.data
  );
  return {
    sim,
    circuit,
    brain: sim.createBrain(circuit, connectome),
    hashes: {
      connectome_sha256: sha256,
      eye_columns_sha256: eye.sha256,
      dn_types_sha256: types.sha256,
    },
  };
}

function initialWorld(sim, seed) {
  const rng = sim.seededRandom(seed);
  const coeff = new Float32Array(sim.KNOB_COUNT);
  for (let i = 0; i < coeff.length; i++)
    coeff[i] = (rng() * 2 - 1) * INIT_SCALE;
  return coeff;
}

function stimulusJob({ sim, circuit, brain }, seed) {
  const geo = circuit.eye;
  const spt = Math.round(1 / (sim.NEURAL_HZ * sim.WORLD_DT));
  const gfOf = (dn) =>
    circuit.gf.reduce((a, i) => a + dn[i], 0) / circuit.gf.length;
  const apply = {
    static: () => {},
    yaw: (w, v, dt) => sim.shiftWorld(w, 0.3 * dt),
    loom: (w, v, dt) => (v.zoom += 0.6 * dt),
    recede: (w, v, dt) => (v.zoom -= 0.6 * dt),
    contrastUp: (w, v, dt) => (v.gain += 0.4 * dt),
    dim: (w, v, dt) => (v.gain = Math.max(0.1, v.gain - 0.4 * dt)),
  };

  const coeff = initialWorld(sim, seed);
  brain.state.fill(0);
  const eye = sim.createColumnEye(geo.count);
  let t = 0;
  for (let k = 0; k < 4 / sim.WORLD_DT; k++) {
    if (k % spt === 0)
      sim.brainStep(
        brain,
        sim.sampleColumns(eye, geo, coeff, sim.createView(), t)
      );
    t += sim.WORLD_DT;
  }
  const state = new Float32Array(brain.state);

  const gf = {};
  for (const name of STIMULI) {
    brain.state.set(state);
    const w = new Float32Array(coeff);
    const e = sim.cloneColumnEye(eye);
    const v = sim.createView();
    let tt = t;
    let sum = 0;
    let n = 0;
    for (let k = 0; k < 3 / sim.WORLD_DT; k++) {
      apply[name](w, v, sim.WORLD_DT);
      if (k % spt === 0) {
        const dn = sim.brainStep(brain, sim.sampleColumns(e, geo, w, v, tt));
        if (k * sim.WORLD_DT >= 0.5) {
          sum += gfOf(dn);
          n++;
        }
      }
      tt += sim.WORLD_DT;
    }
    gf[name] = sum / n;
  }
  const delta = Object.fromEntries(
    STIMULI.map((name) => [name, gf[name] - gf.static])
  );
  return { assay: "stimuli", seed, gf, delta };
}

function learnJob({ sim, circuit, brain }, seed, condition, seconds) {
  const { eta, sham } = CONDITIONS[condition];
  const geo = circuit.eye;
  const spt = Math.round(1 / (sim.NEURAL_HZ * sim.WORLD_DT));
  const tickDt = spt * sim.WORLD_DT;

  let rewardIdx = circuit.gf;
  if (sham) {
    const r = sim.seededRandom(seed * 7919);
    const pool = circuit.dn_all
      .map((_, i) => i)
      .filter((i) => !circuit.gf.includes(i));
    rewardIdx = [
      pool[Math.floor(r() * pool.length)],
      pool[Math.floor(r() * pool.length)],
    ];
  }

  const coeff = initialWorld(sim, seed);
  brain.state.fill(0);
  const view = sim.createView();
  const eye = sim.createColumnEye(geo.count);
  const policy = sim.createPolicy(circuit.dn_all.length, rewardIdx, seed);
  const tracker = { mean: 0, v: 0, n: 0, flying: false };
  const minutes = [];
  let win = { gf: 0, crossings: 0, n: 0 };
  let t = 0;

  for (let k = 0; k < seconds / sim.WORLD_DT; k++) {
    if (k % spt === 0) {
      const dn = sim.brainStep(
        brain,
        sim.sampleColumns(eye, geo, coeff, view, t)
      );
      sim.policyStep(policy, dn, tickDt, {
        learn: eta > 0,
        eta,
        sigma: SIGMA,
      });
      // Independent giant-fiber tracker, same constants as the policy's.
      const g = circuit.gf.reduce((a, i) => a + dn[i], 0) / circuit.gf.length;
      const a = Math.max(
        1 - Math.exp(-tickDt / sim.REWARD_TAU),
        1 / (tracker.n + 1)
      );
      const dev = g - tracker.mean;
      tracker.mean += a * dev;
      tracker.v += a * (dev * dev - tracker.v);
      const z = tracker.n < 15 ? 0 : dev / Math.sqrt(tracker.v + 1e-12);
      tracker.n++;
      const crossed = z > sim.TAKEOFF_Z && !tracker.flying;
      tracker.flying = z > sim.TAKEOFF_Z * 0.5 && (tracker.flying || crossed);
      win.gf += g;
      win.n++;
      if (crossed) win.crossings++;
    }
    sim.applyActions(coeff, view, policy.actions, sim.WORLD_DT);
    t += sim.WORLD_DT;
    if ((k + 1) % Math.round(60 / sim.WORLD_DT) === 0) {
      minutes.push({ gf: win.gf / win.n, crossings: win.crossings });
      win = { gf: 0, crossings: 0, n: 0 };
    }
  }
  let norm = 0;
  for (const w of policy.W) norm += w * w;
  return {
    assay: "learn",
    seed,
    condition,
    eta,
    rewardIdx,
    crossings: minutes.reduce((a, m) => a + m.crossings, 0),
    minutes,
    weightNorm: Math.sqrt(norm),
  };
}

// ---------------------------------------------------------------- worker side

if (!isMainThread) {
  const ctx = await setup();
  parentPort.on("message", (job) => {
    const result =
      job.assay === "stimuli"
        ? stimulusJob(ctx, job.seed)
        : learnJob(ctx, job.seed, job.condition, job.seconds);
    parentPort.postMessage(result);
  });
  parentPort.postMessage({ ready: true, hashes: ctx.hashes });
}

// ---------------------------------------------------------------- main side

if (isMainThread) {
  const { values: args } = parseArgs({
    options: {
      assay: { type: "string", default: "stimuli,learn" },
      seeds: { type: "string", default: "2,3,4" },
      seconds: { type: "string", default: "600" },
      out: {
        type: "string",
        default: fileURLToPath(new URL("flight-assay.json", RESULTS)),
      },
    },
  });
  const assays = args.assay.split(",");
  const seeds = args.seeds.split(",").map(Number);
  const seconds = Number(args.seconds);
  const jobs = [];
  for (const seed of seeds) {
    if (assays.includes("stimuli")) jobs.push({ assay: "stimuli", seed });
    if (assays.includes("learn"))
      for (const condition of Object.keys(CONDITIONS))
        jobs.push({ assay: "learn", seed, condition, seconds });
  }

  const results = [];
  let hashes = null;
  const started = performance.now();
  const runWorker = () =>
    new Promise((resolve, reject) => {
      const worker = new Worker(new URL(import.meta.url));
      worker.on("error", reject);
      worker.on("message", (msg) => {
        if (msg.ready) hashes = msg.hashes;
        else {
          results.push(msg);
          const label =
            msg.assay === "stimuli"
              ? `stimuli seed ${msg.seed}`
              : `${msg.condition} seed ${msg.seed}: ${msg.crossings} crossings`;
          console.log(
            `${label} (${((performance.now() - started) / 1000).toFixed(0)} s)`
          );
        }
        const next = jobs.shift();
        if (next) worker.postMessage(next);
        else worker.terminate().then(resolve);
      });
    });
  const lanes = Math.max(1, Math.min(jobs.length, availableParallelism() - 1));
  await Promise.all(Array.from({ length: lanes }, runWorker));

  results.sort(
    (a, b) =>
      a.assay.localeCompare(b.assay) ||
      a.seed - b.seed ||
      (a.condition ?? "").localeCompare(b.condition ?? "")
  );
  const summary = {};
  for (const r of results.filter((r) => r.assay === "learn")) {
    const s = (summary[r.condition] ||= { crossings: 0, perSeed: [] });
    s.crossings += r.crossings;
    s.perSeed.push(r.crossings);
  }
  for (const [name, s] of Object.entries(summary))
    console.log(`${name}: ${s.perSeed.join(", ")} → ${s.crossings}`);

  mkdirSync(dirname(args.out), { recursive: true });
  writeFileSync(
    args.out,
    JSON.stringify(
      {
        assay: "flight",
        ...hashes,
        config: {
          seeds,
          seconds,
          sigma: SIGMA,
          initScale: INIT_SCALE,
          conditions: CONDITIONS,
          takeoffZ: 3,
          lamina: "L1+L2 (L3 unilateral in MaleCNS v1.0, not used)",
        },
        summary,
        results,
      },
      null,
      1
    )
  );
}
