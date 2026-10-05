// The Shader Is the Fly's World — closed-loop demo.
// World: 12 drifting Fourier modes with complex coefficients (the knobs).
// Eye: 8×4 analytic samples of the field, 6 features per cell.
// Brain: frozen MaleCNS connectome (shared worker from FlyDoom Fourier Next).
// Motor: 1,314 descending neurons → fixed ±1 projection → 24 knob velocities.

const MODE_COUNT = 12;
const KNOB_COUNT = MODE_COUNT * 2;
const EYE_COLS = 8;
const EYE_ROWS = 4;
const EYE_CELLS = EYE_COLS * EYE_ROWS;
const FEATURE_COUNT = 6;
const MOTOR_DRIVE = 0.9;
const MAX_AMPLITUDE = 1.2;
const KICK_SIZE = 0.8;
const OP_WINDOW = [1, 3];
const PROBE_INTERVAL = 4;
const READOUT_TAU = 4;
// The worker advances its recurrent state one fixed step per message, so the
// brain is stepped on world time, not per animation frame (refresh-independent).
const NEURAL_HZ = 15;
const WATERFALL_SECONDS = 20;

const $ = (id) => document.getElementById(id);

function clamp(value, lo, hi) {
  return Math.min(hi, Math.max(lo, value));
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

// ---------------------------------------------------------------- world

const modes = [];
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

const coeff = new Float32Array(KNOB_COUNT); // [re0, im0, re1, im1, …]
const motor = new Float32Array(KNOB_COUNT); // latest DN command, in [-1, 1]
let haveMotor = false;
let worldTime = 0;

function randomizeWorld(rng = Math.random) {
  for (let i = 0; i < KNOB_COUNT; i++) coeff[i] = (rng() * 2 - 1) * 0.25;
}

function modeEnergy(source, i) {
  const re = source[2 * i];
  const im = source[2 * i + 1];
  return re * re + im * im;
}

function limitAmplitude(source) {
  for (let i = 0; i < MODE_COUNT; i++) {
    const amplitude = Math.sqrt(modeEnergy(source, i));
    if (amplitude > MAX_AMPLITUDE) {
      const scale = MAX_AMPLITUDE / amplitude;
      source[2 * i] *= scale;
      source[2 * i + 1] *= scale;
    }
  }
}

// Field value and analytic derivatives at (x, y), x ∈ [0, 2], y ∈ [0, 1].
function sampleField(x, y, t) {
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

// ---------------------------------------------------------------- eye

const previousLuminance = new Float32Array(EYE_CELLS);
let previousEyeTime = null;
const eyeSamples = new Float32Array(EYE_CELLS * FEATURE_COUNT);

function eyeCellCenter(cell) {
  const col = cell % EYE_COLS;
  const row = Math.floor(cell / EYE_COLS);
  return { x: ((col + 0.5) / EYE_COLS) * 2, y: (row + 0.5) / EYE_ROWS };
}

function sampleEye(t) {
  const dt =
    previousEyeTime === null ? null : Math.max(1e-3, t - previousEyeTime);
  for (let cell = 0; cell < EYE_CELLS; cell++) {
    const { x, y } = eyeCellCenter(cell);
    const f = sampleField(x, y, t);
    const luminance = Math.tanh(f.value * 0.9);
    const temporal =
      dt === null
        ? 0
        : Math.tanh(((luminance - previousLuminance[cell]) / dt) * 0.5);
    const o = cell * FEATURE_COUNT;
    eyeSamples[o] = luminance;
    eyeSamples[o + 1] = Math.tanh(f.dx / 15);
    eyeSamples[o + 2] = Math.tanh(f.dy / 15);
    eyeSamples[o + 3] = temporal;
    eyeSamples[o + 4] = Math.tanh(Math.hypot(f.dx, f.dy) / 15);
    eyeSamples[o + 5] = Math.tanh(f.laplacian / 300);
    previousLuminance[cell] = luminance;
  }
  previousEyeTime = t;
  return eyeSamples;
}

// ---------------------------------------------------------------- motor readout

let projection = null;
let projectionScale = 1;
const readoutMean = new Float64Array(KNOB_COUNT);
const readoutVar = new Float64Array(KNOB_COUNT).fill(1e-2);
let readoutPrimed = false;
let lastTickTime = null;
let dnMeanAbs = 0;

function buildProjection(dnCount) {
  const rng = seededRandom(20261005);
  projection = new Int8Array(KNOB_COUNT * dnCount);
  for (let i = 0; i < projection.length; i++) {
    projection[i] = rng() < 0.5 ? -1 : 1;
  }
  projectionScale = 1 / Math.sqrt(dnCount);
}

function readMotor(dnValues, tickDt) {
  const dnCount = dnValues.length;
  if (!projection || projection.length !== KNOB_COUNT * dnCount) {
    buildProjection(dnCount);
  }

  let absSum = 0;
  for (let d = 0; d < dnCount; d++) absSum += Math.abs(dnValues[d]);
  dnMeanAbs = absSum / dnCount;

  const adaptive = $("adaptive").checked;
  const gain = Number($("gain").value);
  const alpha = 1 - Math.exp(-tickDt / READOUT_TAU);

  for (let j = 0; j < KNOB_COUNT; j++) {
    let sum = 0;
    const offset = j * dnCount;
    for (let d = 0; d < dnCount; d++)
      sum += projection[offset + d] * dnValues[d];
    const p = sum * projectionScale;

    if (!readoutPrimed) readoutMean[j] = p;
    const deviation = p - readoutMean[j];
    readoutMean[j] += alpha * deviation;
    readoutVar[j] += alpha * (deviation * deviation - readoutVar[j]);

    const drive = adaptive
      ? (deviation / Math.sqrt(readoutVar[j] + 1e-8)) * 0.6
      : p * 4;
    motor[j] = Math.tanh(gain * drive);
  }
  readoutPrimed = true;
  haveMotor = true;
}

// ---------------------------------------------------------------- connectome

let worker = null;
let workerReady = false;
let workerBusy = false;
let tickLatency = 0;
let tickInterval = 0;

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
    const circuit = await circuitResponse.json();

    // Same 16 visual ingress buckets per side as FlyDoom Fourier Next, so the
    // 8×4 eye keeps its left/right retinotopy (cols 0–3 left, 4–7 right).
    const buckets = 16;
    circuit.ray_vpl = [];
    circuit.ray_vpr = [];
    const vplLen = Math.floor(circuit.vpl.length / buckets);
    const vprLen = Math.floor(circuit.vpr.length / buckets);
    for (let i = 0; i < buckets; i++) {
      circuit.ray_vpl.push(circuit.vpl.slice(i * vplLen, (i + 1) * vplLen));
      circuit.ray_vpr.push(circuit.vpr.slice(i * vprLen, (i + 1) * vprLen));
    }

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
    const copy = (v) =>
      v.buffer.slice(v.byteOffset, v.byteOffset + v.byteLength);

    const offsets = getVector(5, Uint32Array);
    const scales = getVector(6, Float32Array);
    const deltas = getVector(7, Uint16Array);
    const weights = getVector(8, Uint8Array);
    const lut = getVector(9, Float32Array);
    if (!offsets || !scales || !deltas || !weights || !lut) {
      throw new Error("invalid MaleCNS vectors");
    }

    worker = new Worker(
      new URL("../flydoom-fourier-next/worker.js", import.meta.url)
    );
    worker.onmessage = (event) => {
      const msg = event.data;
      if (msg.type === "ready") {
        workerReady = true;
        setStatus(
          `${msg.neurons.toLocaleString("en")} neurons · ${msg.descending.toLocaleString("en")} DNs · frozen weights`,
          "live"
        );
        return;
      }
      if (msg.type === "result") {
        workerBusy = false;
        tickLatency = msg.latency;
        // Readout adaptation runs on world time, so pausing or a background
        // tab does not count as elapsed simulation time.
        const tickDt =
          lastTickTime === null
            ? 1 / NEURAL_HZ
            : Math.max(1e-3, sentWorldTime - lastTickTime);
        lastTickTime = sentWorldTime;
        tickInterval = tickInterval
          ? tickInterval * 0.9 + tickDt * 0.1
          : tickDt;
        readMotor(new Float32Array(msg.dnValues), tickDt);
      }
    };
    worker.onerror = (event) => {
      workerBusy = false;
      workerReady = false;
      // Stop driving the knobs with a frozen command and drop any sample
      // that would otherwise be scored as closed-loop.
      haveMotor = false;
      motor.fill(0);
      pending = null;
      setStatus(`MaleCNS worker error: ${event.message}`, "error");
    };
    worker.postMessage({
      type: "init",
      circuit,
      nNeurons: offsets.length - 1,
      offsets: copy(offsets),
      scales: copy(scales),
      deltas: copy(deltas),
      weights: copy(weights),
      lut: copy(lut),
    });
  } catch (error) {
    console.error(error);
    setStatus("MaleCNS unavailable — the world only leaks", "error");
  }
}

let nextNeuralTime = 0;
let sentWorldTime = 0;

function neuralTick() {
  if (!workerReady || workerBusy || paused) return;
  if (worldTime < nextNeuralTime) return;
  // Keep phase while on time; when late (first tick after loading, a stalled
  // worker, a slow device) drop the backlog and wait a full interval.
  nextNeuralTime += 1 / NEURAL_HZ;
  if (nextNeuralTime <= worldTime) nextNeuralTime = worldTime + 1 / NEURAL_HZ;
  workerBusy = true;
  sentWorldTime = worldTime;
  const features = Array.from(sampleEye(worldTime));
  worker.postMessage({
    type: "step",
    features,
    featureCount: FEATURE_COUNT,
    cellCount: EYE_CELLS,
  });
}

// ---------------------------------------------------------------- perturbation & operator

const operatorSum = new Float64Array(MODE_COUNT * MODE_COUNT);
const operatorCount = new Uint32Array(MODE_COUNT);
let pending = null;
let lastProbe = 0;
let lastKickTime = -Infinity;
const kickMarks = [];

function kick(mode = Math.floor(Math.random() * MODE_COUNT)) {
  const pre = new Float64Array(MODE_COUNT);
  for (let i = 0; i < MODE_COUNT; i++) pre[i] = modeEnergy(coeff, i);

  const re0 = coeff[2 * mode];
  const im0 = coeff[2 * mode + 1];
  const phase = Math.random() * Math.PI * 2;
  coeff[2 * mode] += KICK_SIZE * Math.cos(phase);
  coeff[2 * mode + 1] += KICK_SIZE * Math.sin(phase);
  limitAmplitude(coeff);
  kickMarks.push({ mode, t: worldTime });

  // Near MAX_AMPLITUDE the clamp shortens and rotates the kick, so measure
  // the perturbation actually applied rather than the nominal KICK_SIZE.
  const dRe = coeff[2 * mode] - re0;
  const dIm = coeff[2 * mode + 1] - im0;
  const kickEnergy = dRe * dRe + dIm * dIm;
  const injected = modeEnergy(coeff, mode) - pre[mode];

  // A sample counts only if the DNs are actually holding the knobs and the
  // previous kick has washed out; a kick that lands inside another kick's
  // window contaminates both, so the earlier measurement is dropped too.
  const washedOut = worldTime - lastKickTime >= OP_WINDOW[1];
  lastKickTime = worldTime;
  const loopLive = $("closed").checked && workerReady && haveMotor;

  pending =
    loopLive && washedOut && !pending && kickEnergy > 1e-4
      ? {
          mode,
          t0: worldTime,
          pre,
          actual: new Float64Array(MODE_COUNT),
          kickEnergy,
          injected,
          passive: 0,
          samples: 0,
        }
      : null;
}

// Response of mode i = mean energy in the window minus energy just before the
// kick. On the kicked mode, the energy the kick itself would still carry under
// passive leak is subtracted: the energy the kick injected into that mode
// (post-clamp, cross term included), decaying at the leak rate.
function trackPending(leak) {
  if (!pending) return;
  const age = worldTime - pending.t0;
  if (age >= OP_WINDOW[0] && age <= OP_WINDOW[1]) {
    for (let i = 0; i < MODE_COUNT; i++)
      pending.actual[i] += modeEnergy(coeff, i);
    pending.passive += pending.injected * Math.exp(-2 * leak * age);
    pending.samples++;
  }
  if (age > OP_WINDOW[1]) {
    if (pending.samples > 0) {
      const row = pending.mode * MODE_COUNT;
      const n = pending.samples;
      for (let i = 0; i < MODE_COUNT; i++) {
        let response = pending.actual[i] / n - pending.pre[i];
        if (i === pending.mode) response -= pending.passive / n;
        operatorSum[row + i] += response / pending.kickEnergy;
      }
      operatorCount[pending.mode]++;
    }
    pending = null;
  }
}

// ---------------------------------------------------------------- dynamics

let paused = false;

function step(dt) {
  const leak = Number($("leak").value);
  const closed = $("closed").checked;
  for (let i = 0; i < KNOB_COUNT; i++) {
    const drive = closed && haveMotor ? MOTOR_DRIVE * motor[i] : 0;
    coeff[i] += dt * (drive - leak * coeff[i]);
  }
  limitAmplitude(coeff);
  worldTime += dt;
  trackPending(leak);

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
    const luminance = eyeSamples[o];
    const gray = Math.round(128 + luminance * 120);
    eyeCtx.fillStyle = `rgb(${gray},${gray},${gray})`;
    eyeCtx.fillRect(cx - size / 2, cy - size / 2, size, size);
    eyeCtx.strokeStyle = "rgba(5,9,13,0.9)";
    eyeCtx.strokeRect(cx - size / 2, cy - size / 2, size, size);

    const gx = eyeSamples[o + 1];
    const gy = eyeSamples[o + 2];
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

    if (haveMotor) {
      ctx.strokeStyle = "rgba(214,124,255,0.75)";
      ctx.beginPath();
      ctx.moveTo(c, c);
      ctx.lineTo(c + motor[2 * i] * r * 0.5, c - motor[2 * i + 1] * r * 0.5);
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

  // Rows are centred column-wise over the kicked modes measured so far, so a
  // cell shows what is specific to kicking that mode, not the loop's drift.
  const measured = [];
  for (let r = 0; r < MODE_COUNT; r++) if (operatorCount[r]) measured.push(r);
  const columnMean = new Float64Array(MODE_COUNT);
  if (measured.length >= 2) {
    for (const r of measured) {
      for (let c = 0; c < MODE_COUNT; c++) {
        columnMean[c] +=
          operatorSum[r * MODE_COUNT + c] / operatorCount[r] / measured.length;
      }
    }
  }
  const valueAt = (r, c) =>
    operatorSum[r * MODE_COUNT + c] / operatorCount[r] - columnMean[c];

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
  $("opCount").textContent = `${kicks} kick${kicks === 1 ? "" : "s"} recorded`;
}

// ---------------------------------------------------------------- stats & controls

function drawStats() {
  let energy = 0;
  for (let i = 0; i < MODE_COUNT; i++) energy += modeEnergy(coeff, i);
  const closed = $("closed").checked;
  $("stats").innerHTML = [
    `loop: <b>${closed ? "closed" : "open (leak only)"}</b>`,
    `neural ticks: <b>${(tickInterval ? 1 / tickInterval : 0).toFixed(1)}</b> per world-s · <b>${tickLatency.toFixed(0)} ms</b>`,
    `mean |DN|: <b>${dnMeanAbs.toFixed(3)}</b>`,
    `world energy Σ|c|²: <b>${energy.toFixed(3)}</b>`,
    `t = <b>${worldTime.toFixed(1)} s</b>${pending ? " · measuring kick…" : ""}`,
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
  pending = null;
  nextNeuralTime = worldTime;
});
$("clearOp").addEventListener("click", () => {
  operatorSum.fill(0);
  operatorCount.fill(0);
});
$("pause").addEventListener("click", () => {
  paused = !paused;
  $("pause").textContent = paused ? "Resume" : "Pause";
});
$("closed").addEventListener("change", () => {
  pending = null;
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
sampleEye(0);
requestAnimationFrame(frame);
loadMaleCns();
