import assert from "node:assert/strict";
import test from "node:test";

import {
  boundCoefficient,
  coefficientLimitForMode,
  enforceSpectralEnergyBudget,
  exponentialPrecisionDelta,
  exponentialPrecisionPotential,
  normalizedSpectralRms,
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

test("global spectral budget prevents many bounded modes from stacking into spikes", () => {
  const modes = Array.from({ length: 256 }, (_, i) => mode(1 + i / 3));
  const coeff = new Float32Array(256);
  for (let i = 0; i < coeff.length; i++) {
    coeff[i] = coefficientLimitForMode(modes[i], 0.55);
  }

  const scale = enforceSpectralEnergyBudget(
    coeff,
    modes,
    coeff.length,
    0.55,
    0.6,
  );

  assert.ok(scale < 1);
  const normalizedRms = Math.sqrt(
    Array.from(coeff).reduce((sum, value, i) => {
      const limit = coefficientLimitForMode(modes[i], 0.55);
      return sum + (value / limit) ** 2;
    }, 0) / coeff.length,
  );
  assert.ok(normalizedRms <= 0.600001);
});

test("target-aware energy ceiling can preserve a legal target above the floor", () => {
  const modes = Array.from({ length: 16 }, (_, i) => mode(i + 1));
  const target = new Float32Array(16);
  for (let i = 0; i < target.length; i++) {
    target[i] = coefficientLimitForMode(modes[i], 0.55) * 0.62;
  }

  const targetRms = normalizedSpectralRms(
    target,
    modes,
    target.length,
    0.55,
  );
  const ceiling = Math.max(0.6, targetRms + 0.05);
  const copy = new Float32Array(target);
  const scale = enforceSpectralEnergyBudget(
    copy,
    modes,
    copy.length,
    0.55,
    ceiling,
  );

  assert.equal(scale, 1);
});

test("precision potential concentrates reward near the success threshold", () => {
  const threshold = 0.97;
  const beta = 10;
  const coarse = exponentialPrecisionDelta(0.501, 0.5, threshold, beta);
  const precise = exponentialPrecisionDelta(0.961, 0.96, threshold, beta);

  assert.ok(precise > coarse * 100);
  assert.ok(precise > 0);
});

test("precision delta is symmetric: worsening near target is an equal penalty", () => {
  const threshold = 0.97;
  const beta = 10;
  const up = exponentialPrecisionDelta(0.961, 0.96, threshold, beta);
  const down = exponentialPrecisionDelta(0.96, 0.961, threshold, beta);

  assert.ok(up > 0);
  assert.equal(down, -up);
});

test("staying still produces no precision reward", () => {
  assert.equal(exponentialPrecisionDelta(0.95, 0.95, 0.97, 10), 0);
});

test("most extractable potential remains near the success threshold", () => {
  const threshold = 0.97;
  const beta = 10;
  const atNinetyPercentOfThreshold = exponentialPrecisionPotential(
    threshold * 0.9,
    threshold,
    beta,
  );

  assert.ok(atNinetyPercentOfThreshold < 0.4);
  assert.ok(1 - atNinetyPercentOfThreshold > 0.6);
});
