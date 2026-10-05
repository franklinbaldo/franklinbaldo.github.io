// Self-tuning generative world for /fly-shader/.
//
// Shared by the browser and headless assays. The latent has 128 eye-visible
// dimensions: 64 complex multiscale Fourier modes. The first eight dimensions
// also warp coordinates. No latent dimension is reserved for colour/palette or
// blind-field-only effects: every theta component changes panorama luminance.

export const WORLD_LATENT_DIM = 128;
export const WORLD_MODE_COUNT = WORLD_LATENT_DIM / 2;
export const WORLD_BASELINE_SECONDS = 8;
export const WORLD_GAIN = 0.18;
export const WORLD_LEAK = 0.2;
export const WORLD_THETA_MAX = 2;
export const WORLD_INIT_SCALE = 0.35;
export const WORLD_WARP = 0.08;
export const WORLD_FIELD_SCALE = 1 / Math.sqrt(WORLD_MODE_COUNT);

function clamp(value, lo, hi) {
  return Math.min(hi, Math.max(lo, value));
}

export function worldSeededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function modeGeometry(i) {
  const band = Math.floor(i / 16);
  const cycles = 0.75 * 2 ** band;
  const orientation = ((i % 16) * Math.PI) / 16 + (band * Math.PI) / 64;
  return {
    kx: 2 * Math.PI * cycles * Math.cos(orientation),
    ky: 2 * Math.PI * cycles * Math.sin(orientation),
  };
}

export const worldModes = Array.from({ length: WORLD_MODE_COUNT }, (_, i) =>
  modeGeometry(i)
);

function warpedPoint(theta, x, y) {
  const pi = Math.PI;
  const dx =
    theta[0] * Math.sin(2 * pi * y) +
    theta[1] * Math.cos(pi * x) +
    theta[2] * Math.sin(pi * (x + y)) +
    theta[3] * Math.cos(pi * (x - y));
  const dy =
    theta[4] * Math.sin(pi * x) +
    theta[5] * Math.cos(2 * pi * y) +
    theta[6] * Math.sin(pi * (x - y)) +
    theta[7] * Math.cos(pi * (x + y));
  return {
    x: x + WORLD_WARP * dx,
    y: y + WORLD_WARP * dy,
  };
}

// Raw scalar field before the same tanh(0.9 * field) squash used by the eye.
// There is intentionally no autonomous time term: fixed theta means a
// stationary sensory world, so a fixed point can actually be a fixed point.
export function worldValue(theta, x, y) {
  const q = warpedPoint(theta, x, y);
  let value = 0;
  for (let i = 0; i < WORLD_MODE_COUNT; i++) {
    const m = worldModes[i];
    const phase = m.kx * q.x + m.ky * q.y;
    value +=
      theta[2 * i] * Math.cos(phase) -
      theta[2 * i + 1] * Math.sin(phase);
  }
  return WORLD_FIELD_SCALE * value;
}

export function createWorldTheta(seed = 1, scale = WORLD_INIT_SCALE) {
  const rng = worldSeededRandom(seed);
  const theta = new Float32Array(WORLD_LATENT_DIM);
  for (let i = 0; i < theta.length; i++) theta[i] = (rng() * 2 - 1) * scale;
  return theta;
}

export function createWorldEye(count) {
  return {
    lum: new Float32Array(count),
    dlum: new Float32Array(count),
    previousTime: null,
  };
}

export function sampleWorldColumns(eye, geometry, theta, t) {
  const dt =
    eye.previousTime === null ? null : Math.max(1e-3, t - eye.previousTime);
  for (let c = 0; c < geometry.count; c++) {
    const lum = Math.tanh(
      0.9 * worldValue(theta, geometry.x[c], geometry.y[c])
    );
    eye.dlum[c] =
      dt === null ? 0 : Math.tanh(((lum - eye.lum[c]) / dt) * 0.5);
    eye.lum[c] = lum;
  }
  eye.previousTime = t;
  return eye;
}

export function createDnBaseline(dnCount) {
  return {
    n: 0,
    sum: new Float64Array(dnCount),
    sumSq: new Float64Array(dnCount),
  };
}

export function observeDnBaseline(acc, dnValues) {
  acc.n++;
  for (let i = 0; i < dnValues.length; i++) {
    const v = dnValues[i];
    acc.sum[i] += v;
    acc.sumSq[i] += v * v;
  }
}

export function freezeDnBaseline(acc) {
  if (!acc.n) throw new Error("cannot freeze an empty DN baseline");
  const mean = new Float32Array(acc.sum.length);
  const variance = new Float32Array(acc.sum.length);
  for (let i = 0; i < mean.length; i++) {
    mean[i] = acc.sum[i] / acc.n;
    const second = acc.sumSq[i] / acc.n;
    variance[i] = Math.max(1e-8, second - mean[i] * mean[i]);
  }
  return { mean, variance, samples: acc.n };
}

export function createPermutation(length, seed) {
  const p = Uint32Array.from({ length }, (_, i) => i);
  const rng = worldSeededRandom(seed);
  for (let i = length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = p[i];
    p[i] = p[j];
    p[j] = tmp;
  }
  return p;
}

export function createWorldCoupler(
  dnCount,
  worldSeed = 1,
  projectionSeed = 1,
  theta = createWorldTheta(worldSeed)
) {
  const rng = worldSeededRandom(projectionSeed);
  const projection = new Int8Array(WORLD_LATENT_DIM * dnCount);
  for (let i = 0; i < projection.length; i++)
    projection[i] = rng() < 0.5 ? -1 : 1;
  return {
    dnCount,
    worldSeed,
    projectionSeed,
    theta: new Float32Array(theta),
    projection,
    z: new Float32Array(dnCount),
    velocity: new Float32Array(WORLD_LATENT_DIM),
    velocityNorm: 0,
  };
}

export function worldCouplerStep(
  coupler,
  dnValues,
  baseline,
  dt,
  {
    drive = true,
    gain = WORLD_GAIN,
    leak = WORLD_LEAK,
    dnPermutation = null,
  } = {}
) {
  if (!baseline) throw new Error("world coupling requires a frozen DN baseline");
  const { dnCount, projection, theta, velocity, z } = coupler;
  const inv = 1 / Math.sqrt(dnCount);

  for (let d = 0; d < dnCount; d++) {
    const dev = dnValues[d] - baseline.mean[d];
    z[d] = clamp(dev / Math.sqrt(baseline.variance[d] + 1e-10), -4, 4);
  }

  let speedSq = 0;
  for (let j = 0; j < WORLD_LATENT_DIM; j++) {
    let projected = 0;
    if (drive) {
      const row = j * dnCount;
      for (let d = 0; d < dnCount; d++) {
        const source = dnPermutation ? dnPermutation[d] : d;
        projected += projection[row + d] * z[source];
      }
      projected *= inv;
    }
    const v = gain * projected - leak * theta[j];
    velocity[j] = v;
    theta[j] = clamp(theta[j] + dt * v, -WORLD_THETA_MAX, WORLD_THETA_MAX);
    speedSq += v * v;
  }
  coupler.velocityNorm = Math.sqrt(speedSq / WORLD_LATENT_DIM);
  return coupler.theta;
}

export function permuteColumnSample(sample, permutation, target = null) {
  const out =
    target ??
    {
      lum: new Float32Array(sample.lum.length),
      dlum: new Float32Array(sample.dlum.length),
    };
  for (let i = 0; i < permutation.length; i++) {
    const source = permutation[i];
    out.lum[i] = sample.lum[source];
    out.dlum[i] = sample.dlum[source];
  }
  return out;
}

export function rmsDistance(a, b) {
  if (a.length !== b.length) throw new Error("distance vectors differ in size");
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum / a.length);
}

export function vectorRms(a) {
  let sum = 0;
  for (const v of a) sum += v * v;
  return Math.sqrt(sum / a.length);
}

// GLSL implementation of the same generator. app.js runs a readPixels parity
// check against worldValue() so the screen and the eye cannot silently drift.
export const WORLD_GLSL = String.raw\`
uniform vec4 uWorldTheta[32];

void addWorldMode(float fi, vec2 amp, vec2 q, inout float total) {
  float band = floor(fi / 16.0);
  float cycles = 0.75 * exp2(band);
  float orientation = mod(fi, 16.0) * 3.141592653589793 / 16.0
                    + band * 3.141592653589793 / 64.0;
  float k = 6.283185307179586 * cycles;
  float phase = k * (cos(orientation) * q.x + sin(orientation) * q.y);
  total += amp.x * cos(phase) - amp.y * sin(phase);
}

float generativeWorld(vec2 p) {
  vec4 a = uWorldTheta[0];
  vec4 b = uWorldTheta[1];
  float dx = a.x * sin(6.283185307179586 * p.y)
           + a.y * cos(3.141592653589793 * p.x)
           + a.z * sin(3.141592653589793 * (p.x + p.y))
           + a.w * cos(3.141592653589793 * (p.x - p.y));
  float dy = b.x * sin(3.141592653589793 * p.x)
           + b.y * cos(6.283185307179586 * p.y)
           + b.z * sin(3.141592653589793 * (p.x - p.y))
           + b.w * cos(3.141592653589793 * (p.x + p.y));
  vec2 q = p + 0.08000000 * vec2(dx, dy);

  float total = 0.0;
  for (int block = 0; block < 32; block++) {
    vec4 th = uWorldTheta[block];
    float i0 = float(block * 2);
    addWorldMode(i0, th.xy, q, total);
    addWorldMode(i0 + 1.0, th.zw, q, total);
  }
  return 0.125000000000 * total;
}
\`;
