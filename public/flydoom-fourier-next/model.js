export const SENSOR_COLS = 8;
export const SENSOR_ROWS = 4;
export const SENSOR_CELLS = SENSOR_COLS * SENSOR_ROWS;
export const FEATURE_COUNT = 6;
export const GLOBAL_ACTIONS = 5;

export const FEATURE_NAMES = [
  "height",
  "slope-x",
  "slope-z",
  "curvature",
  "normal",
  "slope-mag",
];

export function clamp(value, lo = 0, hi = 1) {
  return Math.min(hi, Math.max(lo, value));
}

export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function gaussian(rng) {
  let u = 0;
  let v = 0;
  while (!u) u = rng();
  while (!v) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(Math.PI * 2 * v);
}

export function buildModes(count = 32) {
  const modes = [];
  for (let shell = 1; modes.length < count; shell++) {
    for (let kx = 0; kx <= shell && modes.length < count; kx++) {
      const kz = shell - kx;
      for (const phase of ["sin", "cos"]) {
        if (modes.length >= count) break;
        modes.push({ kx, kz, phase, freq: Math.hypot(kx, kz) });
      }
    }
  }
  return modes;
}

export function curriculumActionOrder(modeCount = 32) {
  const base = modeCount;
  const order = [
    base + 4, // bowl ↔ curvature
    base + 2, // tilt X ↔ slope X
    base + 3, // tilt Z ↔ slope Z
    0,        // first residual mode ↔ height
    base,     // translation X ↔ normal disagreement
    base + 1, // translation Z ↔ slope magnitude
  ];
  for (let mode = 1; mode < modeCount; mode++) order.push(mode);
  return order;
}

export function curriculumFeatureOrder() {
  return [3, 1, 2, 0, 4, 5];
}

export function curriculumStage(modeCount = 32, stageIndex = 0) {
  const actionOrder = curriculumActionOrder(modeCount);
  const featureOrder = curriculumFeatureOrder();
  const index = clamp(Math.round(stageIndex), 0, actionOrder.length - 1);
  const activeActions = actionOrder.slice(0, index + 1);
  const activeFeatures = featureOrder.slice(
    0,
    Math.min(index + 1, featureOrder.length),
  );
  const actionIndex = actionOrder[index];
  const globalNames = ["translate-x", "translate-z", "tilt-x", "tilt-z", "bowl"];
  return {
    index,
    total: actionOrder.length,
    activeActions,
    activeFeatures,
    unlockedAction: actionIndex,
    unlockedActionLabel:
      actionIndex < modeCount
        ? `fourier-${actionIndex + 1}`
        : globalNames[actionIndex - modeCount],
    unlockedFeature:
      index < featureOrder.length ? featureOrder[index] : null,
    unlockedFeatureLabel:
      index < featureOrder.length ? FEATURE_NAMES[featureOrder[index]] : null,
  };
}

function nonZeroSigned(rng, minMagnitude, maxMagnitude) {
  const sign = rng() < 0.5 ? -1 : 1;
  return sign * (minMagnitude + rng() * (maxMagnitude - minMagnitude));
}

function setTargetAction(state, modes, actionIndex, rng) {
  if (actionIndex < modes.length) {
    const limit = spectralLimit(modes[actionIndex]);
    state.coeff[actionIndex] = nonZeroSigned(rng, limit * 0.28, limit * 0.62);
    return;
  }

  const globalIndex = actionIndex - modes.length;
  if (globalIndex === 0) state.tx = nonZeroSigned(rng, 0.65, 1.8);
  else if (globalIndex === 1) state.tz = nonZeroSigned(rng, 0.65, 1.8);
  else if (globalIndex === 2) state.tiltX = nonZeroSigned(rng, 0.07, 0.2);
  else if (globalIndex === 3) state.tiltZ = nonZeroSigned(rng, 0.07, 0.2);
  else if (globalIndex === 4) state.bowl = nonZeroSigned(rng, 0.09, 0.22);
}

export function createCurriculumTarget(
  modes,
  seed = 1,
  stageIndex = 0,
) {
  const target = createState(modes.length);
  const rng = seededRandom(seed);
  const order = curriculumActionOrder(modes.length);
  const last = clamp(Math.round(stageIndex), 0, order.length - 1);
  for (let index = 0; index <= last; index++) {
    setTargetAction(target, modes, order[index], rng);
  }
  return target;
}

export function maskActions(actions, activeActions) {
  const out = new Float32Array(actions.length);
  for (const index of activeActions) {
    if (index >= 0 && index < actions.length) out[index] = actions[index];
  }
  return out;
}

export function maskFeatures(features, activeFeatures, featureCount = FEATURE_COUNT) {
  const out = new Float32Array(features.length);
  const enabled = new Set(activeFeatures);
  const cells = Math.floor(features.length / featureCount);
  for (let cell = 0; cell < cells; cell++) {
    for (let feature = 0; feature < featureCount; feature++) {
      if (enabled.has(feature)) {
        out[cell * featureCount + feature] =
          features[cell * featureCount + feature];
      }
    }
  }
  return out;
}

export function stateDiscomfortPenalty(
  match,
  target = 0.985,
  gain = 0.45,
  power = 2,
) {
  const deficit = clamp((target - match) / Math.max(1e-9, target), 0, 1);
  return -gain * Math.pow(deficit, power);
}

export function activeModeCount(difficulty, total = 32) {
  if (difficulty === "coarse") return Math.min(total, 8);
  if (difficulty === "mixed") return Math.min(total, 20);
  return total;
}

export function spectralLimit(mode) {
  return clamp(0.62 / Math.pow(Math.max(1, mode.freq), 0.72), 0.07, 0.62);
}

export function createState(modeCount = 32) {
  return {
    coeff: new Float32Array(modeCount),
    tx: 0,
    tz: 0,
    tiltX: 0,
    tiltZ: 0,
    bowl: 0,
  };
}

export function cloneState(state) {
  return {
    coeff: new Float32Array(state.coeff),
    tx: state.tx,
    tz: state.tz,
    tiltX: state.tiltX,
    tiltZ: state.tiltZ,
    bowl: state.bowl,
  };
}

export function createTarget(modes, seed = 1, difficulty = "mixed") {
  const rng = seededRandom(seed);
  const state = createState(modes.length);
  const active = activeModeCount(difficulty, modes.length);

  for (let i = 0; i < active; i++) {
    const limit = spectralLimit(modes[i]);
    const envelope = Math.exp(-0.12 * modes[i].freq * modes[i].freq);
    state.coeff[i] = clamp(
      gaussian(rng) * limit * 0.48 * envelope,
      -limit,
      limit,
    );
  }

  state.tx = (rng() * 2 - 1) * 2.2;
  state.tz = (rng() * 2 - 1) * 2.2;
  if (difficulty !== "coarse") {
    state.tiltX = (rng() * 2 - 1) * 0.22;
    state.tiltZ = (rng() * 2 - 1) * 0.22;
  }
  if (difficulty === "fine") {
    state.bowl = (rng() * 2 - 1) * 0.24;
  }
  return state;
}

export function relocateTarget(target, rng = Math.random) {
  target.tx = (rng() * 2 - 1) * 2.7;
  target.tz = (rng() * 2 - 1) * 2.7;
  return target;
}

function modeValue(mode, x, z) {
  const angle = mode.kx * x * 0.62 + mode.kz * z * 0.62;
  return mode.phase === "sin" ? Math.sin(angle) : Math.cos(angle);
}

export function surfaceHeight(state, modes, x, z) {
  const localX = x - state.tx;
  const localZ = z - state.tz;
  let height =
    state.tiltX * localX +
    state.tiltZ * localZ +
    state.bowl * (localX * localX + localZ * localZ - 8) * 0.09;

  for (let i = 0; i < modes.length && i < state.coeff.length; i++) {
    height += state.coeff[i] * modeValue(modes[i], localX, localZ);
  }

  const radius = Math.hypot(localX, localZ);
  return height * Math.exp(-Math.max(0, radius - 4.6) * 0.65);
}

export function surfaceStats(state, modes, x, z, epsilon = 0.18) {
  const e = epsilon;
  const h = surfaceHeight(state, modes, x, z);
  const xp = surfaceHeight(state, modes, x + e, z);
  const xm = surfaceHeight(state, modes, x - e, z);
  const zp = surfaceHeight(state, modes, x, z + e);
  const zm = surfaceHeight(state, modes, x, z - e);
  const gradX = (xp - xm) / (2 * e);
  const gradZ = (zp - zm) / (2 * e);
  const curvature = (xp + xm + zp + zm - 4 * h) / (e * e);
  const slope = Math.hypot(gradX, gradZ);
  const invNormal = 1 / Math.hypot(gradX, 1, gradZ);

  return {
    height: h,
    gradX,
    gradZ,
    curvature,
    slope,
    normalX: -gradX * invNormal,
    normalY: invNormal,
    normalZ: -gradZ * invNormal,
  };
}

export function mismatchFeatures(currentStats, targetStats) {
  const normalDot = clamp(
    currentStats.normalX * targetStats.normalX +
      currentStats.normalY * targetStats.normalY +
      currentStats.normalZ * targetStats.normalZ,
    -1,
    1,
  );
  const normalGap = Math.max(0, 1 - normalDot);

  return [
    clamp((targetStats.height - currentStats.height) / 2.2, -1, 1),
    clamp((targetStats.gradX - currentStats.gradX) / 1.2, -1, 1),
    clamp((targetStats.gradZ - currentStats.gradZ) / 1.2, -1, 1),
    clamp((targetStats.curvature - currentStats.curvature) / 3.2, -1, 1),
    normalGap < 1e-12 ? 0 : clamp(normalGap / 0.3, 0, 1),
    clamp((targetStats.slope - currentStats.slope) / 1.2, -1, 1),
  ];
}

export function featureMagnitude(features) {
  let squared = 0;
  for (const value of features) squared += value * value;
  return clamp(Math.sqrt(squared / Math.max(1, features.length)), 0, 1);
}

export function sensorCellCenter(index) {
  const col = index % SENSOR_COLS;
  const row = Math.floor(index / SENSOR_COLS);
  return {
    x: -4.2 + (col / (SENSOR_COLS - 1)) * 8.4,
    z: -3.3 + (row / (SENSOR_ROWS - 1)) * 6.6,
  };
}

export function localMismatchField(current, target, modes) {
  const features = new Float32Array(SENSOR_CELLS * FEATURE_COUNT);
  const magnitude = new Float32Array(SENSOR_CELLS);
  const featureRms = new Float32Array(FEATURE_COUNT);

  for (let cell = 0; cell < SENSOR_CELLS; cell++) {
    const { x, z } = sensorCellCenter(cell);
    const currentStats = surfaceStats(current, modes, x, z);
    const targetStats = surfaceStats(target, modes, x, z);
    const cellFeatures = mismatchFeatures(currentStats, targetStats);

    for (let f = 0; f < FEATURE_COUNT; f++) {
      const value = cellFeatures[f];
      features[cell * FEATURE_COUNT + f] = value;
      featureRms[f] += value * value;
    }
    magnitude[cell] = featureMagnitude(cellFeatures);
  }

  for (let f = 0; f < FEATURE_COUNT; f++) {
    featureRms[f] = Math.sqrt(featureRms[f] / SENSOR_CELLS);
  }

  return { features, magnitude, featureRms };
}

export function geometricMatch(current, target, modes, sampleSize = 17) {
  let heightSquared = 0;
  let normalSquared = 0;
  let curvatureSquared = 0;
  let worst = 0;
  let samples = 0;

  for (let iz = 0; iz < sampleSize; iz++) {
    const z = -4.4 + (iz / (sampleSize - 1)) * 8.8;
    for (let ix = 0; ix < sampleSize; ix++) {
      const x = -4.4 + (ix / (sampleSize - 1)) * 8.8;
      const a = surfaceStats(current, modes, x, z);
      const b = surfaceStats(target, modes, x, z);
      const f = mismatchFeatures(a, b);
      heightSquared += f[0] * f[0];
      normalSquared += f[4] * f[4];
      curvatureSquared += f[3] * f[3];
      worst = Math.max(worst, featureMagnitude(f));
      samples++;
    }
  }

  const heightRms = Math.sqrt(heightSquared / samples);
  const normalRms = Math.sqrt(normalSquared / samples);
  const curvatureRms = Math.sqrt(curvatureSquared / samples);
  const loss =
    0.48 * heightRms +
    0.23 * normalRms +
    0.14 * curvatureRms +
    0.35 * worst;
  return {
    match: clamp(Math.exp(-2.35 * loss), 0, 1),
    heightRms,
    normalRms,
    curvatureRms,
    worst,
  };
}

export function precisionPotential(value, target = 0.985, beta = 10) {
  const x = clamp(value / Math.max(1e-9, target), 0, 1);
  return Math.expm1(beta * x) / Math.expm1(beta);
}

export function progressReward(
  current,
  previous,
  target = 0.985,
  beta = 10,
  linearGain = 1.5,
  precisionGain = 7,
) {
  const linear = (current - previous) / target;
  const precision =
    precisionPotential(current, target, beta) -
    precisionPotential(previous, target, beta);
  return clamp(linear * linearGain + precision * precisionGain, -1, 1);
}

function pseudoWeight(inputIndex, hiddenIndex) {
  const value = Math.sin(
    (inputIndex + 1) * 12.9898 + (hiddenIndex + 1) * 78.233,
  );
  return value - Math.floor(value) > 0.5 ? 1 : -1;
}

export function projectDn(dnValues, hiddenCount = 16) {
  const hidden = new Float32Array(hiddenCount);
  const scale = 1 / Math.sqrt(Math.max(1, dnValues.length));
  for (let h = 0; h < hiddenCount; h++) {
    let sum = 0;
    for (let i = 0; i < dnValues.length; i++) {
      sum += dnValues[i] * pseudoWeight(i, h);
    }
    hidden[h] = Math.tanh(sum * scale * 3.2);
  }
  return hidden;
}

export function createReadout(
  actionCount,
  hiddenCount = 16,
  seed = 20260918,
) {
  const rng = seededRandom(seed);
  const weights = new Float32Array(actionCount * hiddenCount);
  const bias = new Float32Array(actionCount);
  for (let i = 0; i < weights.length; i++) {
    weights[i] = (rng() * 2 - 1) * 0.025;
  }
  return { actionCount, hiddenCount, weights, bias };
}

export function readoutActions(readout, hidden, noise = null) {
  const actions = new Float32Array(readout.actionCount);
  for (let a = 0; a < readout.actionCount; a++) {
    let value = readout.bias[a];
    const offset = a * readout.hiddenCount;
    for (let h = 0; h < readout.hiddenCount; h++) {
      value += readout.weights[offset + h] * hidden[h];
    }
    if (noise) value += noise[a];
    actions[a] = Math.tanh(value);
  }
  return actions;
}

export function updateReadout(
  readout,
  hidden,
  actionNoise,
  reward,
  learningRate = 0.0012,
  sigma = 0.12,
) {
  if (!hidden || !actionNoise || !reward) return 0;
  const denom = Math.max(1e-5, sigma * sigma);
  let updateSquared = 0;

  for (let a = 0; a < readout.actionCount; a++) {
    const credit = (learningRate * reward * actionNoise[a]) / denom;
    readout.bias[a] = clamp(readout.bias[a] + credit * 0.08, -1.2, 1.2);
    const offset = a * readout.hiddenCount;
    for (let h = 0; h < readout.hiddenCount; h++) {
      const delta = credit * hidden[h];
      readout.weights[offset + h] = clamp(
        readout.weights[offset + h] + delta,
        -1.5,
        1.5,
      );
      updateSquared += delta * delta;
    }
  }
  return Math.sqrt(updateSquared);
}

export function createDynamics(modeCount) {
  return {
    velocity: new Float32Array(modeCount + GLOBAL_ACTIONS),
  };
}

export function applyActions(state, dynamics, actions, modes, dt) {
  const damping = Math.exp(-5.2 * dt);
  const actionCount = modes.length + GLOBAL_ACTIONS;
  if (actions.length < actionCount) {
    throw new Error("not enough action channels");
  }

  for (let i = 0; i < modes.length; i++) {
    const limit = spectralLimit(modes[i]);
    const velocityIndex = i;
    const targetVelocity = actions[i] * limit * 1.35;
    dynamics.velocity[velocityIndex] =
      dynamics.velocity[velocityIndex] * damping +
      targetVelocity * (1 - damping);
    state.coeff[i] = clamp(
      state.coeff[i] + dynamics.velocity[velocityIndex] * dt,
      -limit,
      limit,
    );
  }

  const base = modes.length;
  const rates = [1.0, 1.0, 0.18, 0.18, 0.14];
  const limits = [3.1, 3.1, 0.45, 0.45, 0.34];
  const keys = ["tx", "tz", "tiltX", "tiltZ", "bowl"];
  for (let j = 0; j < GLOBAL_ACTIONS; j++) {
    const velocityIndex = base + j;
    const targetVelocity = actions[base + j] * rates[j];
    dynamics.velocity[velocityIndex] =
      dynamics.velocity[velocityIndex] * damping +
      targetVelocity * (1 - damping);
    state[keys[j]] = clamp(
      state[keys[j]] + dynamics.velocity[velocityIndex] * dt,
      -limits[j],
      limits[j],
    );
  }
}
