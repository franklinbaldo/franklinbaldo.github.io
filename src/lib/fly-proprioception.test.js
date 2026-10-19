import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CHANNELS,
  passiveState,
  encodeFeCO,
  neuralFrame,
} from "../../public/fly-proprioception/model.js";

test("passive joint remains within limits and reports analytic velocity", () => {
  for (const center of [20, 45, 90, 140, 160])
    for (let time = 0; time < 5; time += 0.01) {
      const params = { center, amplitude: 70, frequency: 0.5 };
      const state = passiveState(time, params);
      assert.ok(state.angleDeg >= 20 && state.angleDeg <= 160);
      const next = passiveState(time + 1e-6, params);
      assert.ok(
        Math.abs(
          (next.angleDeg - state.angleDeg) / 1e-6 - state.velocityDegPerSec
        ) < 0.001
      );
    }
});
test("static positions retain claw signal, with no movement channel", () => {
  const flexed = encodeFeCO(passiveState(10, { center: 20, amplitude: 0 }));
  const extended = encodeFeCO(passiveState(10, { center: 160, frequency: 0 }));
  assert.equal(flexed.clawFlexion, 1);
  assert.equal(extended.clawExtension, 1);
  for (const state of [flexed, extended])
    for (const key of ["hookFlexion", "hookExtension", "clubMovement"])
      assert.equal(state[key], 0);
});
test("direction reversal swaps hook channels but preserves club movement", () => {
  const forward = encodeFeCO({ angleDeg: 90, velocityDegPerSec: 90 });
  const reverse = encodeFeCO({ angleDeg: 90, velocityDegPerSec: -90 });
  assert.equal(forward.hookExtension, reverse.hookFlexion);
  assert.equal(forward.hookFlexion, 0);
  assert.equal(reverse.hookExtension, 0);
  assert.equal(forward.clubMovement, reverse.clubMovement);
  assert.equal(forward.clawFlexion, reverse.clawFlexion);
});
test("channels saturate and reject invalid physical inputs", () => {
  for (const velocity of [-10000, 0, 10000])
    for (const value of Object.values(
      encodeFeCO({ angleDeg: 80, velocityDegPerSec: velocity })
    ))
      assert.ok(value >= 0 && value <= 1);
  for (const value of [NaN, Infinity, -Infinity]) {
    assert.throws(() => passiveState(value));
    assert.throws(() => encodeFeCO({ angleDeg: value, velocityDegPerSec: 0 }));
    assert.throws(() => encodeFeCO({ angleDeg: 90, velocityDegPerSec: value }));
  }
  assert.throws(() => passiveState(-1));
  assert.throws(() => passiveState(0, { frequency: 2 }));
  assert.throws(() => encodeFeCO({ angleDeg: 180, velocityDegPerSec: 0 }));
});
test("initial neural frame is disconnected with no invented activity", () => {
  assert.deepEqual(CHANNELS.length, 5);
  const frame = neuralFrame();
  assert.equal(frame.status, "NOT_CONNECTED");
  assert.equal(frame.activity, null);
  assert.equal(frame.mapping, null);
  const html = readFileSync(
    new URL("../../public/fly-proprioception/index.html", import.meta.url),
    "utf8"
  );
  assert.match(html, /NOT_CONNECTED/);
  assert.match(html, /não representam neurônios/);
});

import {
  createBrain,
  brainStepWithDrive,
} from "../../public/fly-shader/sim.js";
import {
  modelledDrive,
  validateAudit,
  summarizeActivity,
  decodeConnectome,
} from "../../public/fly-proprioception/adapter.js";

const syntheticGraph = () => ({
  offsets: new Uint32Array([0, 0, 1, 2]),
  scales: new Float32Array([1, 1, 1]),
  deltas: new Uint16Array([0, 1]),
  weights: new Uint8Array([0x11]),
  lut: new Float32Array([0, 1]),
});
test("sparse drive propagates along a synthetic graph, without a DN readout", () => {
  const brain = createBrain({ dn_all: [2] }, syntheticGraph());
  assert.deepEqual([...brainStepWithDrive(brain, [[0, 1]])], []);
  assert.ok(brain.state[0] > 0);
  assert.equal(brain.state[1], 0);
  assert.equal(brain.state[2], 0);
  brainStepWithDrive(brain, [[0, 1]]);
  assert.ok(brain.state[1] > 0);
  assert.equal(brain.state[2], 0);
  const output = brainStepWithDrive(brain, [[0, 1]], [2]);
  assert.ok(output[0] > 0);
  assert.throws(() => brainStepWithDrive(brain, [[3, 1]]));
  assert.throws(() => brainStepWithDrive(brain, [[0, NaN]]));
  assert.throws(() => brainStepWithDrive(brain, [[0, 2]]));
});
test("zero input stays silent and summaries report actual states", () => {
  const brain = createBrain({ dn_all: [] }, syntheticGraph());
  for (let i = 0; i < 10; i++) brainStepWithDrive(brain, []);
  assert.deepEqual([...brain.state], [0, 0, 0]);
  assert.deepEqual(
    summarizeActivity(new Float32Array([-0.5, 0.5]), { sample: [0, 1] }),
    { sample: 0.5 }
  );
});
test("modelled subtype drive does not fabricate individual direction tuning", () => {
  const audit = {
    feco_candidates: [
      { index: 1, synonyms: "FeCO claw" },
      { index: 2, synonyms: "FeCO hook" },
      { index: 3, synonyms: "FeCO club" },
    ],
  };
  const positive = modelledDrive(
    audit,
    encodeFeCO({ angleDeg: 90, velocityDegPerSec: 90 })
  );
  const negative = modelledDrive(
    audit,
    encodeFeCO({ angleDeg: 90, velocityDegPerSec: -90 })
  );
  assert.deepEqual(positive, [
    [1, 0.5],
    [2, 0.5],
    [3, 0],
  ]);
  assert.deepEqual(positive, negative);
});
test("audited identities are aligned, unique and separate from downstream groups", () => {
  const audit = JSON.parse(
    readFileSync(
      new URL("../../public/fly-proprioception/audit.json", import.meta.url)
    )
  );
  validateAudit(audit, 165122);
  assert.equal(audit.readout_indices.vnc_intrinsic.length, 13151);
  assert.equal(audit.readout_indices.ascending_neuron.length, 1846);
  assert.throws(() => validateAudit({ ...audit, traced_count: 3 }, 165122));
  assert.throws(() =>
    validateAudit(
      { ...audit, alignment: { ...audit.alignment, dnl: false } },
      165122
    )
  );
  assert.throws(() =>
    validateAudit(
      {
        ...audit,
        readout_indices: {
          ...audit.readout_indices,
          vnc_intrinsic: [audit.feco_candidates[0].index],
        },
      },
      165122
    )
  );
});
test("binary decoder agrees with the existing artifact loader", async () => {
  const { loadConnectome } = await import("../../scripts/fly-shader-load.mjs");
  const raw = readFileSync(
    new URL("../../public/flydoom/malecns_l3_compact.mcns", import.meta.url)
  );
  const decoded = decodeConnectome(
    raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength)
  );
  const original = loadConnectome();
  for (const key of Object.keys(decoded))
    assert.deepEqual(decoded[key], original.connectome[key]);
  const audit = JSON.parse(
    readFileSync(
      new URL("../../public/fly-proprioception/audit.json", import.meta.url)
    )
  );
  assert.equal(original.sha256, audit.artifact_sha256);
});

test("production worker verifies artifact, steps actual graph and fails closed on hash mismatch", async () => {
  const originalSelf = globalThis.self,
    originalFetch = globalThis.fetch;
  const root = new URL("../../public/fly-proprioception/", import.meta.url);
  let handler,
    messages = [],
    corrupt = false;
  globalThis.self = {
    addEventListener: (_event, listener) => {
      handler = listener;
    },
    postMessage: (message) => messages.push(message),
  };
  globalThis.fetch = async (path) => {
    const bytes = readFileSync(new URL(path, root));
    if (corrupt && path === "./audit.json") {
      const audit = JSON.parse(bytes);
      audit.artifact_sha256 = "0".repeat(64);
      return new Response(JSON.stringify(audit));
    }
    return new Response(bytes);
  };
  try {
    await import("../../public/fly-proprioception/neural-worker.js");
    await handler({ data: { type: "init" } });
    assert.equal(messages.at(-1).status, "MODELLED_INPUT / EXPLORATORY");
    for (let i = 1; i <= 3; i++)
      await handler({
        data: { type: "step", time: i / 10, parameters: {}, generation: 1 },
      });
    const frame = messages.at(-1);
    assert.equal(frame.type, "frame");
    assert.equal(frame.steps, 3);
    for (const value of Object.values(frame.activity))
      assert.ok(Number.isFinite(value) && value >= 0);
    await handler({ data: { type: "reset" } });
    await handler({
      data: {
        type: "step",
        time: 0,
        parameters: { center: 20, amplitude: 0 },
        generation: 2,
      },
    });
    assert.deepEqual(messages.at(-1).activity, {
      vnc_intrinsic: 0,
      ascending_neuron: 0,
    });
    assert.equal(messages.at(-1).steps, 1);
    corrupt = true;
    await handler({ data: { type: "init" } });
    assert.equal(messages.at(-1).type, "error");
    assert.match(messages.at(-1).message, /hash mismatch/);
    await handler({ data: { type: "step", time: 1, parameters: {} } });
    assert.match(messages.at(-1).message, /NOT_CONNECTED/);
  } finally {
    globalThis.self = originalSelf;
    globalThis.fetch = originalFetch;
  }
});

test("UI buffers a late neural frame during pause and clears failed readouts", async () => {
  const originals = Object.fromEntries(
    ["document", "Worker", "setTimeout", "clearTimeout"].map((key) => [
      key,
      globalThis[key],
    ])
  );
  const elements = new Map();
  const element = (id) => {
    if (!elements.has(id))
      elements.set(id, {
        value: { center: "90", amplitude: "45", frequency: "0.2" }[id] ?? "",
        textContent: "",
        listeners: {},
        append() {},
        setAttribute() {},
        addEventListener(event, fn) {
          this.listeners[event] = fn;
        },
      });
    return elements.get(id);
  };
  let instance;
  globalThis.document = {
    getElementById: element,
    createElement: () => element(Symbol()),
    addEventListener() {},
    hidden: false,
  };
  globalThis.Worker = class {
    constructor() {
      instance = this;
      this.listeners = {};
      this.messages = [];
    }
    addEventListener(event, fn) {
      this.listeners[event] = fn;
    }
    postMessage(message) {
      this.messages.push(message);
    }
    terminate() {}
    emit(data) {
      this.listeners.message({ data });
    }
  };
  globalThis.setTimeout = () => 1;
  globalThis.clearTimeout = () => {};
  try {
    await import("../../public/fly-proprioception/app.js");
    element("connect").listeners.click();
    instance.emit({ type: "ready", status: "MODELLED_INPUT / EXPLORATORY" });
    element("play").listeners.click();
    const request = instance.messages.at(-1);
    element("play").listeners.click();
    instance.emit({
      type: "frame",
      generation: request.generation,
      time: 0.1,
      steps: 1,
      activity: { vnc_intrinsic: 0.25, ascending_neuron: 0.1 },
    });
    assert.equal(element("time").textContent, "0.00 s");
    assert.equal(element("vnc-activity").textContent, "0.000000");
    element("play").listeners.click();
    assert.equal(element("time").textContent, "0.10 s");
    assert.equal(element("vnc-activity").textContent, "0.250000");
    instance.emit({ type: "error", message: "test failure" });
    assert.equal(element("neural-status").textContent, "NOT_CONNECTED");
    assert.equal(element("vnc-activity").textContent, "—");
    assert.equal(element("ascending-activity").textContent, "—");
    assert.equal(element("neural-steps").textContent, "0");
  } finally {
    Object.assign(globalThis, originals);
  }
});
