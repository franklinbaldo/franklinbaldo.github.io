import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

import {
  FEATURE_COUNT,
  FEATURE_NAMES,
  GLOBAL_ACTIONS,
  SENSOR_CELLS,
  applyActions,
  buildModes,
  clamp,
  createCurriculumTarget,
  createDynamics,
  createReadout,
  createState,
  curriculumStage,
  geometricMatch,
  localMismatchField,
  maskActions,
  maskFeatures,
  projectDn,
  readoutActions,
  spectralLimit,
  stateAwareReward,
  stateDiscomfortPenalty,
  surfaceHeight,
  updateReadout,
} from "./model.js";

const MODES = buildModes(32);
const ACTION_COUNT = MODES.length + GLOBAL_ACTIONS;
const HIT_THRESHOLD = 0.985;
const STAGE_MATCH_THRESHOLD = 0.97;
const STAGE_HOLD_TICKS = 12;
const SENSE_INTERVAL_MS = 80;
const OUTPUT_SIGMA = 0.12;
const INPUT_SIGMA = 0.08;
const INPUT_LR = 0.00035;

function gaussian() {
  let u = 0;
  let v = 0;
  while (!u) u = Math.random();
  while (!v) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(Math.PI * 2 * v);
}

function noiseForIndices(length, indices, sigma) {
  const out = new Float32Array(length);
  for (const index of indices) {
    if (index >= 0 && index < length) out[index] = gaussian() * sigma;
  }
  return out;
}

function featureNoiseForStage(stage, sigma) {
  const out = new Float32Array(FEATURE_COUNT);
  for (const feature of stage.activeFeatures) {
    out[feature] = gaussian() * sigma;
  }
  return out;
}

let curriculumSeed = 20260918;
let stageIndex = 0;
let stage = curriculumStage(MODES.length, stageIndex);
let current = createState(MODES.length);
let target = createCurriculumTarget(MODES, curriculumSeed, stageIndex);
let dynamics = createDynamics(MODES.length);
let readout = createReadout(ACTION_COUNT, 32, curriculumSeed);
let featureGain = new Float32Array([1.6, 1.2, 1.2, 1.0, 1.3, 0.9]);
let heldActions = new Float32Array(ACTION_COUNT);

let previousHidden = null;
let previousActionNoise = null;
let previousInputNoise = null;
let pendingInputNoise = null;

let latestField = localMismatchField(current, target, MODES);
let latestScore = geometricMatch(current, target, MODES);
let previousMatch = latestScore.match;
let progressComponent = 0;
let statePenalty = stateDiscomfortPenalty(previousMatch, HIT_THRESHOLD);
let reward = clamp(progressComponent + statePenalty, -1, 1);
let learningCredit = 0;

let stageStreak = 0;
let stagesMastered = 0;
let updateNorm = 0;
let paused = false;
let targetDirty = true;
let neuralLatency = 0;
let workerReady = false;
let workerBusy = false;
let worker = null;
let selectedFeature = stage.activeFeatures[0];
const scoreHistory = [];

const statusEl = document.getElementById("status");
const statusTextEl = document.getElementById("statusText");
const matchEl = document.getElementById("matchValue");
const rewardEl = document.getElementById("rewardValue");
const rewardBreakdownEl = document.getElementById("rewardBreakdown");
const hitEl = document.getElementById("hitValue");
const latencyEl = document.getElementById("latencyValue");
const updateEl = document.getElementById("updateValue");
const gainEl = document.getElementById("gainValue");
const targetLabelEl = document.getElementById("targetLabel");
const stageLabelEl = document.getElementById("stageLabel");
const vizLabelEl = document.getElementById("vizLabel");
const heatmapEl = document.getElementById("heatmap");
const featureBarsEl = document.getElementById("featureBars");
const actionBarsEl = document.getElementById("actionBars");
const historyCanvas = document.getElementById("history");
const historyCtx = historyCanvas.getContext("2d");
const curriculumCanvas = document.getElementById("curriculumCanvas");
const curriculumCtx = curriculumCanvas.getContext("2d");
const surfaceStage = document.getElementById("surfaceStage");

function clearCreditMemory() {
  previousHidden = null;
  previousActionNoise = null;
  previousInputNoise = null;
  pendingInputNoise = null;
}

function syncStage() {
  stage = curriculumStage(MODES.length, stageIndex);
  if (!stage.activeFeatures.includes(selectedFeature)) {
    selectedFeature = stage.activeFeatures.at(-1);
  }
  buildFeatureButtons();
  updateTargetLabel();
}

function resetCurrent({ resetLearning = false } = {}) {
  current = createState(MODES.length);
  dynamics = createDynamics(MODES.length);
  heldActions.fill(0);
  clearCreditMemory();
  stageStreak = 0;
  progressComponent = 0;

  if (resetLearning) {
    readout = createReadout(ACTION_COUNT, 32, curriculumSeed);
    featureGain = new Float32Array([1.6, 1.2, 1.2, 1.0, 1.3, 0.9]);
    stagesMastered = 0;
    scoreHistory.length = 0;
  }

  latestField = localMismatchField(current, target, MODES);
  latestScore = geometricMatch(current, target, MODES);
  previousMatch = latestScore.match;
  statePenalty = stateDiscomfortPenalty(previousMatch, HIT_THRESHOLD);
  reward = clamp(statePenalty, -1, 1);
  targetDirty = true;
}

function restartCurriculum({ newSeed = false, resetLearning = false } = {}) {
  if (newSeed) curriculumSeed++;
  stageIndex = 0;
  stage = curriculumStage(MODES.length, stageIndex);
  target = createCurriculumTarget(MODES, curriculumSeed, stageIndex);
  selectedFeature = stage.activeFeatures[0];
  resetCurrent({ resetLearning });
  targetDirty = true;
  syncStage();
}

function advanceCurriculum() {
  if (stageIndex < stage.total - 1) {
    stageIndex++;
  } else {
    curriculumSeed++;
  }

  stage = curriculumStage(MODES.length, stageIndex);
  target = createCurriculumTarget(MODES, curriculumSeed, stageIndex);
  stageStreak = 0;
  stagesMastered++;
  progressComponent = 0;
  clearCreditMemory();

  latestField = localMismatchField(current, target, MODES);
  latestScore = geometricMatch(current, target, MODES);
  previousMatch = latestScore.match;
  statePenalty = stateDiscomfortPenalty(previousMatch, HIT_THRESHOLD);
  reward = clamp(statePenalty, -1, 1);
  targetDirty = true;
  syncStage();
}

function updateTargetLabel() {
  targetLabelEl.textContent =
    `stage ${stage.index + 1}/${stage.total} · +${stage.unlockedActionLabel}`;
  stageLabelEl.textContent = stage.unlockedFeatureLabel
    ? `unlock: ${stage.unlockedActionLabel} + ${stage.unlockedFeatureLabel}`
    : `unlock: ${stage.unlockedActionLabel} · 6 sensory families active`;
}

function buildHeatmap() {
  heatmapEl.innerHTML = "";
  for (let i = 0; i < SENSOR_CELLS; i++) {
    const cell = document.createElement("div");
    cell.className = "sense-cell";
    heatmapEl.appendChild(cell);
  }
}

function buildFeatureButtons() {
  const host = document.getElementById("featureButtons");
  host.innerHTML = "";

  FEATURE_NAMES.forEach((name, index) => {
    const enabled = stage.activeFeatures.includes(index);
    const button = document.createElement("button");
    button.type = "button";
    button.disabled = !enabled;
    button.className =
      index === selectedFeature && enabled
        ? "feature-button active"
        : "feature-button";
    button.textContent = name;
    button.addEventListener("click", () => {
      if (!enabled) return;
      selectedFeature = index;
      buildFeatureButtons();
      updateHeatmap();
    });
    host.appendChild(button);
  });
}

function buildFeatureBars() {
  featureBarsEl.innerHTML = "";
  FEATURE_NAMES.forEach((name, index) => {
    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML = `
      <span>${name}</span>
      <div class="bar-track"><i id="featureBar${index}"></i></div>
      <b id="featureVal${index}">0.00</b>
    `;
    featureBarsEl.appendChild(row);
  });
}

const actionRows = [
  ["Fourier 1–6", 0, 6],
  ["Fourier 7–16", 6, 16],
  ["Fourier 17–32", 16, 32],
  ["translate X", 32, 33],
  ["translate Z", 33, 34],
  ["tilt X", 34, 35],
  ["tilt Z", 35, 36],
  ["bowl", 36, 37],
];

function buildActionBars() {
  actionBarsEl.innerHTML = "";
  actionRows.forEach(([name], index) => {
    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML = `
      <span>${name}</span>
      <div class="bar-track bipolar"><i id="actionBar${index}"></i></div>
      <b id="actionVal${index}">0.00</b>
    `;
    actionBarsEl.appendChild(row);
  });
}

function meanRange(values, start, end) {
  let sum = 0;
  let count = 0;
  for (let i = start; i < end; i++) {
    sum += values[i] || 0;
    count++;
  }
  return count ? sum / count : 0;
}

function updateHeatmap() {
  const cells = heatmapEl.children;
  const featureEnabled = stage.activeFeatures.includes(selectedFeature);

  for (let cell = 0; cell < SENSOR_CELLS; cell++) {
    const value = featureEnabled
      ? latestField.features[cell * FEATURE_COUNT + selectedFeature] || 0
      : 0;
    const magnitude = Math.min(1, Math.abs(value));
    const hue = value >= 0 ? 190 : 335;
    cells[cell].style.background =
      `hsla(${hue}, 82%, ${42 + magnitude * 18}%, ${0.08 + magnitude * 0.88})`;
    cells[cell].style.opacity = featureEnabled ? "1" : ".18";
    cells[cell].title =
      `${FEATURE_NAMES[selectedFeature]} · ${value.toFixed(3)}`;
  }
}

function updateFeatureBars() {
  for (let i = 0; i < FEATURE_COUNT; i++) {
    const enabled = stage.activeFeatures.includes(i);
    const value = enabled ? latestField.featureRms[i] || 0 : 0;
    const bar = document.getElementById(`featureBar${i}`);
    bar.style.width = `${Math.min(100, value * 100)}%`;
    bar.style.opacity = enabled ? "1" : ".12";
    document.getElementById(`featureVal${i}`).textContent = enabled
      ? value.toFixed(2)
      : "locked";
  }
}

function updateActionBars() {
  actionRows.forEach(([, start, end], index) => {
    const value = meanRange(heldActions, start, end);
    const bar = document.getElementById(`actionBar${index}`);
    const magnitude = Math.min(1, Math.abs(value));
    bar.style.width = `${magnitude * 50}%`;
    bar.style.left = value >= 0 ? "50%" : `${50 - magnitude * 50}%`;
    document.getElementById(`actionVal${index}`).textContent =
      value.toFixed(2);
  });
}

function resizeCanvas(canvas, context) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(240, Math.floor(rect.width * dpr));
  const height = Math.max(120, Math.floor(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  context.setTransform(1, 0, 0, 1, 0, 0);
  return { width, height, dpr };
}

function visualMode() {
  if (stage.index < 6) return "spectrum";
  if (stage.index < 11) return "profile";
  if (stage.index < 24) return "map";
  return "surface";
}

function drawSpectrum(context, width, height) {
  context.fillStyle = "#050b10";
  context.fillRect(0, 0, width, height);

  const activeFourier = stage.activeActions.filter(
    (index) => index < MODES.length,
  );
  const count = Math.max(1, activeFourier.length);
  const pad = width * 0.08;
  const usable = width - pad * 2;
  const baseline = height * 0.5;

  context.strokeStyle = "rgba(255,255,255,.14)";
  context.beginPath();
  context.moveTo(pad, baseline);
  context.lineTo(width - pad, baseline);
  context.stroke();

  const drawStem = (x, value, strokeStyle, offset) => {
    context.strokeStyle = strokeStyle;
    context.lineWidth = Math.max(2, width / 340);
    context.beginPath();
    context.moveTo(x + offset, baseline);
    context.lineTo(x + offset, baseline - value * height * 0.34);
    context.stroke();
  };

  activeFourier.forEach((actionIndex, orderIndex) => {
    const x =
      count === 1
        ? width * 0.5
        : pad + (orderIndex / (count - 1)) * usable;
    const limit = Math.max(1e-6, spectralLimit(MODES[actionIndex]));
    drawStem(x, target.coeff[actionIndex] / limit, "#d67cff", -2);
    drawStem(x, current.coeff[actionIndex] / limit, "#73d8ff", 2);

    context.fillStyle = "#8fa0ae";
    context.font = `${Math.max(10, width / 55)}px ui-monospace, monospace`;
    context.textAlign = "center";
    context.fillText(String(actionIndex + 1), x, height - 12);
  });

  context.textAlign = "left";
  context.fillStyle = "#8fa0ae";
  context.font = `${Math.max(10, width / 60)}px ui-monospace, monospace`;
  context.fillText("violet target · cyan current", pad, 20);
}

function drawProfile(context, width, height) {
  context.fillStyle = "#050b10";
  context.fillRect(0, 0, width, height);
  const pad = 24;
  const samples = 128;

  const values = [];
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < samples; i++) {
    const x = -4.5 + (i / (samples - 1)) * 9;
    const currentY = surfaceHeight(current, MODES, x, 0);
    const targetY = surfaceHeight(target, MODES, x, 0);
    values.push([currentY, targetY]);
    min = Math.min(min, currentY, targetY);
    max = Math.max(max, currentY, targetY);
  }
  const span = Math.max(0.3, max - min);
  const yFor = (value) =>
    height - pad - ((value - min) / span) * (height - pad * 2);

  const trace = (column, strokeStyle) => {
    context.strokeStyle = strokeStyle;
    context.lineWidth = 2;
    context.beginPath();
    values.forEach((pair, index) => {
      const x = pad + (index / (samples - 1)) * (width - pad * 2);
      const y = yFor(pair[column]);
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.stroke();
  };

  trace(1, "#d67cff");
  trace(0, "#73d8ff");
  context.fillStyle = "#8fa0ae";
  context.font = "11px ui-monospace, monospace";
  context.fillText("cross-section z = 0", pad, 18);
}

function heightColor(value, min, max, alpha = 1) {
  const t = clamp((value - min) / Math.max(1e-6, max - min), 0, 1);
  const hue = 215 - t * 170;
  return `hsla(${hue}, 78%, 48%, ${alpha})`;
}

function drawMap(context, width, height) {
  context.fillStyle = "#050b10";
  context.fillRect(0, 0, width, height);
  const cols = 28;
  const rows = 22;
  const half = width / 2;
  const gap = 6;
  const tileW = (half - gap - 16) / cols;
  const tileH = (height - 34) / rows;

  const currentValues = [];
  const targetValues = [];
  let min = Infinity;
  let max = -Infinity;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = -4.5 + (col / (cols - 1)) * 9;
      const z = -3.7 + (row / (rows - 1)) * 7.4;
      const a = surfaceHeight(current, MODES, x, z);
      const b = surfaceHeight(target, MODES, x, z);
      currentValues.push(a);
      targetValues.push(b);
      min = Math.min(min, a, b);
      max = Math.max(max, a, b);
    }
  }

  const drawHalf = (values, startX, label) => {
    let index = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        context.fillStyle = heightColor(values[index++], min, max);
        context.fillRect(
          startX + col * tileW,
          24 + row * tileH,
          tileW + 0.5,
          tileH + 0.5,
        );
      }
    }
    context.fillStyle = "#8fa0ae";
    context.font = "10px ui-monospace, monospace";
    context.fillText(label, startX, 16);
  };

  drawHalf(currentValues, 8, "current");
  drawHalf(targetValues, half + gap, "target");
}

function drawCurriculumView() {
  const mode = visualMode();
  vizLabelEl.textContent =
    mode === "spectrum"
      ? `spectrum · ${stage.activeActions.filter((i) => i < MODES.length).length} spectral lines`
      : mode === "profile"
        ? "1D cross-section"
        : mode === "map"
          ? "2D height maps"
          : "3D surface";

  const showSurface = mode === "surface";
  curriculumCanvas.hidden = showSurface;
  surfaceStage.hidden = !showSurface;

  if (showSurface) return;

  const { width, height } = resizeCanvas(curriculumCanvas, curriculumCtx);
  if (mode === "spectrum") drawSpectrum(curriculumCtx, width, height);
  else if (mode === "profile") drawProfile(curriculumCtx, width, height);
  else drawMap(curriculumCtx, width, height);
}

function drawHistory() {
  const { width, height, dpr } = resizeCanvas(historyCanvas, historyCtx);
  historyCtx.fillStyle = "#071018";
  historyCtx.fillRect(0, 0, width, height);
  historyCtx.strokeStyle = "rgba(255,255,255,.12)";
  historyCtx.beginPath();
  historyCtx.moveTo(0, height * (1 - STAGE_MATCH_THRESHOLD));
  historyCtx.lineTo(width, height * (1 - STAGE_MATCH_THRESHOLD));
  historyCtx.stroke();

  if (scoreHistory.length < 2) return;
  historyCtx.strokeStyle = "#73d8ff";
  historyCtx.lineWidth = Math.max(1, dpr);
  historyCtx.beginPath();
  scoreHistory.forEach((value, index) => {
    const x = (index / Math.max(1, scoreHistory.length - 1)) * width;
    const y = height - value * height;
    if (index === 0) historyCtx.moveTo(x, y);
    else historyCtx.lineTo(x, y);
  });
  historyCtx.stroke();
}

function updateUi() {
  matchEl.textContent = latestScore.match.toFixed(3);
  rewardEl.textContent = reward.toFixed(3);
  rewardBreakdownEl.textContent =
    `Δ ${progressComponent >= 0 ? "+" : ""}${progressComponent.toFixed(3)} · state ${statePenalty.toFixed(3)} · credit ${learningCredit >= 0 ? "+" : ""}${learningCredit.toFixed(3)}`;
  hitEl.textContent =
    `${stageStreak}/${STAGE_HOLD_TICKS} · ${stagesMastered} mastered`;
  latencyEl.textContent = neuralLatency ? `${neuralLatency.toFixed(1)} ms` : "—";
  updateEl.textContent = updateNorm.toExponential(2);
  gainEl.textContent = Array.from(featureGain)
    .map((value, index) =>
      stage.activeFeatures.includes(index) ? value.toFixed(2) : "·",
    )
    .join(" · ");
  updateHeatmap();
  updateFeatureBars();
  updateActionBars();
  drawCurriculumView();
  drawHistory();
}

function updateInputAdapter(rewardValue) {
  if (!previousInputNoise || !rewardValue) return;
  const denom = INPUT_SIGMA * INPUT_SIGMA;
  for (const feature of stage.activeFeatures) {
    featureGain[feature] = clamp(
      featureGain[feature] +
        (INPUT_LR * rewardValue * previousInputNoise[feature]) / denom,
      0.25,
      3.5,
    );
  }
}

async function loadMaleCns() {
  statusTextEl.textContent = "loading MaleCNS…";

  try {
    const circuitResponse = await fetch("../flydoom/malecns_circuit.json");
    if (!circuitResponse.ok) {
      throw new Error(`circuit HTTP ${circuitResponse.status}`);
    }
    const circuit = await circuitResponse.json();

    circuit.ray_vpl = [];
    circuit.ray_vpr = [];
    const buckets = 16;
    const vplLen = Math.floor(circuit.vpl.length / buckets);
    const vprLen = Math.floor(circuit.vpr.length / buckets);
    for (let index = 0; index < buckets; index++) {
      circuit.ray_vpl.push(
        circuit.vpl.slice(index * vplLen, (index + 1) * vplLen),
      );
      circuit.ray_vpr.push(
        circuit.vpr.slice(index * vprLen, (index + 1) * vprLen),
      );
    }

    const binaryResponse = await fetch("../flydoom/malecns_l3_compact.mcns");
    if (!binaryResponse.ok) {
      throw new Error(`MaleCNS HTTP ${binaryResponse.status}`);
    }

    const arrayBuffer = await binaryResponse.arrayBuffer();
    const view = new DataView(arrayBuffer);
    const root = view.getUint32(0, true);
    const vtable = root - view.getInt32(root, true);
    const vtableLen = view.getUint16(vtable, true);

    function getVector(fieldIndex, ArrayType) {
      const offset = 4 + fieldIndex * 2;
      if (offset >= vtableLen) return null;
      const fieldOffset = view.getUint16(vtable + offset, true);
      if (!fieldOffset) return null;
      const position = root + fieldOffset;
      const vectorStart = position + view.getUint32(position, true);
      const length = view.getUint32(vectorStart, true);
      return new ArrayType(arrayBuffer, vectorStart + 4, length);
    }

    const offsets = getVector(5, Uint32Array);
    const scales = getVector(6, Float32Array);
    const deltas = getVector(7, Uint16Array);
    const weights = getVector(8, Uint8Array);
    const lut = getVector(9, Float32Array);
    if (!offsets || !scales || !deltas || !weights || !lut) {
      throw new Error("invalid MaleCNS vectors");
    }

    worker = new Worker(new URL("./worker.js", import.meta.url));
    worker.onmessage = (event) => {
      const msg = event.data;
      if (msg.type === "ready") {
        workerReady = true;
        statusEl.classList.add("live");
        statusTextEl.textContent =
          `${msg.neurons.toLocaleString()} neurons · ${msg.descending.toLocaleString()} DNs · frozen`;
        return;
      }

      if (msg.type === "result") {
        workerBusy = false;
        neuralLatency = msg.latency;

        const dnValues = new Float32Array(msg.dnValues);
        const hidden = projectDn(dnValues, 32);
        const actionNoise = noiseForIndices(
          ACTION_COUNT,
          stage.activeActions,
          OUTPUT_SIGMA,
        );
        const rawActions = readoutActions(readout, hidden, actionNoise);
        heldActions = maskActions(rawActions, stage.activeActions);

        previousHidden = hidden;
        previousActionNoise = actionNoise;
        previousInputNoise = pendingInputNoise;
        pendingInputNoise = null;
      }
    };
    worker.onerror = (event) => {
      workerBusy = false;
      workerReady = false;
      statusEl.classList.remove("live");
      statusEl.classList.add("error");
      statusTextEl.textContent = `MaleCNS worker error: ${event.message}`;
    };

    worker.postMessage({
      type: "init",
      circuit,
      nNeurons: offsets.length - 1,
      offsets: offsets.buffer.slice(
        offsets.byteOffset,
        offsets.byteOffset + offsets.byteLength,
      ),
      scales: scales.buffer.slice(
        scales.byteOffset,
        scales.byteOffset + scales.byteLength,
      ),
      deltas: deltas.buffer.slice(
        deltas.byteOffset,
        deltas.byteOffset + deltas.byteLength,
      ),
      weights: weights.buffer.slice(
        weights.byteOffset,
        weights.byteOffset + weights.byteLength,
      ),
      lut: lut.buffer.slice(lut.byteOffset, lut.byteOffset + lut.byteLength),
    });
  } catch (error) {
    console.error(error);
    workerReady = false;
    statusEl.classList.add("error");
    statusTextEl.textContent = "MaleCNS unavailable — control loop paused";
  }
}

function sensoryTick() {
  latestScore = geometricMatch(current, target, MODES);
  const completedMatch = latestScore.match;

  const rewardParts = stateAwareReward(
    completedMatch,
    previousMatch,
    HIT_THRESHOLD,
  );
  progressComponent = rewardParts.progress;
  statePenalty = rewardParts.statePenalty;
  reward = rewardParts.total;
  learningCredit = rewardParts.credit;
  previousMatch = completedMatch;

  if (completedMatch >= STAGE_MATCH_THRESHOLD) stageStreak++;
  else stageStreak = 0;

  const completedStage = stageStreak >= STAGE_HOLD_TICKS;
  if (completedStage) {
    reward = clamp(reward + 1, -1, 1);
    learningCredit = clamp(learningCredit + 1, -1, 1);
  }

  // Credit only the currently unlocked degrees of freedom.
  if (previousHidden && previousActionNoise) {
    updateNorm = updateReadout(
      readout,
      previousHidden,
      previousActionNoise,
      learningCredit,
      0.0011,
      OUTPUT_SIGMA,
    );
    previousHidden = null;
    previousActionNoise = null;
  }
  updateInputAdapter(learningCredit);
  previousInputNoise = null;

  scoreHistory.push(completedMatch);
  if (scoreHistory.length > 180) scoreHistory.shift();

  if (completedStage) {
    advanceCurriculum();
  } else {
    latestField = localMismatchField(current, target, MODES);
  }

  if (workerReady && !workerBusy && worker) {
    const inputNoise = featureNoiseForStage(stage, INPUT_SIGMA);
    const gains = new Float32Array(FEATURE_COUNT);
    for (let i = 0; i < FEATURE_COUNT; i++) {
      gains[i] = stage.activeFeatures.includes(i)
        ? clamp(featureGain[i] + inputNoise[i], 0.25, 3.5)
        : 0;
    }

    const sensedFeatures = maskFeatures(
      latestField.features,
      stage.activeFeatures,
      FEATURE_COUNT,
    );

    workerBusy = true;
    pendingInputNoise = inputNoise;
    worker.postMessage({
      type: "step",
      features: Array.from(sensedFeatures),
      featureCount: FEATURE_COUNT,
      cellCount: SENSOR_CELLS,
      gains: Array.from(gains),
    });
  }

  updateUi();
}

// ---------------------------------------------------------------------------
// Progressive visualization.
// The human view gets more dimensional only as the curriculum gets harder.
// It is never controller input.
// ---------------------------------------------------------------------------

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x04090e);
scene.fog = new THREE.FogExp2(0x04090e, 0.045);

const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 80);
camera.position.set(8.3, 7.4, 8.8);
camera.lookAt(0, -0.35, 0);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
renderer.setClearColor(0x04090e, 1);
surfaceStage.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xbbe4ff, 0x0b0d12, 1.75));
const key = new THREE.DirectionalLight(0xffffff, 2.25);
key.position.set(5, 9, 3);
scene.add(key);
const rim = new THREE.DirectionalLight(0xc38aff, 1.1);
rim.position.set(-5, 3, -5);
scene.add(rim);

const world = new THREE.Group();
scene.add(world);
const grid = new THREE.GridHelper(11, 22, 0x25445a, 0x132431);
grid.position.y = -1.55;
world.add(grid);

const currentGeometry = new THREE.PlaneGeometry(10, 8, 40, 32);
currentGeometry.rotateX(-Math.PI / 2);
const currentBase = currentGeometry.attributes.position.array.slice();
const currentMaterial = new THREE.MeshStandardMaterial({
  color: 0x137fad,
  roughness: 0.56,
  metalness: 0.04,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.82,
});
const currentMesh = new THREE.Mesh(currentGeometry, currentMaterial);
world.add(currentMesh);

const targetGeometry = currentGeometry.clone();
const targetBase = targetGeometry.attributes.position.array.slice();
const targetMaterial = new THREE.MeshBasicMaterial({
  color: 0xdb7bff,
  wireframe: true,
  transparent: true,
  opacity: 0.43,
  side: THREE.DoubleSide,
});
const targetMesh = new THREE.Mesh(targetGeometry, targetMaterial);
targetMesh.position.y = 0.035;
world.add(targetMesh);

function updateGeometry(geometry, base, state) {
  const positions = geometry.attributes.position.array;
  for (let i = 0; i < positions.length; i += 3) {
    const x = base[i];
    const z = base[i + 2];
    positions[i + 1] = surfaceHeight(state, MODES, x, z) - 1.05;
  }
  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals();
}

function resizeSurfaceRenderer() {
  const width = Math.max(1, surfaceStage.clientWidth);
  const height = Math.max(1, surfaceStage.clientHeight);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

new ResizeObserver(resizeSurfaceRenderer).observe(surfaceStage);
resizeSurfaceRenderer();
updateGeometry(targetGeometry, targetBase, target);
syncStage();
buildHeatmap();
buildFeatureBars();
buildActionBars();
updateUi();

let lastFrame = performance.now();
let lastSense = 0;

function frame(now) {
  const dt = Math.min(0.035, Math.max(0.001, (now - lastFrame) / 1000));
  lastFrame = now;

  if (!paused && workerReady) {
    applyActions(current, dynamics, heldActions, MODES, dt);

    if (now - lastSense >= SENSE_INTERVAL_MS) {
      lastSense = now;
      sensoryTick();
    }
  }

  const mode = visualMode();
  if (mode === "surface") {
    updateGeometry(currentGeometry, currentBase, current);
    if (targetDirty) {
      updateGeometry(targetGeometry, targetBase, target);
      targetDirty = false;
    }
    world.rotation.y = Math.sin(now / 8500) * 0.08;
    renderer.render(scene, camera);
  }

  drawCurriculumView();
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------

document.getElementById("pauseButton").addEventListener("click", (event) => {
  paused = !paused;
  event.currentTarget.textContent = paused ? "Resume" : "Pause";
});

document.getElementById("resetButton").addEventListener("click", () => {
  restartCurriculum({ newSeed: false, resetLearning: true });
  updateUi();
});

document.getElementById("newTargetButton").addEventListener("click", () => {
  restartCurriculum({ newSeed: true, resetLearning: false });
  updateUi();
});

loadMaleCns();
requestAnimationFrame(frame);

window.addEventListener("error", (event) => {
  console.error("FlyDoom Fourier Next", event.error || event.message);
});
