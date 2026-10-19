import assert from "node:assert/strict";
import test from "node:test";

import {
  FEATURE_COUNT,
  SENSOR_CELLS,
  activeModeCount,
  createCurriculumTarget,
  curriculumStage,
  maskActions,
  maskSignals,
  stateAwareReward,
  stateDiscomfortPenalty,
  applyActions,
  buildModes,
  createDynamics,
  createReadout,
  createState,
  createTarget,
  geometricMatch,
  localMismatchField,
  precisionPotential,
  progressReward,
  projectDn,
  readoutActions,
  updateReadout,
} from "../../public/flydoom-fourier-next/model.js";

test("current and target share the same reachable state shape", () => {
  const modes = buildModes(32);
  const current = createState(modes.length);
  const target = createTarget(modes, 7, "fine");

  assert.equal(current.coeff.length, target.coeff.length);
  for (const key of ["tx", "tz", "tiltX", "tiltZ", "bowl"]) {
    assert.equal(typeof current[key], "number");
    assert.equal(typeof target[key], "number");
  }
});

test("identical surfaces have perfect geometric match and zero local mismatch", () => {
  const modes = buildModes(32);
  const state = createTarget(modes, 22, "mixed");
  const score = geometricMatch(state, state, modes);
  const field = localMismatchField(state, state, modes);

  assert.equal(score.match, 1);
  assert.equal(field.features.length, SENSOR_CELLS * FEATURE_COUNT);
  assert.ok(Array.from(field.magnitude).every((value) => value < 1e-9));
});

test("translation mismatch is visible to the physical score and local sensor", () => {
  const modes = buildModes(32);
  const target = createTarget(modes, 11, "mixed");
  const current = {
    ...target,
    coeff: new Float32Array(target.coeff),
    tx: target.tx + 1.2,
  };

  const score = geometricMatch(current, target, modes);
  const field = localMismatchField(current, target, modes);
  assert.ok(score.match < 0.985);
  assert.ok(Math.max(...field.magnitude) > 0.01);
});

test("curvature-only mismatch survives even when translation is equal", () => {
  const modes = buildModes(32);
  const target = createState(32);
  const current = createState(32);
  target.bowl = 0.25;

  const field = localMismatchField(current, target, modes);
  let curvatureEnergy = 0;
  for (let cell = 0; cell < SENSOR_CELLS; cell++) {
    curvatureEnergy += Math.abs(field.features[cell * FEATURE_COUNT + 3]);
  }
  assert.ok(curvatureEnergy > 0.1);
});

test("late precision pays far more than equal progress when far away", () => {
  const far = progressReward(0.501, 0.5);
  const near = progressReward(0.981, 0.98);

  assert.ok(far > 0);
  assert.ok(near > far * 20);
  assert.equal(progressReward(0.98, 0.98), 0);
  assert.ok(Math.abs(progressReward(0.98, 0.981) + near) < 1e-12);
  assert.ok(1 - precisionPotential(0.985 * 0.9) > 0.6);
});

test("coarse difficulty activates fewer Fourier modes than fine", () => {
  assert.equal(activeModeCount("coarse", 32), 8);
  assert.equal(activeModeCount("mixed", 32), 20);
  assert.equal(activeModeCount("fine", 32), 32);
});

test("thin output adapter produces bounded actions and learns from credited noise", () => {
  const dn = new Float32Array(1314);
  dn[3] = 0.4;
  dn[801] = -0.3;
  const hidden = projectDn(dn, 32);
  const readout = createReadout(37, 32, 42);
  const noise = new Float32Array(37).fill(0.04);
  const before = new Float32Array(readout.weights);
  const actions = readoutActions(readout, hidden, noise);
  const updateNorm = updateReadout(readout, hidden, noise, 0.7);

  assert.ok(Array.from(actions).every((value) => Math.abs(value) <= 1));
  assert.ok(updateNorm >= 0);
  assert.notDeepEqual(Array.from(readout.weights), Array.from(before));
});

test("actions integrate through bounded dynamics instead of teleporting", () => {
  const modes = buildModes(32);
  const state = createState(32);
  const dynamics = createDynamics(32);
  const actions = new Float32Array(37);
  actions[0] = 1;
  actions[32] = 1;

  applyActions(state, dynamics, actions, modes, 1 / 60);
  const firstCoeff = state.coeff[0];
  const firstTx = state.tx;
  applyActions(state, dynamics, actions, modes, 1 / 60);

  assert.ok(firstCoeff > 0);
  assert.ok(firstTx > 0);
  assert.ok(state.coeff[0] > firstCoeff);
  assert.ok(state.tx > firstTx);
});

test("curriculum starts with exactly one actuator and one scalar sensory signal", () => {
  const stage = curriculumStage(32, 0);

  assert.equal(stage.activeActions.length, 1);
  assert.equal(stage.activeSignalIndices.length, 1);
  assert.equal(stage.activeFeatures.length, 1);
  assert.equal(stage.unlockedActionLabel, "fourier-1");
  assert.equal(stage.unlockedFeatureLabel, "height");
});

test("curriculum adds exactly one actuator and one scalar signal per stage", () => {
  const first = curriculumStage(32, 0);
  const second = curriculumStage(32, 1);
  const sixth = curriculumStage(32, 5);
  const seventh = curriculumStage(32, 6);

  assert.equal(second.activeActions.length, first.activeActions.length + 1);
  assert.equal(
    second.activeSignalIndices.length,
    first.activeSignalIndices.length + 1,
  );
  assert.equal(sixth.activeSignalIndices.length, 6);
  assert.equal(seventh.activeSignalIndices.length, 7);
  assert.equal(seventh.activeActions.length, 7);
  assert.equal(new Set(seventh.activeSignalIndices).size, 7);
});

test("curriculum target preserves solved dimensions while adding a new one", () => {
  const modes = buildModes(32);
  const stage0 = createCurriculumTarget(modes, 99, 0);
  const stage1 = createCurriculumTarget(modes, 99, 1);

  assert.equal(stage0.coeff[0], stage1.coeff[0]);
  assert.equal(stage0.coeff[1], 0);
  assert.notEqual(stage1.coeff[1], 0);
});

test("inactive actuators and scalar sensory signals are hard-masked", () => {
  const actions = new Float32Array(37).fill(0.5);
  const maskedActions = maskActions(actions, [36]);
  assert.equal(maskedActions[36], 0.5);
  assert.equal(maskedActions[0], 0);
  assert.equal(maskedActions[35], 0);

  const features = new Float32Array(SENSOR_CELLS * FEATURE_COUNT).fill(0.5);
  const activeSignals = [3, FEATURE_COUNT + 1];
  const maskedFeatures = maskSignals(features, activeSignals);

  for (let index = 0; index < maskedFeatures.length; index++) {
    assert.equal(
      maskedFeatures[index],
      activeSignals.includes(index) ? 0.5 : 0,
    );
  }
});

test("bad stable states remain aversive even with zero progress", () => {
  const bad = stateDiscomfortPenalty(0.12);
  const medium = stateDiscomfortPenalty(0.5);
  const near = stateDiscomfortPenalty(0.98);

  assert.ok(bad < -0.3);
  assert.ok(medium < -0.08);
  assert.ok(Math.abs(near) < 0.001);
});

test("bad state stays negative while a small improvement still earns positive learning credit", () => {
  const parts = stateAwareReward(0.121, 0.12);

  assert.ok(parts.total < -0.4);
  assert.ok(parts.statePenalty < -0.5);
  assert.ok(parts.credit > 0);
});

test("worsening from the same bad state gives negative learning credit", () => {
  const parts = stateAwareReward(0.119, 0.12);

  assert.ok(parts.total < -0.4);
  assert.ok(parts.credit < 0);
});
