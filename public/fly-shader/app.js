// The Shader Is the Fly's World — closed-loop demo.
// World: 12 drifting Fourier modes with complex coefficients (the knobs).
// Eye: 8×4 analytic samples of the field, 6 features per cell.
// Brain: frozen MaleCNS connectome, stepped in brain-worker.js.
// Motor: 1,314 descending neurons → fixed ±1 projection → 24 knob velocities.
// Lab: a second worker replays paired counterfactual branches from a snapshot
// taken at each kick, so the operator isolates the loop's response to it.

import {
  EYE_CELLS,
  EYE_COLS,
  EYE_ROWS,
  FEATURE_COUNT,
  KNOB_COUNT,
  MAX_AMPLITUDE,
  MODE_COUNT,
  NEURAL_HZ,
  applyKick,
  clamp,
  cloneEye,
  cloneReadout,
  createEye,
  createReadout,
  eyeCellCenter,
  modeEnergy,
  modes,
  prepareCircuit,
  readMotor,
  sampleEye,
  sampleField,
  seededRandom,
  worldStep,
} from "./sim.js";

const PROBE_INTERVAL = 4;
const WATERFALL_SECONDS = 20;

const $ = (id) => document.getElementById(id);

// ---------------------------------------------------------------- live state

const coeff = new Float32Array(KNOB_COUNT); // [re0, im0, re1, im1, …]
const eye = createEye();
const readout = createReadout();
let worldTime = 0;
let paused = false;

function randomizeWorld(rng = Math.random) {
  for (let i = 0; i < KNOB_COUNT; i++) coeff[i] = (rng() * 2 - 1) * 0.25;
}

function readoutParams() {
  return {
    adaptive: $("adaptive").checked,
    gain: Number($("gain").value),
  };
}

// ---------------------------------------------------------------- workers

let live = null;
let liveReady = false;
let liveBusy = false;
let lab = null;
let labReady = false;
let labBusy = false;
let labElapsed = 0;
let tickLatency = 0;
let tickInterval = 0;
let lastTickTime = null;
let nextNeuralTime = 0;
let sentWorldTime = 0;
let snapshotId = 0;
const waitingSnapshots = new Map();

function setStatus(text, kind) {
  $("statusText").textContent = text;
  $("status").classList.toggle("live", kind === "live");
  $("status").classList.toggle("error", kind === "error");
}

async function loadMaleCns() {
  setStatus("loading MaleCNS (5 MB)…");
  try {
    const circuitResponse = await fetch("../flydoom/malecns_circuit.json");
    if (!circuitResponse.ok)
      throw new Error(`circuit HTTP ${circuitResponse.status}`);
    const circuit = prepareCircuit(await circuitResponse.json());

    const binaryResponse = await fetch("../flydoom/malecns_l3_compact.mcns");
    if (!binaryResponse.ok)
      throw new Error(`MaleCNS HTTP ${binaryResponse.status}`);
    const buffer = await binaryResponse.arrayBuffer();
    const view = new DataView(buffer);
    const root = view.getUint32(0, true);
    const vtable = root - view.getInt32(root, true);
    const vtableLen = view.getUint16(vtable, true);

    const getVector = (fieldIndex, ArrayType) => {
      const offset = 4 + fieldIndex * 2;
      if (offset >= vtableLen) return null;
      const fieldOffset = view.getUint16(vtable + offset, true);
      if (!fieldOffset) return null;
      const position = root + fieldOffset;
      const start = position + view.getUint32(position, true);
      const length = view.getUint32(start, true);
      return new ArrayType(buffer, start + 4, length);
    };
    const vectors = {
      offsets: getVector(5, Uint32Array),
      scales: getVector(6, Float32Array),
      deltas: getVector(7, Uint16Array),
      weights: getVector(8, Uint8Array),
      lut: getVector(9, Float32Array),
    };
    if (Object.values(vectors).some((v) => !v)) {
      throw new Error("invalid MaleCNS vectors");
    }
    // Each worker gets its own copy of the frozen weights.
    const initMessage = () => {
      const msg = { type: "init", circuit };
      for (const [key, v] of Object.entries(vectors)) {
        msg[key] = v.buffer.slice(v.byteOffset, v.byteOffset + v.byteLength);
      }
      return msg;
    };
    const spawn = () =>
      new Worker(new URL("./brain-worker.js", import.meta.url), {
        type: "module",
      });

    live = spawn();
    live.onmessage = onLiveMessage;
    live.onerror = (event) => {
      liveBusy = false;
      liveReady = false;
      // Stop driving the knobs with a frozen command; no new probes can start.
      readout.haveMotor = false;
      readout.motor.fill(0);
      waitingSnapshots.clear();
      labBusy = false;
      setStatus(`MaleCNS worker error: ${event.message}`, "error");
    };
    live.postMessage(initMessage());

    lab = spawn();
    lab.onmessage = onLabMessage;
    lab.onerror = (event) => {
      labReady = false;
      labBusy = false;
      console.error("lab worker error", event.message);
    };
    lab.postMessage(initMessage());
  } catch (error) {
    console.error(error);
    setStatus("MaleCNS unavailable — the world only leaks", "error");
  }
}

function onLiveMessage(event) {
  const msg = event.data;
  if (msg.type === "ready") {
    liveReady = true;
    setStatus(
      `${msg.neurons.toLocaleString("en")} neurons · ${msg.descending.toLocaleString("en")} DNs · frozen weights`,
      "live"
    );
    return;
  }
  if (msg.type === "result") {
    liveBusy = false;
    tickLatency = msg.latency;
    // Readout adaptation runs on world time, so pausing or a background tab
    // does not count as elapsed simulation time.
    const tickDt =
      lastTickTime === null
        ? 1 / NEURAL_HZ
        : Math.max(1e-3, sentWorldTime - lastTickTime);
    lastTickTime = sentWorldTime;
    tickInterval = tickInterval ? tickInterval * 0.9 + tickDt * 0.1 : tickDt;
    readMotor(readout, new Float32Array(msg.dnValues), tickDt, readoutParams());
    return;
  }
  if (msg.type === "snapshot") {
    const pending = waitingSnapshots.get(msg.id);
    waitingSnapshots.delete(msg.id);
    if (!pending || !labReady) {
      labBusy = false;
      return;
    }
    pending.snapshot.brainState = msg.state;
    lab.postMessage(
      { type: "probe", snapshot: pending.snapshot, kick: pending.kick },
      [msg.state.buffer]
    );
  }
}

function onLabMessage(event) {
  const msg = event.data;
  if (msg.type === "ready") {
    labReady = true;
    return;
  }
  if (msg.type === "probe") {
    labBusy = false;
    labElapsed = msg.elapsed;
    if (msg.kickEnergy > 1e-4) {
      const row = msg.mode * MODE_COUNT;
      for (let i = 0; i < MODE_COUNT; i++)
        operatorSum[row + i] += msg.response[i];
      operatorCount[msg.mode]++;
    }
  }
}

function neuralTick() {
  if (!liveReady || liveBusy || paused) return;
  if (worldTime < nextNeuralTime) return;
  // Keep phase while on time; when late (first tick after loading, a stalled
  // worker, a slow device) drop the backlog and wait a full interval.
  nextNeuralTime += 1 / NEURAL_HZ;
  if (nextNeuralTime <= worldTime) nextNeuralTime = worldTime + 1 / NEURAL_HZ;
  liveBusy = true;
  sentWorldTime = worldTime;
  live.postMessage({
    type: "step",
    features: Array.from(sampleEye(eye, coeff, worldTime)),
  });
}

// ---------------------------------------------------------------- perturbation & operator

const operatorSum = new Float64Array(MODE_COUNT * MODE_COUNT);
const operatorCount = new Uint32Array(MODE_COUNT);
let lastProbe = 0;
let skippedKicks = 0;
const kickMarks = [];

// Every kick perturbs the live world. When the loop is live and the lab is
// free, the pre-kick state (world, eye, readout, brain) is also snapshotted
// and the lab replays four branches from it: closed loop with and without the
// kick, and leak-only with and without it. The operator row is the
// difference-in-differences, so neither the loop's own drift nor the kick's
// passive decay is credited to the circuit.
function kick(mode = Math.floor(Math.random() * MODE_COUNT)) {
  const phase = Math.random() * Math.PI * 2;
  const recordable =
    $("closed").checked &&
    liveReady &&
    readout.haveMotor &&
    labReady &&
    !labBusy;

  if (recordable) {
    labBusy = true;
    const id = ++snapshotId;
    waitingSnapshots.set(id, {
      kick: { mode, phase },
      snapshot: {
        coeff: new Float32Array(coeff),
        t: worldTime,
        eye: cloneEye(eye),
        readout: cloneReadout(readout),
        params: { leak: Number($("leak").value), ...readoutParams() },
      },
    });
    // The brain state may be one in-flight step ahead of this world snapshot;
    // that is shared by all four branches, so the pairing stays exact.
    live.postMessage({ type: "snapshot", id });
  } else if ($("closed").checked) {
    skippedKicks++;
  }

  applyKick(coeff, mode, phase);
  kickMarks.push({ mode, t: worldTime });
}

// ---------------------------------------------------------------- dynamics

function step(dt) {
  const closed = $("closed").checked;
  worldStep(
    coeff,
    readout.motor,
    closed && readout.haveMotor,
    Number($("leak").value),
    dt
  );
  worldTime += dt;

  if ($("probe").checked && closed && worldTime - lastProbe >= PROBE_INTERVAL) {
    lastProbe = worldTime;
    kick();
  }
}

// ---------------------------------------------------------------- rendering: world

const worldCanvas = $("world");
const gl = worldCanvas.getContext("webgl", { antialias: false });
let renderWorld = null;

const FRAGMENT = `
precision highp float;
uniform vec2 uRes;
uniform float uT;
uniform vec3 uK[${MODE_COUNT}];
uniform vec2 uC[${MODE_COUNT}];
float tanhf(float x) { float e = exp(2.0 * clamp(x, -9.0, 9.0)); return (e - 1.0) / (e + 1.0); }
void main() {
  vec2 p = gl_FragCoord.xy / uRes;
  float x = p.x * 2.0;
  float y = 1.0 - p.y;
  float f = 0.0;
  for (int i = 0; i < ${MODE_COUNT}; i++) {
    float th = uK[i].x * x + uK[i].y * y - uK[i].z * uT;
    f += uC[i].x * cos(th) - uC[i].y * sin(th);
  }
  float v = tanhf(f * 0.9);
  vec3 base = vec3(0.035, 0.07, 0.10);
  vec3 pos = vec3(0.45, 0.85, 1.0);
  vec3 neg = vec3(0.84, 0.49, 1.0);
  vec3 col = v >= 0.0 ? mix(base, pos, v) : mix(base, neg, -v);
  gl_FragColor = vec4(col, 1.0);
}`;

function setupWebGl() {
  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader));
    }
    return shader;
  };
  const program = gl.createProgram();
  gl.attachShader(
    program,
    compile(
      gl.VERTEX_SHADER,
      "attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }"
    )
  );
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program));
  }
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW
  );
  const attribute = gl.getAttribLocation(program, "a");
  gl.enableVertexAttribArray(attribute);
  gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(program, "uRes");
  const uT = gl.getUniformLocation(program, "uT");
  const uK = gl.getUniformLocation(program, "uK");
  const uC = gl.getUniformLocation(program, "uC");
  const k = new Float32Array(MODE_COUNT * 3);
  modes.forEach((m, i) => k.set([m.kx, m.ky, m.omega], i * 3));
  gl.uniform3fv(uK, k);

  return () => {
    gl.viewport(0, 0, worldCanvas.width, worldCanvas.height);
    gl.uniform2f(uRes, worldCanvas.width, worldCanvas.height);
    gl.uniform1f(uT, worldTime);
    gl.uniform2fv(uC, coeff);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
}

function setupCpuFallback() {
  // Low-resolution software render on a separate canvas when WebGL is missing.
  const canvas = document.createElement("canvas");
  canvas.width = 192;
  canvas.height = 96;
  canvas.style.imageRendering = "pixelated";
  worldCanvas.replaceWith(canvas);
  canvas.id = "world";
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(canvas.width, canvas.height);
  return () => {
    let o = 0;
    for (let py = 0; py < canvas.height; py++) {
      for (let px = 0; px < canvas.width; px++) {
        const v = Math.tanh(
          sampleField(
            coeff,
            ((px + 0.5) / canvas.width) * 2,
            (py + 0.5) / canvas.height,
            worldTime
          ).value * 0.9
        );
        const target = v >= 0 ? [115, 216, 255] : [214, 124, 255];
        const w = Math.abs(v);
        image.data[o++] = 9 + (target[0] - 9) * w;
        image.data[o++] = 18 + (target[1] - 18) * w;
        image.data[o++] = 25 + (target[2] - 25) * w;
        image.data[o++] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
  };
}

try {
  renderWorld = gl ? setupWebGl() : setupCpuFallback();
} catch (error) {
  console.error(error);
  renderWorld = setupCpuFallback();
}

// ---------------------------------------------------------------- rendering: eye overlay

const eyeCanvas = $("eye");
const eyeCtx = eyeCanvas.getContext("2d");

function drawEye() {
  eyeCtx.clearRect(0, 0, eyeCanvas.width, eyeCanvas.height);
  if (!$("showEye").checked) return;
  const w = eyeCanvas.width;
  const h = eyeCanvas.height;
  const size = Math.min(w / EYE_COLS, h / EYE_ROWS) * 0.34;

  eyeCtx.strokeStyle = "rgba(255,255,255,0.18)";
  eyeCtx.lineWidth = 1;
  eyeCtx.beginPath();
  eyeCtx.moveTo(w / 2, 0);
  eyeCtx.lineTo(w / 2, h);
  eyeCtx.stroke();

  for (let cell = 0; cell < EYE_CELLS; cell++) {
    const { x, y } = eyeCellCenter(cell);
    const cx = (x / 2) * w;
    const cy = y * h;
    const o = cell * FEATURE_COUNT;
    const luminance = eye.samples[o];
    const gray = Math.round(128 + luminance * 120);
    eyeCtx.fillStyle = `rgb(${gray},${gray},${gray})`;
    eyeCtx.fillRect(cx - size / 2, cy - size / 2, size, size);
    eyeCtx.strokeStyle = "rgba(5,9,13,0.9)";
    eyeCtx.strokeRect(cx - size / 2, cy - size / 2, size, size);

    const gx = eye.samples[o + 1];
    const gy = eye.samples[o + 2];
    eyeCtx.strokeStyle = "#ffc36b";
    eyeCtx.lineWidth = 2;
    eyeCtx.beginPath();
    eyeCtx.moveTo(cx, cy);
    eyeCtx.lineTo(cx + gx * size * 0.9, cy + gy * size * 0.9);
    eyeCtx.stroke();
    eyeCtx.lineWidth = 1;
  }

  eyeCtx.fillStyle = "rgba(231,238,245,0.75)";
  eyeCtx.font = "600 15px ui-monospace, monospace";
  eyeCtx.fillText("left eye → vpl", 10, h - 10);
  const right = "right eye → vpr";
  eyeCtx.fillText(right, w - 10 - eyeCtx.measureText(right).width, h - 10);
}

// ---------------------------------------------------------------- rendering: knobs

const knobCanvases = [];
modes.forEach((m, i) => {
  const button = document.createElement("button");
  button.className = "knob";
  button.title = `Perturb mode ${i} (${m.label}, ω=${m.omega.toFixed(2)})`;
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 96;
  const label = document.createElement("span");
  label.textContent = m.label;
  button.append(canvas, label);
  button.addEventListener("click", () => kick(i));
  $("knobs").append(button);
  knobCanvases.push(canvas.getContext("2d"));
});

function drawKnobs() {
  knobCanvases.forEach((ctx, i) => {
    const s = 96;
    const r = s * 0.4;
    const c = s / 2;
    ctx.clearRect(0, 0, s, s);
    ctx.strokeStyle = "#233341";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.stroke();

    if (readout.haveMotor) {
      ctx.strokeStyle = "rgba(214,124,255,0.75)";
      ctx.beginPath();
      ctx.moveTo(c, c);
      ctx.lineTo(
        c + readout.motor[2 * i] * r * 0.5,
        c - readout.motor[2 * i + 1] * r * 0.5
      );
      ctx.stroke();
    }

    const re = coeff[2 * i] / MAX_AMPLITUDE;
    const im = coeff[2 * i + 1] / MAX_AMPLITUDE;
    ctx.strokeStyle = "#73d8ff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(c, c);
    ctx.lineTo(c + re * r, c - im * r);
    ctx.stroke();
    ctx.fillStyle = "#73d8ff";
    ctx.beginPath();
    ctx.arc(c + re * r, c - im * r, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ---------------------------------------------------------------- rendering: waterfall

const waterfall = $("waterfall");
const waterCtx = waterfall.getContext("2d");
const pixelSeconds = WATERFALL_SECONDS / waterfall.width;
let waterfallClock = 0;
waterCtx.fillStyle = "#03070a";
waterCtx.fillRect(0, 0, waterfall.width, waterfall.height);

function advanceWaterfall(dt) {
  waterfallClock += dt;
  const rowHeight = waterfall.height / MODE_COUNT;
  while (waterfallClock >= pixelSeconds) {
    waterfallClock -= pixelSeconds;
    waterCtx.drawImage(waterfall, -1, 0);
    const x = waterfall.width - 1;
    for (let i = 0; i < MODE_COUNT; i++) {
      const level = Math.sqrt(modeEnergy(coeff, i)) / MAX_AMPLITUDE;
      const v = clamp(level, 0, 1);
      waterCtx.fillStyle = `rgb(${Math.round(10 + 105 * v)},${Math.round(18 + 198 * v)},${Math.round(25 + 230 * v)})`;
      waterCtx.fillRect(x, i * rowHeight, 1, rowHeight - 1);
    }
    while (kickMarks.length) {
      const mark = kickMarks.shift();
      waterCtx.fillStyle = "#ffc36b";
      waterCtx.fillRect(x - 2, mark.mode * rowHeight, 3, rowHeight - 1);
    }
  }
}

// ---------------------------------------------------------------- rendering: operator

const operatorCanvas = $("operator");
const operatorCtx = operatorCanvas.getContext("2d");

function drawOperator() {
  const s = operatorCanvas.width;
  const margin = 28;
  const cell = (s - margin) / MODE_COUNT;
  operatorCtx.fillStyle = "#03070a";
  operatorCtx.fillRect(0, 0, s, s);

  // Paired probes already remove the loop's drift and the kick's passive
  // decay, so each row is shown as measured (mean over its kicks).
  const measured = [];
  for (let r = 0; r < MODE_COUNT; r++) if (operatorCount[r]) measured.push(r);
  const valueAt = (r, c) => operatorSum[r * MODE_COUNT + c] / operatorCount[r];

  let maxAbs = 1e-6;
  for (const r of measured) {
    for (let c = 0; c < MODE_COUNT; c++)
      maxAbs = Math.max(maxAbs, Math.abs(valueAt(r, c)));
  }

  for (let r = 0; r < MODE_COUNT; r++) {
    for (let c = 0; c < MODE_COUNT; c++) {
      let color = "#0a1219";
      if (operatorCount[r]) {
        const v = valueAt(r, c) / maxAbs;
        const w = Math.min(1, Math.abs(v));
        const target = v >= 0 ? [115, 216, 255] : [214, 124, 255];
        color = `rgb(${Math.round(10 + (target[0] - 10) * w)},${Math.round(18 + (target[1] - 18) * w)},${Math.round(25 + (target[2] - 25) * w)})`;
      }
      operatorCtx.fillStyle = color;
      operatorCtx.fillRect(
        margin + c * cell,
        margin + r * cell,
        cell - 1,
        cell - 1
      );
    }
  }

  operatorCtx.fillStyle = "#8fa0ae";
  operatorCtx.font = "10px ui-monospace, monospace";
  operatorCtx.textAlign = "center";
  for (let i = 0; i < MODE_COUNT; i++) {
    operatorCtx.fillText(String(i), margin + (i + 0.5) * cell, 18);
    operatorCtx.fillText(String(i), 12, margin + (i + 0.5) * cell + 3);
  }
  operatorCtx.textAlign = "start";

  const kicks = operatorCount.reduce((a, b) => a + b, 0);
  $("opCount").textContent =
    `${kicks} paired probe${kicks === 1 ? "" : "s"} recorded` +
    (skippedKicks
      ? ` (${skippedKicks} kicks skipped while the lab was busy)`
      : "");
}

// ---------------------------------------------------------------- stats & controls

function drawStats() {
  let energy = 0;
  for (let i = 0; i < MODE_COUNT; i++) energy += modeEnergy(coeff, i);
  const closed = $("closed").checked;
  const labText = !labReady
    ? "loading"
    : labBusy
      ? "replaying paired branches…"
      : `idle (last probe ${(labElapsed / 1000).toFixed(1)} s)`;
  $("stats").innerHTML = [
    `loop: <b>${closed ? "closed" : "open (leak only)"}</b>`,
    `neural ticks: <b>${(tickInterval ? 1 / tickInterval : 0).toFixed(1)}</b> per world-s · <b>${tickLatency.toFixed(0)} ms</b>`,
    `mean |DN|: <b>${readout.dnMeanAbs.toFixed(3)}</b>`,
    `world energy Σ|c|²: <b>${energy.toFixed(3)}</b>`,
    `lab: <b>${labText}</b>`,
    `t = <b>${worldTime.toFixed(1)} s</b>`,
  ].join("<br />");
}

$("gain").addEventListener("input", () => {
  $("gainOut").textContent = Number($("gain").value).toFixed(2);
});
$("leak").addEventListener("input", () => {
  $("leakOut").textContent = Number($("leak").value).toFixed(2);
});
$("kick").addEventListener("click", () => kick());
$("reset").addEventListener("click", () => {
  randomizeWorld();
  nextNeuralTime = worldTime;
});
$("clearOp").addEventListener("click", () => {
  operatorSum.fill(0);
  operatorCount.fill(0);
  skippedKicks = 0;
});
$("pause").addEventListener("click", () => {
  paused = !paused;
  $("pause").textContent = paused ? "Resume" : "Pause";
});

// ---------------------------------------------------------------- main loop

let lastFrame = performance.now();
let lastStats = 0;

function frame(now) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;

  if (!paused) {
    step(dt);
    advanceWaterfall(dt);
    neuralTick();
  }

  renderWorld();
  drawEye();
  drawKnobs();
  if (now - lastStats > 250) {
    lastStats = now;
    drawOperator();
    drawStats();
  }
  requestAnimationFrame(frame);
}

randomizeWorld(seededRandom(7));
sampleEye(eye, coeff, 0);
requestAnimationFrame(frame);
loadMaleCns();
