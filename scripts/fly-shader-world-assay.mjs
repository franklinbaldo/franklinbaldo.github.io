// Headless assay for fly-shader's no-reward self-tuning world.
//
// Four matched conditions:
//   real            MaleCNS DNs close the loop through fixed P.
//   open            Same generator/leak and brain activity, but DN feedback off.
//   dn-permute      Normalised DN values are identity-permuted before the same P;
//                   preserves the per-tick multiset of DN activity.
//   columns-permute Compound-eye (lum, dlum) pairs are retinotopically permuted
//                   after baseline calibration; preserves sensory values but not
//                   their column identity.
//
// The DN normalisation baseline is always measured on the unpermuted real
// connectome with theta frozen, then frozen for the coupled run. Nulls never
// learn their own normalisation.
//
// Usage:
//   node scripts/fly-shader-world-assay.mjs
//   node scripts/fly-shader-world-assay.mjs --worlds 1,2,3,4,5 \\
//        --projections 1,2,3,4,5 --seconds 120

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { availableParallelism } from "node:os";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { Worker, isMainThread, parentPort } from "node:worker_threads";
import {
  PUBLIC,
  RESULTS,
  loadConnectome,
  loadSim,
  loadWorld,
  readJson,
} from "./fly-shader-load.mjs";

const CONDITIONS = ["real", "open", "dn-permute", "columns-permute"];
const RECORD_EVERY_SECONDS = 1;
const FINAL_WINDOW_SECONDS = 20;

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function setup() {
  const [sim, world] = await Promise.all([loadSim(), loadWorld()]);
  const { connectome, sha256: connectomeSha } = loadConnectome();
  const eye = readJson("fly-shader/eye_columns.json");
  const types = readJson("fly-shader/dn_types.json");
  const circuit = sim.attachEye(
    sim.prepareCircuit(readJson("flydoom/malecns_circuit.json").data),
    eye.data,
    types.data
  );
  const worldBytes = readFileSync(new URL("fly-shader/world.js", PUBLIC));
  return {
    sim,
    world,
    circuit,
    connectome,
    hashes: {
      connectome_sha256: connectomeSha,
      eye_columns_sha256: eye.sha256,
      dn_types_sha256: types.sha256,
      world_js_sha256: sha256(worldBytes),
    },
  };
}

function resetBrain(ctx) {
  const brain = ctx.sim.createBrain(ctx.circuit, ctx.connectome);
  brain.state.fill(0);
  brain.next.fill(0);
  brain.drive.fill(0);
  return brain;
}

function roundedVector(values, digits = 5) {
  const m = 10 ** digits;
  return Array.from(values, (v) => Math.round(v * m) / m);
}

function mean(values) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function fraction(values, predicate) {
  if (!values.length) return 0;
  let n = 0;
  for (const value of values) if (predicate(value)) n++;
  return n / values.length;
}

function runJob(ctx, job) {
  const { sim, world, circuit } = ctx;
  const tickDt = 1 / sim.NEURAL_HZ;
  const brain = resetBrain(ctx);
  const coupler = world.createWorldCoupler(
    circuit.dn_all.length,
    job.worldSeed,
    job.projectionSeed
  );
  const eye = world.createWorldEye(circuit.eye.count);
  const baselineAcc = world.createDnBaseline(circuit.dn_all.length);

  // Baseline: fixed theta, real unpermuted sensory mapping, no feedback.
  let t = 0;
  const baselineTicks = Math.round(world.WORLD_BASELINE_SECONDS / tickDt);
  for (let k = 0; k < baselineTicks; k++) {
    const sample = world.sampleWorldColumns(
      eye,
      circuit.eye,
      coupler.theta,
      t
    );
    const dn = sim.brainStep(brain, sample);
    world.observeDnBaseline(baselineAcc, dn);
    t += tickDt;
  }
  const baseline = world.freezeDnBaseline(baselineAcc);

  // Null mappings are deterministic from the projection seed and are applied
  // only after the shared baseline has been frozen.
  const dnPermutation =
    job.condition === "dn-permute"
      ? world.createPermutation(
          circuit.dn_all.length,
          1000003 + job.projectionSeed * 7919
        )
      : null;
  const columnPermutation =
    job.condition === "columns-permute"
      ? world.createPermutation(
          circuit.eye.count,
          2000003 + job.projectionSeed * 104729
        )
      : null;
  const permuted = columnPermutation
    ? {
        lum: new Float32Array(circuit.eye.count),
        dlum: new Float32Array(circuit.eye.count),
      }
    : null;

  let previousRetina = new Float32Array(eye.lum);
  const records = [];
  let retinalStep = 0;
  let retinalSamples = 0;
  const totalTicks = Math.round(job.seconds / tickDt);
  const recordTicks = Math.max(
    1,
    Math.round(RECORD_EVERY_SECONDS / tickDt)
  );

  for (let k = 0; k < totalTicks; k++) {
    const sample = world.sampleWorldColumns(
      eye,
      circuit.eye,
      coupler.theta,
      t
    );
    retinalStep += world.rmsDistance(sample.lum, previousRetina);
    retinalSamples++;
    previousRetina.set(sample.lum);

    const brainInput = columnPermutation
      ? world.permuteColumnSample(sample, columnPermutation, permuted)
      : sample;
    const dn = sim.brainStep(brain, brainInput);
    world.worldCouplerStep(coupler, dn, baseline, tickDt, {
      drive: job.condition !== "open",
      dnPermutation,
      gain: job.gain,
      leak: job.leak,
    });
    t += tickDt;

    if ((k + 1) % recordTicks === 0) {
      records.push({
        t: t - world.WORLD_BASELINE_SECONDS,
        retinal_delta_rms: retinalStep / Math.max(1, retinalSamples),
        theta_rms: world.vectorRms(coupler.theta),
        theta_velocity_rms: coupler.velocityNorm,
        theta_raw_velocity_rms: coupler.rawVelocityNorm,
        theta_bound_fraction: coupler.saturationFraction,
      });
      retinalStep = 0;
      retinalSamples = 0;
    }
  }

  // Resample after the last theta update: this is the final perceptual state,
  // not the one from immediately before the last coupling step.
  const finalSample = world.sampleWorldColumns(
    eye,
    circuit.eye,
    coupler.theta,
    t
  );
  const window = records.slice(-FINAL_WINDOW_SECONDS);
  return {
    worldSeed: job.worldSeed,
    projectionSeed: job.projectionSeed,
    condition: job.condition,
    baselineSamples: baseline.samples,
    final: {
      retinal_signature: roundedVector(finalSample.lum),
      theta: roundedVector(coupler.theta),
      retinal_delta_rms: mean(window.map((r) => r.retinal_delta_rms)),
      theta_velocity_rms: mean(window.map((r) => r.theta_velocity_rms)),
      theta_raw_velocity_rms: mean(
        window.map((r) => r.theta_raw_velocity_rms)
      ),
      theta_bound_fraction: mean(window.map((r) => r.theta_bound_fraction)),
      retinal_saturated_fraction: fraction(
        finalSample.lum,
        (value) => Math.abs(value) >= 0.95
      ),
      theta_rms: world.vectorRms(coupler.theta),
    },
    records,
  };
}

function pairwise(values, distance) {
  const out = [];
  for (let i = 0; i < values.length; i++)
    for (let j = i + 1; j < values.length; j++)
      out.push(distance(values[i], values[j]));
  return out;
}

function summarise(results, world) {
  const byCondition = {};
  for (const condition of CONDITIONS) {
    const rows = results.filter((r) => r.condition === condition);
    const perProjection = {};
    for (const projectionSeed of [
      ...new Set(rows.map((r) => r.projectionSeed)),
    ]) {
      const group = rows.filter((r) => r.projectionSeed === projectionSeed);
      const retinalDistances = pairwise(
        group.map((r) => r.final.retinal_signature),
        world.rmsDistance
      );
      const thetaDistances = pairwise(
        group.map((r) => r.final.theta),
        world.rmsDistance
      );
      perProjection[projectionSeed] = {
        runs: group.length,
        retinal_pairwise_rms_mean: mean(retinalDistances),
        theta_pairwise_rms_mean: mean(thetaDistances),
        retinal_delta_rms_mean: mean(
          group.map((r) => r.final.retinal_delta_rms)
        ),
        theta_velocity_rms_mean: mean(
          group.map((r) => r.final.theta_velocity_rms)
        ),
        theta_raw_velocity_rms_mean: mean(
          group.map((r) => r.final.theta_raw_velocity_rms)
        ),
        theta_bound_fraction_mean: mean(
          group.map((r) => r.final.theta_bound_fraction)
        ),
        retinal_saturated_fraction_mean: mean(
          group.map((r) => r.final.retinal_saturated_fraction)
        ),
      };
    }
    byCondition[condition] = {
      runs: rows.length,
      retinal_delta_rms_mean: mean(
        rows.map((r) => r.final.retinal_delta_rms)
      ),
      theta_velocity_rms_mean: mean(
        rows.map((r) => r.final.theta_velocity_rms)
      ),
      theta_raw_velocity_rms_mean: mean(
        rows.map((r) => r.final.theta_raw_velocity_rms)
      ),
      theta_bound_fraction_mean: mean(
        rows.map((r) => r.final.theta_bound_fraction)
      ),
      retinal_saturated_fraction_mean: mean(
        rows.map((r) => r.final.retinal_saturated_fraction)
      ),
      retinal_pairwise_rms_mean: mean(
        Object.values(perProjection).map(
          (x) => x.retinal_pairwise_rms_mean
        )
      ),
      theta_pairwise_rms_mean: mean(
        Object.values(perProjection).map((x) => x.theta_pairwise_rms_mean)
      ),
      perProjection,
    };
  }
  return byCondition;
}

if (!isMainThread) {
  const ctx = await setup();
  parentPort.on("message", (job) => {
    parentPort.postMessage(runJob(ctx, job));
  });
  parentPort.postMessage({ ready: true, hashes: ctx.hashes });
}

if (isMainThread) {
  const { values: args } = parseArgs({
    options: {
      worlds: { type: "string", default: "1,2,3,4,5" },
      projections: { type: "string", default: "1,2,3,4,5" },
      conditions: {
        type: "string",
        default: CONDITIONS.join(","),
      },
      seconds: { type: "string", default: "120" },
      gain: { type: "string" },
      leak: { type: "string" },
      lanes: { type: "string" },
      out: {
        type: "string",
        default: fileURLToPath(new URL("world-attractors.json", RESULTS)),
      },
    },
  });
  const worldSeeds = args.worlds.split(",").map(Number);
  const projectionSeeds = args.projections.split(",").map(Number);
  const conditions = args.conditions.split(",");
  const seconds = Number(args.seconds);
  const calibration = await setup();
  const gain =
    args.gain === undefined ? calibration.world.WORLD_GAIN : Number(args.gain);
  const leak =
    args.leak === undefined ? calibration.world.WORLD_LEAK : Number(args.leak);
  for (const c of conditions)
    if (!CONDITIONS.includes(c)) throw new Error("unknown condition " + c);

  const jobs = [];
  for (const worldSeed of worldSeeds)
    for (const projectionSeed of projectionSeeds)
      for (const condition of conditions)
        jobs.push({
          worldSeed,
          projectionSeed,
          condition,
          seconds,
          gain,
          leak,
        });

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
          console.log(
            msg.condition +
              " w" +
              msg.worldSeed +
              " p" +
              msg.projectionSeed +
              " retinal Δ=" +
              msg.final.retinal_delta_rms.toExponential(2) +
              " (" +
              ((performance.now() - started) / 1000).toFixed(0) +
              " s)"
          );
        }
        const next = jobs.shift();
        if (next) worker.postMessage(next);
        else worker.terminate().then(resolve);
      });
    });

  const requestedLanes = args.lanes ? Number(args.lanes) : null;
  const lanes = Math.max(
    1,
    Math.min(
      jobs.length,
      requestedLanes || Math.max(1, availableParallelism() - 1)
    )
  );
  const ctxForSummary = calibration;
  await Promise.all(Array.from({ length: lanes }, runWorker));

  results.sort(
    (a, b) =>
      a.condition.localeCompare(b.condition) ||
      a.projectionSeed - b.projectionSeed ||
      a.worldSeed - b.worldSeed
  );
  const summary = summarise(results, ctxForSummary.world);
  for (const [condition, s] of Object.entries(summary)) {
    console.log(
      condition +
        ": retinal pairwise=" +
        s.retinal_pairwise_rms_mean.toFixed(4) +
        ", retinal Δ=" +
        s.retinal_delta_rms_mean.toExponential(2)
    );
  }

  mkdirSync(dirname(args.out), { recursive: true });
  writeFileSync(
    args.out,
    JSON.stringify(
      {
        assay: "self-tuning-world",
        ...hashes,
        config: {
          worldSeeds,
          projectionSeeds,
          conditions,
          seconds,
          baselineSeconds: ctxForSummary.world.WORLD_BASELINE_SECONDS,
          gain,
          leak,
          latentDimensions: ctxForSummary.world.WORLD_LATENT_DIM,
          primaryState:
            "1,771 compound-eye luminances; theta distance is secondary",
          latentVisibility:
            "all 128 theta dimensions affect panorama luminance; theta[0..7] also warp coordinates",
          nulls: {
            open:
              "same generator/leak and real brain activity, DN feedback disabled",
            "dn-permute":
              "frozen permutation of normalised DN identities before the same projection P; per-tick DN-value multiset preserved",
            "columns-permute":
              "frozen permutation of (lum, dlum) column pairs after the shared real baseline; sensory values preserved, retinotopy destroyed",
          },
        },
        summary,
        results,
      },
      null,
      1
    )
  );
}
