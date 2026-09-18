import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

import {
  FEATURE_COUNT,
  FEATURE_NAMES,
  GLOBAL_ACTIONS,
  SENSOR_CELLS,
  applyActions,
  buildModes,
  cloneState,
  createDynamics,
  createReadout,
  createState,
  createTarget,
  geometricMatch,
  localMismatchField,
  progressReward,
  projectDn,
  readoutActions,
  relocateTarget,
  seededRandom,
  surfaceHeight,
  updateReadout,
} from "./model.js";

const MODES = buildModes(32);
const ACTION_COUNT = MODES.length + GLOBAL_ACTIONS;
const HIT_THRESHOLD = 0.985;
const HIT_HOLD_TICKS = 8;
const SENSE_INTERVAL_MS = 80;
const OUTPUT_SIGMA = 0.12;
const INPUT_SIGMA = 0.08;
const INPUT_LR = 0.00035;

const clamp = (value, lo = 0, hi = 1) =>
  Math.min(hi, Math.max(lo, value));

function gaussian() {
  let u = 0;
  let v = 0;
  while (!u) u = Math.random();
  while (!v) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(Math.PI * 2 * v);
}

let difficulty = "coarse";
let targetSeed = 20260918;
let current = createState(MODES.length);
let target = createTarget(MODES, targetSeed, difficulty);
let dynamics = createDynamics(MODES.length);
let readout = createReadout(ACTION_COUNT, 16, 20260918);
let featureGain = new Float32Array([1.6, 1.2, 1.2, 1.0, 1.3, 0.9]);
let heldActions = new Float32Array(ACTION_COUNT);
let previousHidden = null;
let previousActionNoise = null;
let previousInputNoise = null;
let pendingInputNoise = null;
let pendingField = null;
let latestField = localMismatchField(current, target, MODES);
let latestScore = geometricMatch(current, target, MODES);
let previousMatch = latestScore.match;
let reward = 0;
let hitStreak = 0;
let hits = 0;
let updateNorm = 0;
let paused = false;
let targetDirty = true;
let neuralLatency = 0;
let workerReady = false;
let workerBusy = false;
let worker = null;
let selectedFeature = 0;
const scoreHistory = [];

const statusEl = document.getElementById("status");
const statusTextEl = document.getElementById("statusText");
const matchEl = document.getElementById("matchValue");
const rewardEl = document.getElementById("rewardValue");
const hitEl = document.getElementById("hitValue");
const latencyEl = document.getElementById("latencyValue");
const updateEl = document.getElementById("updateValue");
const gainEl = document.getElementById("gainValue");
const targetLabelEl = document.getElementById("targetLabel");
const heatmapEl = document.getElementById("heatmap");
const featureBarsEl = document.getElementById("featureBars");
const actionBarsEl = document.getElementById("actionBars");
const historyCanvas = document.getElementById("history");
const historyCtx = historyCanvas.getContext("2d");

function resetCurrent({ resetLearning = false } = {}) {
  current = createState(MODES.length);
  dynamics = createDynamics(MODES.length);
  heldActions.fill(0);
  previousHidden = null;
  previousActionNoise = null;
  previousInputNoise = null;
  pendingInputNoise = null;
  hitStreak = 0;
  reward = 0;

  if (resetLearning) {
    readout = createReadout(ACTION_COUNT, 16, targetSeed);
    featureGain = new Float32Array([1.6, 1.2, 1.2, 1.0, 1.3, 0.9]);
    hits = 0;
    scoreHistory.length = 0;
  }

  latestField = localMismatchField(current, target, MODES);
  latestScore = geometricMatch(current, target, MODES);
  previousMatch = latestScore.match;
  targetDirty = true;
}

function newTarget({ keepShape = false } = {}) {
  if (keepShape) {
    const rng = seededRandom(++targetSeed);
    relocateTarget(target, rng);
  } else {
    target = createTarget(MODES, ++targetSeed, difficulty);
  }
  targetDirty = true;
  latestField = localMismatchField(current, target, MODES);
  latestScore = geometricMatch(current, target, MODES);
  previousMatch = latestScore.match;
  hitStreak = 0;
  reward = 0;
  previousHidden = null;
  previousActionNoise = null;
  previousInputNoise = null;
  pendingInputNoise = null;
  updateTargetLabel();
}

function updateTargetLabel() {
  targetLabelEl.textContent =
    `${difficulty} · target #${targetSeed} · (${target.tx.toFixed(1)}, ${target.tz.toFixed(1)})`;
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
    const button = document.createElement("button");
    button.type = "button";
    button.className = index === selectedFeature ? "feature-button active" : "feature-button";
    button.textContent = name;
    button.addEventListener("click", () => {
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
  ["low Fourier", 0, 8],
  ["mid Fourier", 8, 20],
  ["fine Fourier", 20, 32],
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
  for (let cell = 0; cell < SENSOR_CELLS; cell++) {
    const value =
      latestField.features[cell * FEATURE_COUNT + selectedFeature] || 0;
    const magnitude = Math.min(1, Math.abs(value));
    const hue = value >= 0 ? 190 : 335;
    cells[cell].style.background =
      `hsla(${hue}, 82%, ${42 + magnitude * 18}%, ${0.12 + magnitude * 0.86})`;
    cells[cell].title =
      `${FEATURE_NAMES[selectedFeature]} · ${value.toFixed(3)}`;
  }
}

function updateFeatureBars() {
  for (let i = 0; i < FEATURE_COUNT; i++) {
    const value = latestField.featureRms[i] || 0;
    document.getElementById(`featureBar${i}`).style.width =
      `${Math.min(100, value * 100)}%`;
    document.getElementById(`featureVal${i}`).textContent =
      value.toFixed(2);
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

function drawHistory() {
  const rect = historyCanvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(240, Math.floor(rect.width * dpr));
  const height = Math.max(100, Math.floor(rect.height * dpr));
  if (historyCanvas.width !== width || historyCanvas.height !== height) {
    historyCanvas.width = width;
    historyCanvas.height = height;
  }

  historyCtx.fillStyle = "#071018";
  historyCtx.fillRect(0, 0, width, height);
  historyCtx.strokeStyle = "rgba(255,255,255,.12)";
  historyCtx.beginPath();
  historyCtx.moveTo(0, height * (1 - HIT_THRESHOLD));
  historyCtx.lineTo(width, height * (1 - HIT_THRESHOLD));
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
  hitEl.textContent = `${hitStreak}/${HIT_HOLD_TICKS} · ${hits} hits`;
  latencyEl.textContent = neuralLatency ? `${neuralLatency.toFixed(1)} ms` : "—";
  updateEl.textContent = updateNorm.toExponential(2);
  gainEl.textContent = Array.from(featureGain)
    .map((value) => value.toFixed(2))
    .join(" · ");
  updateHeatmap();
  updateFeatureBars();
  updateActionBars();
  drawHistory();
}

function updateInputAdapter(rewardValue) {
  if (!previousInputNoise || !rewardValue) return;
  const denom = INPUT_SIGMA * INPUT_SIGMA;
  for (let i = 0; i < FEATURE_COUNT; i++) {
    featureGain[i] = clamp(
      featureGain[i] +
        (INPUT_LR * rewardValue * previousInputNoise[i]) / denom,
      0.25,
      3.5,
    );
  }
}

function makeNoise(length, sigma) {
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) out[i] = gaussian() * sigma;
  return out;
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

    worker = new Worker("./worker.js");
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
        const hidden = projectDn(dnValues, 16);
        const actionNoise = makeNoise(ACTION_COUNT, OUTPUT_SIGMA);
        heldActions = readoutActions(readout, hidden, actionNoise);
        previousHidden = hidden;
        previousActionNoise = actionNoise;
        previousInputNoise = pendingInputNoise;
        pendingInputNoise = null;
        pendingField = null;
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
  reward = progressReward(latestScore.match, previousMatch);
  previousMatch = latestScore.match;

  if (previousHidden && previousActionNoise) {
    updateNorm = updateReadout(
      readout,
      previousHidden,
      previousActionNoise,
      reward,
      0.0011,
      OUTPUT_SIGMA,
    );
  }
  updateInputAdapter(reward);

  if (latestScore.match >= HIT_THRESHOLD) hitStreak++;
  else hitStreak = 0;

  if (hitStreak >= HIT_HOLD_TICKS) {
    hits++;
    reward = 1;
    newTarget({ keepShape: true });
  }

  latestField = localMismatchField(current, target, MODES);
  scoreHistory.push(latestScore.match);
  if (scoreHistory.length > 180) scoreHistory.shift();

  if (workerReady && !workerBusy && worker) {
    const inputNoise = makeNoise(FEATURE_COUNT, INPUT_SIGMA);
    const gains = new Float32Array(FEATURE_COUNT);
    for (let i = 0; i < FEATURE_COUNT; i++) {
      gains[i] = clamp(featureGain[i] + inputNoise[i], 0.25, 3.5);
    }

    workerBusy = true;
    pendingInputNoise = inputNoise;
    pendingField = latestField;
    worker.postMessage({
      type: "step",
      features: Array.from(latestField.features),
      featureCount: FEATURE_COUNT,
      cellCount: SENSOR_CELLS,
      gains: Array.from(gains),
    });
  }

  updateUi();
}

// ---------------------------------------------------------------------------
// Rendering — presentation only. It does not feed the controller.
// ---------------------------------------------------------------------------

const stage = document.getElementById("stage");
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
stage.appendChild(renderer.domElement);

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

const agent = new THREE.Group();
const body = new THREE.Mesh(
  new THREE.SphereGeometry(0.18, 12, 8),
  new THREE.MeshStandardMaterial({ color: 0xe7d35f, roughness: 0.72 }),
);
body.scale.set(1, 0.52, 1.45);
agent.add(body);
for (const side of [-1, 1]) {
  const wing = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 10, 6),
    new THREE.MeshBasicMaterial({
      color: 0xbde7ff,
      transparent: true,
      opacity: 0.36,
    }),
  );
  wing.scale.set(1.5, 0.18, 0.7);
  wing.position.set(side * 0.18, 0.08, 0);
  agent.add(wing);
}
world.add(agent);

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

function resize() {
  const width = Math.max(1, stage.clientWidth);
  const height = Math.max(1, stage.clientHeight);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

new ResizeObserver(resize).observe(stage);
resize();
updateGeometry(targetGeometry, targetBase, target);
updateTargetLabel();

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

  updateGeometry(currentGeometry, currentBase, current);
  if (targetDirty) {
    updateGeometry(targetGeometry, targetBase, target);
    targetDirty = false;
  }

  agent.position.y = surfaceHeight(current, MODES, 0, 0) - 0.75;
  agent.rotation.y = now / 1400;
  world.rotation.y = Math.sin(now / 8500) * 0.08;
  renderer.render(scene, camera);
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
  resetCurrent({ resetLearning: true });
  updateUi();
});

document.getElementById("newTargetButton").addEventListener("click", () => {
  newTarget({ keepShape: false });
  resetCurrent({ resetLearning: false });
  updateUi();
});

document.getElementById("difficulty").addEventListener("change", (event) => {
  difficulty = event.target.value;
  newTarget({ keepShape: false });
  resetCurrent({ resetLearning: false });
  updateUi();
});

buildHeatmap();
buildFeatureButtons();
buildFeatureBars();
buildActionBars();
updateUi();
loadMaleCns();
requestAnimationFrame(frame);

window.addEventListener("error", (event) => {
  console.error("FlyDoom Fourier Next", event.error || event.message);
});
