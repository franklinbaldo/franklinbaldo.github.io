import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const noop = () => {};

const html = readFileSync(
  new URL("../../public/fly-shader/index.html", import.meta.url),
  "utf8"
);

test("fly-shader starts rendering and loading the brain in every readout", async (t) => {
  // Use the actual HTML's IDs and actual app module: a fabricated missing
  // element would hide the startup crash this test is intended to catch.
  for (const mode of ["knobs", "phase", "flight", "world"]) {
    await t.test(mode, async (subtest) => {
      const context = new Proxy(
        {
          createImageData: (width, height) => ({
            data: new Uint8ClampedArray(width * height * 4),
          }),
        },
        { get: (target, key) => target[key] ?? noop }
      );
      const element = () => ({
        value: "knobs",
        width: 960,
        height: 480,
        style: {},
        classList: { toggle: noop, contains: () => false },
        addEventListener: noop,
        append: noop,
        replaceWith: noop,
        getContext: (type) => (type === "webgl" ? null : context),
      });
      const elements = new Map(
        [...html.matchAll(/id="([^"]+)"/g)].map((match) => [
          match[1],
          element(),
        ])
      );
      const frames = [];
      const requests = [];
      const globals = {
        document: {
          getElementById: (id) => elements.get(id) ?? null,
          createElement: element,
          querySelectorAll: () => [],
        },
        location: { search: `?readout=${mode}` },
        requestAnimationFrame: (callback) => frames.push(callback),
        // Stop at the network boundary; no brain simulation or external I/O.
        fetch: (url) => {
          requests.push(url);
          return new Promise(() => {});
        },
      };
      for (const [key, value] of Object.entries(globals)) {
        const original = Object.getOwnPropertyDescriptor(globalThis, key);
        Object.defineProperty(globalThis, key, {
          configurable: true,
          writable: true,
          value,
        });
        subtest.after(() => {
          if (original) Object.defineProperty(globalThis, key, original);
          else delete globalThis[key];
        });
      }
      await import(`../../public/fly-shader/app.js?startup-test=${mode}`);
      assert.equal(elements.get("readoutMode").value, mode);
      assert.ok(elements.get("loopDiagram").textContent.length > 0);
      assert.equal(
        frames.length,
        1,
        "the first animation frame must be scheduled"
      );
      assert.deepEqual(requests, ["../flydoom/malecns_circuit.json"]);
      assert.equal(
        elements.get("statusText").textContent,
        "loading MaleCNS (5 MB)…"
      );
    });
  }
});
