// MaleCNS worker for the fly-shader demo. One instance steps the live brain;
// a second instance (the lab) runs paired counterfactual probes from snapshots
// of the live state without stalling the live loop.

import { brainStep, createBrain, optomotorSweep, pairedProbe } from "./sim.js";

let brain = null;

self.onmessage = (event) => {
  const msg = event.data;

  if (msg.type === "init") {
    const connectome = {
      offsets: new Uint32Array(msg.offsets),
      scales: new Float32Array(msg.scales),
      deltas: new Uint16Array(msg.deltas),
      weights: new Uint8Array(msg.weights),
      lut: new Float32Array(msg.lut),
    };
    brain = createBrain(msg.circuit, connectome);
    self.postMessage({
      type: "ready",
      neurons: brain.neurons,
      descending: msg.circuit.dn_all.length,
    });
    return;
  }

  if (!brain) return;

  if (msg.type === "step") {
    const started = performance.now();
    const dnValues = brainStep(brain, msg.features);
    self.postMessage(
      {
        type: "result",
        dnValues,
        flight: Boolean(msg.flight),
        world: Boolean(msg.world),
        latency: performance.now() - started,
      },
      [dnValues.buffer]
    );
    return;
  }

  if (msg.type === "snapshot") {
    const state = new Float32Array(brain.state);
    self.postMessage({ type: "snapshot", id: msg.id, state }, [state.buffer]);
    return;
  }

  if (msg.type === "probe") {
    const started = performance.now();
    const { response, kickEnergy } = pairedProbe(msg.snapshot, brain, msg.kick);
    self.postMessage({
      type: "probe",
      mode: msg.kick.mode,
      response,
      kickEnergy,
      elapsed: performance.now() - started,
    });
    return;
  }

  if (msg.type === "sweep") {
    const started = performance.now();
    const sweep = optomotorSweep(
      msg.snapshot,
      brain,
      msg.velocities,
      (fraction) => self.postMessage({ type: "sweepProgress", fraction })
    );
    self.postMessage({
      type: "sweep",
      sweep,
      elapsed: performance.now() - started,
    });
  }
};
