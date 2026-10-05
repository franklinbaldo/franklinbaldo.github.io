// Shared simulation for "The Shader Is the Fly's World".
// Used by the page (live loop) and by brain-worker.js (live brain + the lab
// that runs paired counterfactual branches), so both execute identical code.

export const MODE_COUNT = 12;
export const KNOB_COUNT = MODE_COUNT * 2;
export const EYE_COLS = 8;
export const EYE_ROWS = 4;
export const EYE_CELLS = EYE_COLS * EYE_ROWS;
export const FEATURE_COUNT = 6;
export const MOTOR_DRIVE = 0.9;
export const MAX_AMPLITUDE = 1.2;
export const KICK_SIZE = 0.8;
export const READOUT_TAU = 4;
export const NEURAL_HZ = 15;
export const WORLD_DT = 1 / 60;

export function clamp(value, lo, hi) {
  return Math.min(hi, Math.max(lo, value));
}

export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

// ---------------------------------------------------------------- world

export const modes = [];
for (let i = 0; i < MODE_COUNT; i++) {
  const orientation = ((i % 6) * Math.PI) / 6;
  const cycles = i < 6 ? 1.5 : 3.5;
  const k = 2 * Math.PI * cycles;
  const speed = (i < 6 ? 0.6 : 1.1) + 0.12 * (i % 6);
  modes.push({
    kx: k * Math.cos(orientation),
    ky: k * Math.sin(orientation),
    omega: i % 2 ? -speed : speed,
    label: `${cycles}c ${Math.round((orientation * 180) / Math.PI)}°`,
  });
}

export function modeEnergy(coeff, i) {
  const re = coeff[2 * i];
  const im = coeff[2 * i + 1];
  return re * re + im * im;
}

export function limitAmplitude(coeff) {
  for (let i = 0; i < MODE_COUNT; i++) {
    const amplitude = Math.sqrt(modeEnergy(coeff, i));
    if (amplitude > MAX_AMPLITUDE) {
      const scale = MAX_AMPLITUDE / amplitude;
      coeff[2 * i] *= scale;
      coeff[2 * i + 1] *= scale;
    }
  }
}

// Field value and analytic derivatives at (x, y), x ∈ [0, 2], y ∈ [0, 1].
export function sampleField(coeff, x, y, t) {
  let value = 0;
  let dx = 0;
  let dy = 0;
  let laplacian = 0;
  for (let i = 0; i < MODE_COUNT; i++) {
    const m = modes[i];
    const re = coeff[2 * i];
    const im = coeff[2 * i + 1];
    const theta = m.kx * x + m.ky * y - m.omega * t;
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    const term = re * c - im * s;
    const slope = -re * s - im * c;
    value += term;
    dx += slope * m.kx;
    dy += slope * m.ky;
    laplacian -= term * (m.kx * m.kx + m.ky * m.ky);
  }
  return { value, dx, dy, laplacian };
}

// dc/dt = κ·u − λ·c, with u the DN command when the loop is driving.
export function worldStep(coeff, motor, driving, leak, dt) {
  for (let i = 0; i < KNOB_COUNT; i++) {
    const drive = driving ? MOTOR_DRIVE * motor[i] : 0;
    coeff[i] += dt * (drive - leak * coeff[i]);
  }
  limitAmplitude(coeff);
}

// Adds a kick of KICK_SIZE at `phase` to `mode`, then clamps. Returns the
// energy of the perturbation actually applied (the clamp can shorten it).
export function applyKick(coeff, mode, phase) {
  const re0 = coeff[2 * mode];
  const im0 = coeff[2 * mode + 1];
  coeff[2 * mode] += KICK_SIZE * Math.cos(phase);
  coeff[2 * mode + 1] += KICK_SIZE * Math.sin(phase);
  limitAmplitude(coeff);
  const dRe = coeff[2 * mode] - re0;
  const dIm = coeff[2 * mode + 1] - im0;
  return dRe * dRe + dIm * dIm;
}

// ---------------------------------------------------------------- eye

export function eyeCellCenter(cell) {
  const col = cell % EYE_COLS;
  const row = Math.floor(cell / EYE_COLS);
  return { x: ((col + 0.5) / EYE_COLS) * 2, y: (row + 0.5) / EYE_ROWS };
}

export function createEye() {
  return {
    previousLuminance: new Float32Array(EYE_CELLS),
    previousTime: null,
    samples: new Float32Array(EYE_CELLS * FEATURE_COUNT),
  };
}

export function cloneEye(eye) {
  return {
    previousLuminance: new Float32Array(eye.previousLuminance),
    previousTime: eye.previousTime,
    samples: new Float32Array(eye.samples),
  };
}

// `t` is world time (it sets the temporal-derivative feature); `tau` is the
// phase clock of the modes' own drift, which the phase readout can freeze so
// that the only motion on the retina is the stimulus and the fly's own turning.
export function sampleEye(eye, coeff, t, tau = t) {
  const dt =
    eye.previousTime === null ? null : Math.max(1e-3, t - eye.previousTime);
  const out = eye.samples;
  for (let cell = 0; cell < EYE_CELLS; cell++) {
    const { x, y } = eyeCellCenter(cell);
    const f = sampleField(coeff, x, y, tau);
    const luminance = Math.tanh(f.value * 0.9);
    const temporal =
      dt === null
        ? 0
        : Math.tanh(((luminance - eye.previousLuminance[cell]) / dt) * 0.5);
    const o = cell * FEATURE_COUNT;
    out[o] = luminance;
    out[o + 1] = Math.tanh(f.dx / 15);
    out[o + 2] = Math.tanh(f.dy / 15);
    out[o + 3] = temporal;
    out[o + 4] = Math.tanh(Math.hypot(f.dx, f.dy) / 15);
    out[o + 5] = Math.tanh(f.laplacian / 300);
    eye.previousLuminance[cell] = luminance;
  }
  eye.previousTime = t;
  return out;
}

// ---------------------------------------------------------------- motor readout

const projections = new Map();

function projectionFor(dnCount) {
  if (!projections.has(dnCount)) {
    const rng = seededRandom(20261005);
    const signs = new Int8Array(KNOB_COUNT * dnCount);
    for (let i = 0; i < signs.length; i++) signs[i] = rng() < 0.5 ? -1 : 1;
    projections.set(dnCount, signs);
  }
  return projections.get(dnCount);
}

export function createReadout() {
  return {
    mean: new Float64Array(KNOB_COUNT),
    variance: new Float64Array(KNOB_COUNT).fill(1e-2),
    primed: false,
    motor: new Float32Array(KNOB_COUNT),
    haveMotor: false,
    dnMeanAbs: 0,
  };
}

export function cloneReadout(readout) {
  return {
    mean: new Float64Array(readout.mean),
    variance: new Float64Array(readout.variance),
    primed: readout.primed,
    motor: new Float32Array(readout.motor),
    haveMotor: readout.haveMotor,
    dnMeanAbs: readout.dnMeanAbs,
  };
}

// 1,314 DNs → fixed ±1 projection → 24 knob commands in [-1, 1]. With
// `adaptive`, each channel is z-scored against a world-time running estimate.
export function readMotor(readout, dnValues, tickDt, { adaptive, gain }) {
  const dnCount = dnValues.length;
  const signs = projectionFor(dnCount);
  const scale = 1 / Math.sqrt(dnCount);
  const alpha = 1 - Math.exp(-tickDt / READOUT_TAU);

  let absSum = 0;
  for (let d = 0; d < dnCount; d++) absSum += Math.abs(dnValues[d]);
  readout.dnMeanAbs = absSum / dnCount;

  for (let j = 0; j < KNOB_COUNT; j++) {
    let sum = 0;
    const offset = j * dnCount;
    for (let d = 0; d < dnCount; d++) sum += signs[offset + d] * dnValues[d];
    const p = sum * scale;

    if (!readout.primed) readout.mean[j] = p;
    const deviation = p - readout.mean[j];
    readout.mean[j] += alpha * deviation;
    readout.variance[j] +=
      alpha * (deviation * deviation - readout.variance[j]);

    const drive = adaptive
      ? (deviation / Math.sqrt(readout.variance[j] + 1e-8)) * 0.6
      : p * 4;
    readout.motor[j] = Math.tanh(gain * drive);
  }
  readout.primed = true;
  readout.haveMotor = true;
}

// ---------------------------------------------------------------- brain

// Same 16 visual ingress buckets per side as FlyDoom Fourier Next, so the 8×4
// eye keeps its left/right retinotopy (cols 0–3 → vpl, 4–7 → vpr).
export function prepareCircuit(circuit) {
  const buckets = 16;
  const split = (list) => {
    const size = Math.floor(list.length / buckets);
    return Array.from({ length: buckets }, (_, i) =>
      list.slice(i * size, (i + 1) * size)
    );
  };
  // Side of each DN in dn_all order: +1 right (dnr), −1 left (dnl), 0 for the
  // few in neither list. This is the only DN annotation the artifact carries.
  const right = new Set(circuit.dnr);
  const left = new Set(circuit.dnl);
  const dnSide = new Int8Array(circuit.dn_all.length);
  circuit.dn_all.forEach((id, i) => {
    dnSide[i] = right.has(id) ? 1 : left.has(id) ? -1 : 0;
  });
  return {
    ...circuit,
    ray_vpl: split(circuit.vpl),
    ray_vpr: split(circuit.vpr),
    dn_side: dnSide,
  };
}

export function createBrain(circuit, connectome) {
  const n = connectome.offsets.length - 1;
  return {
    circuit,
    connectome,
    neurons: n,
    state: new Float32Array(n),
    next: new Float32Array(n),
    drive: new Float32Array(n),
  };
}

// One recurrent update, identical to the FlyDoom Fourier Next worker: each eye
// cell drives its own ingress bucket, split by feature × sign; the frozen
// MaleCNS weights then relax the state by 0.65/0.35. Returns the DN readout.
export function brainStep(brain, features) {
  const { circuit, connectome, drive } = brain;
  drive.fill(0);
  const partitions = FEATURE_COUNT * 2;
  for (let cell = 0; cell < EYE_CELLS; cell++) {
    const col = cell % 8;
    const row = Math.floor(cell / 8);
    const population =
      col < 4
        ? circuit.ray_vpl[row * 4 + col] || []
        : circuit.ray_vpr[row * 4 + (col - 4)] || [];
    for (let feature = 0; feature < FEATURE_COUNT; feature++) {
      const raw = clamp(features[cell * FEATURE_COUNT + feature] || 0, -1, 1);
      const magnitude = Math.abs(raw);
      if (magnitude < 1e-6) continue;
      const residue = feature * 2 + (raw >= 0 ? 0 : 1);
      for (let i = residue; i < population.length; i += partitions) {
        drive[population[i]] += magnitude;
      }
    }
  }

  const { offsets, scales, deltas, weights, lut } = connectome;
  const state = brain.state;
  const next = brain.next;
  for (let row = 0; row < brain.neurons; row++) {
    const end = offsets[row + 1];
    let column = 0;
    let accumulator = 0;
    for (let edge = offsets[row]; edge < end; edge++) {
      column += deltas[edge];
      const packed = weights[edge >> 1];
      accumulator += lut[(packed >> (4 * (edge & 1))) & 0x0f] * state[column];
    }
    next[row] =
      0.65 * state[row] +
      0.35 * Math.tanh(accumulator * scales[row] * 3.5 + drive[row]);
  }
  brain.state = next;
  brain.next = state;

  const dn = circuit.dn_all;
  const dnValues = new Float32Array(dn.length);
  for (let i = 0; i < dn.length; i++) dnValues[i] = brain.state[dn[i]];
  return dnValues;
}

// ---------------------------------------------------------------- paired probe

export const PROBE_WINDOW = [1, 3];

// Runs one branch forward from a snapshot for PROBE_WINDOW[1] world-seconds
// and returns the mean energy of every mode inside the window. With `brain`,
// the loop is closed (eye → brain → readout → knobs, zero neural latency, at
// NEURAL_HZ); without it the knobs only leak. Everything is deterministic, so
// two branches from the same snapshot differ only by what they were given.
export function runBranch(snapshot, { brain, kick }) {
  const coeff = new Float32Array(snapshot.coeff);
  const eye = cloneEye(snapshot.eye);
  const readout = cloneReadout(snapshot.readout);
  const { leak, adaptive, gain } = snapshot.params;
  let t = snapshot.t;

  if (brain) brain.state.set(snapshot.brainState);
  let kickEnergy = 0;
  if (kick) kickEnergy = applyKick(coeff, kick.mode, kick.phase);

  const energy = new Float64Array(MODE_COUNT);
  let samples = 0;
  const steps = Math.round(PROBE_WINDOW[1] / WORLD_DT);
  const stepsPerTick = Math.round(1 / (NEURAL_HZ * WORLD_DT));
  const tickDt = stepsPerTick * WORLD_DT;

  for (let k = 0; k < steps; k++) {
    if (brain && k % stepsPerTick === 0) {
      const dnValues = brainStep(brain, sampleEye(eye, coeff, t));
      readMotor(readout, dnValues, tickDt, { adaptive, gain });
    }
    worldStep(
      coeff,
      readout.motor,
      Boolean(brain) && readout.haveMotor,
      leak,
      WORLD_DT
    );
    t += WORLD_DT;
    const age = (k + 1) * WORLD_DT;
    if (age >= PROBE_WINDOW[0] - 1e-9) {
      for (let i = 0; i < MODE_COUNT; i++) energy[i] += modeEnergy(coeff, i);
      samples++;
    }
  }
  for (let i = 0; i < MODE_COUNT; i++) energy[i] /= samples;
  return { energy, kickEnergy };
}

// Difference-in-differences: what the closed loop did to the kick, beyond
// what the same kick does to a world whose knobs only leak.
//   R_i = [(closed+kick − closed) − (open+kick − open)]_i / |kick|²
export function pairedProbe(snapshot, brain, kick) {
  const closedKick = runBranch(snapshot, { brain, kick });
  const closedBase = runBranch(snapshot, { brain, kick: null });
  const openKick = runBranch(snapshot, { brain: null, kick });
  const openBase = runBranch(snapshot, { brain: null, kick: null });
  const kickEnergy = openKick.kickEnergy;
  const response = new Float64Array(MODE_COUNT);
  for (let i = 0; i < MODE_COUNT; i++) {
    response[i] =
      (closedKick.energy[i] -
        closedBase.energy[i] -
        (openKick.energy[i] - openBase.energy[i])) /
      kickEnergy;
  }
  return { response, kickEnergy };
}

// ---------------------------------------------------------------- phase readout

// In the phase readout the DNs no longer paint the coefficients: they move the
// fly through a world whose texture is fixed. Yaw is a translation in x, and a
// translation of a Fourier world is an exact phase ramp, so self-motion costs
// one complex rotation per mode and adds no free parameters.
export const YAW_MAX = 0.6; // world-widths per second at full steering command
export const STEER_TAU = 20;
export const OPTO_DURATION = 6;
export const OPTO_WINDOW = [2, 6];
export const OPTO_VELOCITIES = [
  -0.6, -0.3, -0.15, -0.05, 0, 0.05, 0.15, 0.3, 0.6,
];

// f'(x, y) = f(x − dx, y): every mode turns by −kx·dx; amplitudes are untouched.
export function shiftWorld(coeff, dx) {
  for (let i = 0; i < MODE_COUNT; i++) {
    const phi = -modes[i].kx * dx;
    const c = Math.cos(phi);
    const s = Math.sin(phi);
    const re = coeff[2 * i];
    const im = coeff[2 * i + 1];
    coeff[2 * i] = re * c - im * s;
    coeff[2 * i + 1] = re * s + im * c;
  }
}

// Mean right-side DN minus mean left-side DN. Without a functional annotation
// of DN types in the artifact, bilateral asymmetry is the steering proxy; the
// sign convention (right > left ⇒ turn right) is an assumption, and the
// open-loop sweep is what tells whether the circuit agrees with it.
export function steerSignal(dnValues, dnSide) {
  let right = 0;
  let left = 0;
  let nRight = 0;
  let nLeft = 0;
  for (let i = 0; i < dnValues.length; i++) {
    if (dnSide[i] > 0) {
      right += dnValues[i];
      nRight++;
    } else if (dnSide[i] < 0) {
      left += dnValues[i];
      nLeft++;
    }
  }
  return right / Math.max(1, nRight) - left / Math.max(1, nLeft);
}

export function createSteer() {
  return {
    baseline: 0,
    variance: 0,
    ticks: 0,
    raw: 0,
    command: 0,
    haveCommand: false,
  };
}

export function cloneSteer(steer) {
  return { ...steer };
}

// z-scores the raw asymmetry against a slow world-time baseline. The first
// ticks use a running mean (weight 1/n) so the variance is not seeded by a
// single sample and the command does not saturate at start-up.
export function readSteer(steer, raw, tickDt, gain) {
  const alpha = Math.max(
    1 - Math.exp(-tickDt / STEER_TAU),
    1 / (steer.ticks + 1)
  );
  if (steer.ticks === 0) steer.baseline = raw;
  const deviation = raw - steer.baseline;
  steer.baseline += alpha * deviation;
  steer.variance += alpha * (deviation * deviation - steer.variance);
  steer.ticks++;
  steer.raw = raw;
  const z = steer.ticks < 3 ? 0 : deviation / Math.sqrt(steer.variance + 1e-12);
  steer.command = Math.tanh(gain * 0.6 * z);
  steer.haveCommand = true;
}

// One deterministic branch of the optomotor assay: the world turns at
// `velocity` (world-widths/s, + = rightward), the modes' own drift is frozen,
// and with `closed` the fly's yaw is subtracted from the retinal slip. Returns
// the window means of the raw steering asymmetry, the yaw and the slip.
export function runOptomotorBranch(snapshot, brain, velocity, { closed }) {
  const coeff = new Float32Array(snapshot.coeff);
  const eye = cloneEye(snapshot.eye);
  const steer = cloneSteer(snapshot.steer);
  const { steerGain } = snapshot.params;
  const dnSide = brain.circuit.dn_side;
  let t = snapshot.t;
  brain.state.set(snapshot.brainState);

  const steps = Math.round(OPTO_DURATION / WORLD_DT);
  const stepsPerTick = Math.round(1 / (NEURAL_HZ * WORLD_DT));
  const tickDt = stepsPerTick * WORLD_DT;
  let steerSum = 0;
  let ticks = 0;
  let yawSum = 0;
  let samples = 0;

  for (let k = 0; k < steps; k++) {
    const age = k * WORLD_DT;
    const inWindow = age >= OPTO_WINDOW[0] - 1e-9;
    if (k % stepsPerTick === 0) {
      const dnValues = brainStep(brain, sampleEye(eye, coeff, t, snapshot.tau));
      const raw = steerSignal(dnValues, dnSide);
      readSteer(steer, raw, tickDt, steerGain);
      if (inWindow) {
        steerSum += raw;
        ticks++;
      }
    }
    const yaw = closed && steer.haveCommand ? YAW_MAX * steer.command : 0;
    shiftWorld(coeff, (velocity - yaw) * WORLD_DT);
    t += WORLD_DT;
    if (inWindow) {
      yawSum += yaw;
      samples++;
    }
  }
  const yaw = yawSum / samples;
  return { steer: steerSum / ticks, yaw, slip: velocity - yaw };
}

// Open- and closed-loop branches for every velocity from one snapshot. Every
// branch shares the snapshot, so the v = 0 branch is the paired baseline: the
// open-loop response is steer(v) − steer(0), with the circuit's own drift
// removed exactly, as in the kick probes.
export function optomotorSweep(snapshot, brain, velocities, onProgress) {
  const open = [];
  const closed = [];
  velocities.forEach((v, i) => {
    open.push(runOptomotorBranch(snapshot, brain, v, { closed: false }));
    closed.push(runOptomotorBranch(snapshot, brain, v, { closed: true }));
    if (onProgress) onProgress((i + 1) / velocities.length);
  });
  const zero = velocities.indexOf(0);
  const base = zero >= 0 ? open[zero].steer : 0;
  return {
    velocities: [...velocities],
    response: open.map((r) => r.steer - base),
    yaw: closed.map((r) => r.yaw),
    slip: closed.map((r) => r.slip),
  };
}

// Splits a response sampled at ±v into its odd part (direction-selective: it
// flips with the stimulus) and even part (motion per se, or an asymmetric
// input map). The optomotor index is the least-squares slope of the odd part
// through the origin; its share of the energy says how directional it is.
export function optomotorSummary(velocities, values) {
  let num = 0;
  let den = 0;
  let oddEnergy = 0;
  let evenEnergy = 0;
  velocities.forEach((v, i) => {
    if (v <= 0) return;
    const j = velocities.indexOf(-v);
    if (j < 0) return;
    const odd = (values[i] - values[j]) / 2;
    const even = (values[i] + values[j]) / 2;
    num += v * odd;
    den += v * v;
    oddEnergy += odd * odd;
    evenEnergy += even * even;
  });
  return {
    slope: den ? num / den : 0,
    directional: oddEnergy / Math.max(1e-30, oddEnergy + evenEnergy),
  };
}
