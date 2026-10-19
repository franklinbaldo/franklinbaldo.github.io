// Worker postMessage has no targetOrigin parameter.
/* eslint-disable unicorn/require-post-message-target-origin */
import { createBrain, brainStepWithDrive } from "../fly-shader/sim.js";
import { passiveState, encodeFeCO } from "./model.js";
import {
  validateAudit,
  modelledDrive,
  summarizeActivity,
  decodeConnectome,
} from "./adapter.js";
let brain,
  audit,
  steps = 0;
self.addEventListener("message", async ({ data }) => {
  try {
    if (data.type === "init") {
      const [manifest, binary] = await Promise.all([
        fetch("./audit.json"),
        fetch("../flydoom/malecns_l3_compact.mcns"),
      ]);
      if (!manifest.ok || !binary.ok)
        throw new Error("artifact download failed");
      audit = await manifest.json();
      const buffer = await binary.arrayBuffer();
      const digest = [
        ...new Uint8Array(await crypto.subtle.digest("SHA-256", buffer)),
      ]
        .map((n) => n.toString(16).padStart(2, "0"))
        .join("");
      if (digest !== audit.artifact_sha256)
        throw new Error("artifact hash mismatch");
      const graph = decodeConnectome(buffer);
      validateAudit(audit, graph.offsets.length - 1);
      brain = createBrain({ dn_all: [] }, graph);
      self.postMessage({
        type: "ready",
        status: "MODELLED_INPUT / EXPLORATORY",
      });
    } else if (data.type === "reset") {
      if (brain) {
        brain.state.fill(0);
        brain.next.fill(0);
        brain.drive.fill(0);
      }
      steps = 0;
    } else if (data.type === "step") {
      if (!brain) throw new Error("NOT_CONNECTED");
      const state = passiveState(data.time, data.parameters);
      brainStepWithDrive(
        brain,
        data.silenced ? [] : modelledDrive(audit, encodeFeCO(state))
      );
      steps++;
      self.postMessage({
        type: "frame",
        generation: data.generation,
        time: data.time,
        steps,
        activity: summarizeActivity(brain.state, audit.readout_indices),
      });
    }
  } catch (error) {
    brain = null;
    self.postMessage({ type: "error", message: String(error.message) });
  }
});
