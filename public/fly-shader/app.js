// The Shader Is the Fly's World — closed-loop demo.
// World: 12 drifting Fourier modes with complex coefficients (the knobs).
// Eye: 8×4 analytic samples of the field, 6 features per cell.
// Brain: frozen MaleCNS connectome, stepped in brain-worker.js.
// Motor, arbitrary readout: 1,314 DNs → fixed ±1 projection → 24 knob
// velocities. Motor, phase readout: right − left DN asymmetry → yaw, applied
// as an exact phase ramp, so the DNs move the fly instead of painting the world.
// Lab: a second worker replays paired counterfactual branches from a snapshot
// taken at each kick, so the operator isolates the loop's response to it; in
// the phase readout it runs the optomotor sweep the same way.
// Flight: the whole compound eye (1,771 columns → lamina L1/L2/L3) sees the
// world, and a policy trained by reward alone acts on it in 29 ways; the
// reward is the giant fiber (DNp01), the descending neuron of takeoff.

import {
  ACTION_COUNT,
  ACTION_LABELS,
  EYE_CELLS,
  EYE_COLS,
  EYE_ROWS,
  FEATURE_COUNT,
  KNOB_COUNT,
  MAX_AMPLITUDE,
  MODE_COUNT,
  NEURAL_HZ,
  OPTO_VELOCITIES,
  TAKEOFF_Z,
  YAW_MAX,
  applyActions,
  applyKick,
  attachEye,
  clamp,
  cloneEye,
  cloneReadout,
  cloneSteer,
  createColumnEye,
  createEye,
  createPolicy,
  createReadout,
  createSteer,
  createView,
  eyeCellCenter,
  modeEnergy,
  modes,
  optomotorSummary,
  policyStep,
  prepareCircuit,
  readMotor,
  readSteer,
  sampleColumns,
  sampleEye,
  viewValue,
  seededRandom,
  shiftWorld,
  steerSignal,
  worldStep,
} from "./sim.js";

const PROBE_INTERVAL = 4;
const WATERFALL_SECONDS = 20;
const NO_ACTIONS = new Float32Array(ACTION_COUNT);

const $ = (id) => document.getElementById(id);

// ---------------------------------------------------------------- live state

const coeff = new Float32Array(KNOB_COUNT); // [re0, im0, re1, im1, …]
const eye = createEye();
const readout = createReadout();
const steer = createSteer();
let circuit = null;
let worldTime = 0;
// zoom and contrast only move in flight; tau is the modes' own drift clock.
const worldView = createView();
let flyYaw = 0;
let paused = false;
let columnEye = null;
let policy = null;

const phaseMode = () => $("readoutMode").value === "phase";
const flightMode = () => $("readoutMode").value === "flight";

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
    const [eyeResponse, typesResponse] = await Promise.all([
      fetch("./eye_columns.json"),
      fetch("./dn_types.json"),
    ]);
    if (!eyeResponse.ok || !typesResponse.ok)
      throw new Error("compound-eye tables unavailable");
    circuit = attachEye(
      prepareCircuit(await circuitResponse.json()),
      await eyeResponse.json(),
      await typesResponse.json()
    );
    columnEye = createColumnEye(circuit.eye.count);
    resetPolicy();

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
    // Both readouts track the DNs all the time, so switching between them
    // does not start from a cold baseline.
    const dnValues = new Float32Array(msg.dnValues);
    if (msg.flight && policy) {
      let absSum = 0;
      for (const v of dnValues) absSum += Math.abs(v);
      readout.dnMeanAbs = absSum / dnValues.length;
      const tookOff = policyStep(policy, dnValues, tickDt, {
        learn: $("learn").checked,
        eta: 10 ** Number($("eta").value),
        sigma: Number($("sigma").value),
      });
      recordFlight(tookOff);
      return;
    }
    readMotor(readout, dnValues, tickDt, readoutParams());
    readSteer(
      steer,
      steerSignal(dnValues, circuit.dn_side),
      tickDt,
      Number($("gain").value)
    );
    return;
  }
  if (msg.type === "snapshot") {
    const pending = waitingSnapshots.get(msg.id);
    waitingSnapshots.delete(msg.id);
    if (!pending || !labReady) {
      labBusy = false;
      sweepRunning = false;
      return;
    }
    pending.snapshot.brainState = msg.state;
    if (pending.kind === "sweep") {
      lab.postMessage(
        {
          type: "sweep",
          snapshot: pending.snapshot,
          velocities: OPTO_VELOCITIES,
        },
        [msg.state.buffer]
      );
      return;
    }
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
    return;
  }
  if (msg.type === "sweepProgress") {
    sweepProgress = msg.fraction;
    return;
  }
  if (msg.type === "sweep") {
    labBusy = false;
    sweepRunning = false;
    labElapsed = msg.elapsed;
    sweeps.push(msg.sweep);
    drawSweep();
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
  if (flightMode() && columnEye) {
    sampleColumns(columnEye, circuit.eye, coeff, worldView, worldTime);
    live.postMessage({
      type: "step",
      flight: true,
      features: {
        lum: new Float32Array(columnEye.lum),
        dlum: new Float32Array(columnEye.dlum),
      },
    });
    return;
  }
  live.postMessage({
    type: "step",
    features: Array.from(sampleEye(eye, coeff, worldTime, worldView.tau)),
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
    !phaseMode() &&
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
  } else if ($("closed").checked && !phaseMode()) {
    skippedKicks++;
  }

  applyKick(coeff, mode, phase);
  kickMarks.push({ mode, t: worldTime });
}

// ---------------------------------------------------------------- optomotor sweep

const sweeps = [];
let sweepRunning = false;
let sweepProgress = 0;

// Snapshots the live state (world, eye, steering baseline, brain) and hands it
// to the lab, which replays every stimulus speed open- and closed-loop from it.
function runSweep() {
  if (!liveReady || !labReady || labBusy) return;
  labBusy = true;
  sweepRunning = true;
  sweepProgress = 0;
  const id = ++snapshotId;
  waitingSnapshots.set(id, {
    kind: "sweep",
    snapshot: {
      coeff: new Float32Array(coeff),
      t: worldTime,
      tau: worldView.tau,
      eye: cloneEye(eye),
      steer: cloneSteer(steer),
      params: { steerGain: Number($("gain").value) },
    },
  });
  live.postMessage({ type: "snapshot", id });
}

// ---------------------------------------------------------------- dynamics

function step(dt) {
  const closed = $("closed").checked;
  if (flightMode()) {
    // The policy's 29 actions move the world; with the loop open it only
    // drifts and relaxes (zero actions), and the policy still learns nothing
    // from it because no action reached the world.
    flyYaw = 0;
    applyActions(
      coeff,
      worldView,
      closed && policy ? policy.actions : NO_ACTIONS,
      dt
    );
  } else if (phaseMode()) {
    // Fixed texture; the stimulus turns the world, the fly's yaw turns it back.
    flyYaw = closed && steer.haveCommand ? YAW_MAX * steer.command : 0;
    shiftWorld(coeff, (Number($("stim").value) - flyYaw) * dt);
  } else {
    flyYaw = 0;
    worldStep(
      coeff,
      readout.motor,
      closed && readout.haveMotor,
      Number($("leak").value),
      dt
    );
  }
  worldTime += dt;
  // In flight the drift clock is one of the fly's actions (applyActions).
  if (!flightMode() && $("drift").checked) worldView.tau += dt;
  recordYaw(dt);

  if (
    !phaseMode() &&
    !flightMode() &&
    $("probe").checked &&
    closed &&
    worldTime - lastProbe >= PROBE_INTERVAL
  ) {
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
uniform float uZoom;
uniform float uGain;
uniform vec3 uK[${MODE_COUNT}];
uniform vec2 uC[${MODE_COUNT}];
float tanhf(float x) { float e = exp(2.0 * clamp(x, -9.0, 9.0)); return (e - 1.0) / (e + 1.0); }
void main() {
  vec2 p = gl_FragCoord.xy / uRes;
  // Same view transform as viewValue in sim.js: scale about the point ahead.
  float s = exp(-uZoom);
  float x = 1.0 + (p.x * 2.0 - 1.0) * s;
  float y = 0.5 + ((1.0 - p.y) - 0.5) * s;
  float f = 0.0;
  for (int i = 0; i < ${MODE_COUNT}; i++) {
    float th = uK[i].x * x + uK[i].y * y - uK[i].z * uT;
    f += uC[i].x * cos(th) - uC[i].y * sin(th);
  }
  float v = tanhf(f * uGain * 0.9);
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
  const uZoom = gl.getUniformLocation(program, "uZoom");
  const uGain = gl.getUniformLocation(program, "uGain");
  const uK = gl.getUniformLocation(program, "uK");
  const uC = gl.getUniformLocation(program, "uC");
  const k = new Float32Array(MODE_COUNT * 3);
  modes.forEach((m, i) => k.set([m.kx, m.ky, m.omega], i * 3));
  gl.uniform3fv(uK, k);

  return () => {
    gl.viewport(0, 0, worldCanvas.width, worldCanvas.height);
    gl.uniform2f(uRes, worldCanvas.width, worldCanvas.height);
    gl.uniform1f(uT, worldView.tau);
    gl.uniform1f(uZoom, worldView.zoom);
    gl.uniform1f(uGain, worldView.gain);
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
          0.9 *
            viewValue(
              coeff,
              worldView,
              ((px + 0.5) / canvas.width) * 2,
              (py + 0.5) / canvas.height
            )
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

// The compound eye: one dot per retinotopic column at its viewing direction
// on the panorama, shaded by the luminance it last reported to its lamina.
function drawColumns() {
  const w = eyeCanvas.width;
  const h = eyeCanvas.height;
  const { count, x, y } = circuit.eye;
  for (let c = 0; c < count; c++) {
    const gray = Math.round(128 + columnEye.lum[c] * 120);
    eyeCtx.fillStyle = `rgb(${gray},${gray},${gray})`;
    eyeCtx.fillRect((x[c] / 2) * w - 2, y[c] * h - 2, 4, 4);
  }
  eyeCtx.fillStyle = "rgba(231,238,245,0.75)";
  eyeCtx.font = "600 15px ui-monospace, monospace";
  eyeCtx.fillText(`${count.toLocaleString("en")} columns → lamina`, 10, h - 10);
  const ahead = "ahead";
  eyeCtx.fillText(ahead, w / 2 - eyeCtx.measureText(ahead).width / 2, 18);
}

function drawEye() {
  eyeCtx.clearRect(0, 0, eyeCanvas.width, eyeCanvas.height);
  if (!$("showEye").checked) return;
  if (flightMode() && columnEye) {
    drawColumns();
    return;
  }
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

    if (readout.haveMotor && !phaseMode()) {
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

// ---------------------------------------------------------------- rendering: optomotor

const TRACE_HZ = 30;
const traceLength = WATERFALL_SECONDS * TRACE_HZ;
const traceStim = new Float32Array(traceLength);
const traceYaw = new Float32Array(traceLength);
let traceHead = 0;
let traceClock = 0;

function recordYaw(dt) {
  traceClock += dt;
  while (traceClock >= 1 / TRACE_HZ) {
    traceClock -= 1 / TRACE_HZ;
    traceStim[traceHead] = phaseMode() ? Number($("stim").value) : 0;
    traceYaw[traceHead] = flyYaw;
    traceHead = (traceHead + 1) % traceLength;
  }
}

const yawCanvas = $("yawTrace");
const yawCtx = yawCanvas.getContext("2d");

function drawYawTrace() {
  const w = yawCanvas.width;
  const h = yawCanvas.height;
  const yOf = (v) => h / 2 - (v / (YAW_MAX * 1.15)) * (h / 2);
  yawCtx.fillStyle = "#03070a";
  yawCtx.fillRect(0, 0, w, h);
  yawCtx.strokeStyle = "#233341";
  yawCtx.beginPath();
  yawCtx.moveTo(0, h / 2);
  yawCtx.lineTo(w, h / 2);
  yawCtx.stroke();

  const series = [
    ["#ffc36b", (i) => traceStim[i]],
    ["#73d8ff", (i) => traceYaw[i]],
    ["#d67cff", (i) => traceStim[i] - traceYaw[i]],
  ];
  for (const [color, valueAt] of series) {
    yawCtx.strokeStyle = color;
    yawCtx.lineWidth = 1.5;
    yawCtx.beginPath();
    for (let k = 0; k < traceLength; k++) {
      const i = (traceHead + k) % traceLength;
      const x = (k / (traceLength - 1)) * w;
      if (k === 0) yawCtx.moveTo(x, yOf(valueAt(i)));
      else yawCtx.lineTo(x, yOf(valueAt(i)));
    }
    yawCtx.stroke();
  }
  yawCtx.lineWidth = 1;
}

const sweepCanvas = $("sweepPlot");
const sweepCtx = sweepCanvas.getContext("2d");

// Two panels sharing the stimulus axis: open-loop Δ(R−L) and closed-loop yaw.
// Earlier sweeps stay faint behind the latest one, so sign consistency across
// snapshots is visible at a glance.
function drawSweep() {
  const w = sweepCanvas.width;
  const h = sweepCanvas.height;
  sweepCtx.fillStyle = "#03070a";
  sweepCtx.fillRect(0, 0, w, h);
  const vMax = Math.max(...OPTO_VELOCITIES.map(Math.abs));
  const pad = 22;
  const panelW = w / 2;

  let respMax = 1e-9;
  for (const s of sweeps)
    for (const r of s.response) respMax = Math.max(respMax, Math.abs(r));

  const panels = [
    { x0: 0, title: "open loop: Δ(R−L)", key: "response", scale: respMax },
    { x0: panelW, title: "closed loop: yaw", key: "yaw", scale: vMax },
  ];
  sweepCtx.font = "10px ui-monospace, monospace";
  for (const p of panels) {
    const left = p.x0 + pad;
    const right = p.x0 + panelW - 8;
    const top = 16;
    const bottom = h - 18;
    const xOf = (v) => left + ((v + vMax) / (2 * vMax)) * (right - left);
    const yOf = (v) =>
      (top + bottom) / 2 - (v / (p.scale * 1.1)) * ((bottom - top) / 2);

    sweepCtx.strokeStyle = "#233341";
    sweepCtx.beginPath();
    sweepCtx.moveTo(left, yOf(0));
    sweepCtx.lineTo(right, yOf(0));
    sweepCtx.moveTo(xOf(0), top);
    sweepCtx.lineTo(xOf(0), bottom);
    sweepCtx.stroke();
    if (p.key === "yaw") {
      sweepCtx.setLineDash([4, 4]);
      sweepCtx.beginPath();
      sweepCtx.moveTo(xOf(-vMax), yOf(-vMax));
      sweepCtx.lineTo(xOf(vMax), yOf(vMax));
      sweepCtx.stroke();
      sweepCtx.setLineDash([]);
    }

    sweeps.forEach((s, n) => {
      const latest = n === sweeps.length - 1;
      sweepCtx.strokeStyle = latest ? "#73d8ff" : "rgba(115,216,255,0.22)";
      sweepCtx.fillStyle = sweepCtx.strokeStyle;
      sweepCtx.lineWidth = latest ? 2 : 1;
      sweepCtx.beginPath();
      s.velocities.forEach((v, i) => {
        const x = xOf(v);
        const y = yOf(s[p.key][i]);
        if (i === 0) sweepCtx.moveTo(x, y);
        else sweepCtx.lineTo(x, y);
      });
      sweepCtx.stroke();
      if (latest) {
        s.velocities.forEach((v, i) => {
          sweepCtx.beginPath();
          sweepCtx.arc(xOf(v), yOf(s[p.key][i]), 3, 0, Math.PI * 2);
          sweepCtx.fill();
        });
      }
    });
    sweepCtx.lineWidth = 1;

    sweepCtx.fillStyle = "#8fa0ae";
    sweepCtx.fillText(p.title, left, 11);
    sweepCtx.fillText(`−${vMax}`, left, h - 5);
    sweepCtx.fillText(`+${vMax}`, right - 22, h - 5);
  }
  drawVerdict();
}

function drawVerdict() {
  if (!sweeps.length) return;
  const latest = sweeps[sweeps.length - 1];
  const open = optomotorSummary(latest.velocities, latest.response);
  const closed = optomotorSummary(latest.velocities, latest.yaw);
  const positive = sweeps.filter(
    (s) => optomotorSummary(s.velocities, s.response).slope > 0
  ).length;
  // Threshold stated, not hidden: the odd part must carry most of the energy
  // before the response is called directional at all.
  const reading =
    open.directional < 0.5
      ? "mostly even: reacts to motion, not to its direction"
      : open.slope > 0
        ? "directional, follows the stimulus (optomotor under the convention)"
        : "directional, against the stimulus (convention or circuit backwards)";
  $("verdict").innerHTML = [
    `open-loop slope: <b>${open.slope.toExponential(2)}</b> per world-width/s`,
    `directional share: <b>${(100 * open.directional).toFixed(0)}%</b> (odd / total energy)`,
    `reading: <b>${reading}</b>`,
    `closed-loop yaw/stimulus: <b>${closed.slope.toFixed(3)}</b> (1 = perfect following)`,
    `sweeps with slope &gt; 0: <b>${positive} of ${sweeps.length}</b>`,
    `last sweep: <b>${(labElapsed / 1000).toFixed(1)} s</b> in the lab`,
  ].join("<br />");
}

// ---------------------------------------------------------------- rendering: flight

const FLIGHT_SECONDS = 60;
const flightLength = FLIGHT_SECONDS * NEURAL_HZ;
const flightTrace = new Float32Array(flightLength);
const flightTakeoff = new Uint8Array(flightLength);
let flightHead = 0;
const takeoffTimes = [];
let flash = 0;

function resetPolicy() {
  if (!circuit) return;
  policy = createPolicy(circuit.dn_all.length, circuit.gf, Date.now() >>> 0);
  takeoffTimes.length = 0;
  flightTrace.fill(0);
  flightTakeoff.fill(0);
}

function recordFlight(tookOff) {
  flightTrace[flightHead] = policy.reward;
  flightTakeoff[flightHead] = tookOff ? 1 : 0;
  flightHead = (flightHead + 1) % flightLength;
  if (tookOff) {
    takeoffTimes.push(worldTime);
    flash = 1;
  }
}

const gfCanvas = $("gfTrace");
const gfCtx = gfCanvas.getContext("2d");

// Giant-fiber drive over the last minute, in units of its own running
// deviation: the reward. The dashed line is the takeoff threshold.
function drawGfTrace() {
  const w = gfCanvas.width;
  const h = gfCanvas.height;
  const range = TAKEOFF_Z * 1.6;
  const yOf = (v) => h / 2 - (clamp(v, -range, range) / range) * (h / 2 - 4);
  gfCtx.fillStyle = "#03070a";
  gfCtx.fillRect(0, 0, w, h);
  gfCtx.strokeStyle = "#233341";
  gfCtx.beginPath();
  gfCtx.moveTo(0, yOf(0));
  gfCtx.lineTo(w, yOf(0));
  gfCtx.stroke();
  gfCtx.setLineDash([4, 4]);
  gfCtx.strokeStyle = "#ffc36b";
  gfCtx.beginPath();
  gfCtx.moveTo(0, yOf(TAKEOFF_Z));
  gfCtx.lineTo(w, yOf(TAKEOFF_Z));
  gfCtx.stroke();
  gfCtx.setLineDash([]);

  gfCtx.strokeStyle = "#73d8ff";
  gfCtx.lineWidth = 1.5;
  gfCtx.beginPath();
  for (let k = 0; k < flightLength; k++) {
    const i = (flightHead + k) % flightLength;
    const x = (k / (flightLength - 1)) * w;
    if (k === 0) gfCtx.moveTo(x, yOf(flightTrace[i]));
    else gfCtx.lineTo(x, yOf(flightTrace[i]));
    if (flightTakeoff[i]) {
      gfCtx.fillStyle = "#ffc36b";
      gfCtx.fillRect(x - 1.5, 0, 3, h);
    }
  }
  gfCtx.stroke();
  gfCtx.lineWidth = 1;
}

const actionCanvas = $("actions");
const actionCtx = actionCanvas.getContext("2d");

// What the policy is doing right now, one bar per action, centred at zero.
function drawActions() {
  const w = actionCanvas.width;
  const h = actionCanvas.height;
  actionCtx.fillStyle = "#03070a";
  actionCtx.fillRect(0, 0, w, h);
  const barW = w / ACTION_COUNT;
  const mid = h / 2 - 8;
  actionCtx.strokeStyle = "#233341";
  actionCtx.beginPath();
  actionCtx.moveTo(0, mid);
  actionCtx.lineTo(w, mid);
  actionCtx.stroke();
  actionCtx.font = "9px ui-monospace, monospace";
  actionCtx.textAlign = "center";
  for (let j = 0; j < ACTION_COUNT; j++) {
    const a = policy ? policy.actions[j] : 0;
    const global = j < 5;
    actionCtx.fillStyle = global ? "#ffc36b" : "#73d8ff";
    const barH = a * (mid - 4);
    actionCtx.fillRect(
      j * barW + 2,
      mid - Math.max(barH, 0),
      barW - 4,
      Math.abs(barH)
    );
    actionCtx.fillStyle = "#8fa0ae";
    if (global || j % 2 === 1) {
      actionCtx.fillText(
        global ? ACTION_LABELS[j][0].toUpperCase() : `m${(j - 5) >> 1}`,
        j * barW + barW / 2 - (global ? 0 : barW / 2),
        h - 4
      );
    }
  }
  actionCtx.textAlign = "start";
}

function drawFlightStats() {
  if (!policy) return;
  const minute = takeoffTimes.filter((t) => worldTime - t <= 60).length;
  let norm = 0;
  for (const v of policy.W) norm += v * v;
  $("flightStats").innerHTML = [
    `giant fiber (DNp01): <b>${policy.gfLevel.toFixed(4)}</b> · drive <b>${policy.reward.toFixed(2)}σ</b>`,
    `takeoffs: <b>${policy.takeoffs}</b> total · <b>${minute}</b> in the last minute`,
    `world: zoom <b>${worldView.zoom.toFixed(2)}</b> · contrast <b>${worldView.gain.toFixed(2)}</b>`,
    `policy |W|: <b>${Math.sqrt(norm).toFixed(2)}</b> · learning <b>${$("learn").checked ? "on" : "off"}</b>`,
  ].join("<br />");
}

// ---------------------------------------------------------------- stats & controls

function drawStats() {
  let energy = 0;
  for (let i = 0; i < MODE_COUNT; i++) energy += modeEnergy(coeff, i);
  const closed = $("closed").checked;
  const phase = phaseMode();
  const labText = !labReady
    ? "loading"
    : sweepRunning
      ? `optomotor sweep ${Math.round(100 * sweepProgress)}%…`
      : labBusy
        ? "replaying paired branches…"
        : `idle (last run ${(labElapsed / 1000).toFixed(1)} s)`;
  const loopText = closed
    ? "closed"
    : flightMode()
      ? "open (the fly cannot act)"
      : phase
        ? "open (the fly cannot turn)"
        : "open (leak only)";
  $("stats").innerHTML = [
    `loop: <b>${loopText}</b>`,
    `neural ticks: <b>${(tickInterval ? 1 / tickInterval : 0).toFixed(1)}</b> per world-s · <b>${tickLatency.toFixed(0)} ms</b>`,
    `mean |DN|: <b>${readout.dnMeanAbs.toFixed(3)}</b>`,
    phase
      ? `R−L: <b>${steer.raw.toExponential(2)}</b> · yaw <b>${flyYaw.toFixed(3)}</b>`
      : `world energy Σ|c|²: <b>${energy.toFixed(3)}</b>`,
    `lab: <b>${labText}</b>`,
    `t = <b>${worldTime.toFixed(1)} s</b>`,
  ].join("<br />");
  $("sweep").disabled = !liveReady || !labReady || labBusy;
}

// The readouts differ in what is meaningful: the phase readout fixes the
// texture, so it starts with the modes' own drift off (the stimulus is then
// the only motion on the retina); flight hands drift, zoom and contrast to the
// policy. Each mode shows only its own controls, and leaving flight returns
// the view to neutral.
function applyReadoutMode() {
  const mode = $("readoutMode").value;
  const show = {
    knobs: "knobs-only",
    phase: "phase-only",
    flight: "flight-only",
  };
  for (const [name, cls] of Object.entries(show)) {
    document
      .querySelectorAll(`.${cls}`)
      .forEach((el) => (el.hidden = name !== mode));
  }
  document
    .querySelectorAll(".no-flight")
    .forEach((el) => (el.hidden = mode === "flight"));
  $("drift").checked = mode === "knobs";
  if (mode !== "flight") {
    worldView.zoom = 0;
    worldView.gain = 1;
  }
  if (mode === "phase") drawSweep();
}

$("readoutMode").addEventListener("change", applyReadoutMode);
$("resetPolicy").addEventListener("click", resetPolicy);
$("eta").addEventListener("input", () => {
  $("etaOut").textContent = (10 ** Number($("eta").value)).toExponential(0);
});
$("sigma").addEventListener("input", () => {
  $("sigmaOut").textContent = Number($("sigma").value).toFixed(2);
});
$("sweep").addEventListener("click", runSweep);
$("stim").addEventListener("input", () => {
  $("stimOut").textContent = Number($("stim").value).toFixed(2);
});
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
  if (phaseMode()) drawYawTrace();
  if (flightMode()) {
    drawGfTrace();
    drawActions();
    $("takeoffFlash").style.opacity = flash.toFixed(2);
    flash = Math.max(0, flash - dt * 1.5);
  }
  if (now - lastStats > 250) {
    lastStats = now;
    drawOperator();
    drawStats();
    if (flightMode()) drawFlightStats();
  }
  requestAnimationFrame(frame);
}

randomizeWorld(seededRandom(7));
sampleEye(eye, coeff, 0);
// ?readout=phase|flight opens straight in that readout, so a link can point at it.
const requested = new URLSearchParams(location.search).get("readout");
if (requested === "phase" || requested === "flight") {
  $("readoutMode").value = requested;
}
applyReadoutMode();
requestAnimationFrame(frame);
loadMaleCns();
