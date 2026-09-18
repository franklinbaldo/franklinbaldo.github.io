import assert from "node:assert/strict";
import test from "node:test";

import {
  boundCoefficient,
  coefficientLimitForMode,
  robustShapeMatch,
} from "../../public/flydoom-fourier/control_core.js";

function mode(freq) {
  return { freq, kx: freq, kz: 0, phase: "sin" };
}

test("exact Fourier state and translation score as a perfect match", () => {
  const modes = [mode(1), mode(2), mode(8)];
  const target = new Float32Array([0.2, -0.1, 0.03]);
  const score = robustShapeMatch({
    coeff: target,
    target,
    modes,
    count: target.length,
    currentOffsetX: 1.2,
    currentOffsetZ: -0.7,
    targetOffsetX: 1.2,
    targetOffsetZ: -0.7,
  });
  assert.equal(score, 1);
});

test("one rogue high-frequency coefficient cannot produce a hit", () => {
  const modes = Array.from({ length: 256 }, (_, i) => mode(1 + i / 3));
  const target = new Float32Array(256);
  const coeff = new Float32Array(256);
  const k = 220;
  coeff[k] = coefficientLimitForMode(modes[k], 0.55) * 0.95;

  const score = robustShapeMatch({
    coeff,
    target,
    modes,
    count: 256,
    complexity: 0.55,
  });

  assert.ok(score < 0.97, `spike exploit scored ${score}`);
});

test("translation must be matched instead of being free target motion", () => {
  const modes = Array.from({ length: 32 }, (_, i) => mode(i + 1));
  const state = new Float32Array(32);
  const score = robustShapeMatch({
    coeff: state,
    target: state,
    modes,
    count: state.length,
    currentOffsetX: 0,
    currentOffsetZ: 0,
    targetOffsetX: 2.4,
    targetOffsetZ: 0,
  });
  assert.ok(score < 0.97);
});

test("spectral budget shrinks with frequency and clamps coefficients", () => {
  const low = mode(1);
  const high = mode(80);
  const lowLimit = coefficientLimitForMode(low, 0.55);
  const highLimit = coefficientLimitForMode(high, 0.55);

  assert.ok(highLimit < lowLimit);
  assert.equal(boundCoefficient(10, high, 0.55), highLimit);
  assert.equal(boundCoefficient(-10, high, 0.55), -highLimit);
});
