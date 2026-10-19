import assert from "node:assert/strict";
import test from "node:test";
import {
  createScene,
  jointPose,
  normalizeAppearance,
  NEURAL_DISPLAY_GAIN,
} from "../../public/fly-proprioception/scene.js";

test("schematic joint preserves the supplied included angle and segment lengths", () => {
  for (const angle of [20, 45, 90, 135, 160]) {
    const { hip, knee, tip } = jointPose(angle);
    const a = hip.map((x, i) => x - knee[i]),
      b = tip.map((x, i) => x - knee[i]);
    assert.ok(Math.abs(Math.hypot(...a) - 1.25) < 1e-10);
    assert.ok(Math.abs(Math.hypot(...b) - 1.36) < 1e-10);
    const measured =
      (Math.acos(
        a.reduce((sum, x, i) => sum + x * b[i], 0) /
          (Math.hypot(...a) * Math.hypot(...b))
      ) *
        180) /
      Math.PI;
    assert.ok(Math.abs(measured - angle) < 1e-8);
  }
  assert.deepEqual(jointPose(NaN), jointPose(90));
});
test("appearance is bounded and contains no physics or neural controls", () => {
  const appearance = normalizeAppearance({
    mode: "invalid",
    curvature: 5,
    roughness: -1,
    surfaceDetail: Infinity,
    palette: "invalid",
  });
  assert.equal(appearance.mode, "inspection");
  assert.equal(appearance.curvature, 1);
  assert.equal(appearance.roughness, 0);
  assert.equal(appearance.palette, "teal");
  assert.ok(!("angleDeg" in appearance));
  assert.ok(!("neuralActivity" in appearance));
});
test("unavailable WebGL leaves an explicit accessible fallback state", () => {
  const states = [];
  assert.equal(
    createScene(
      { getContext: () => null },
      { onStatus: (status) => states.push(status.state) }
    ),
    null
  );
  assert.deepEqual(states, ["unavailable"]);
  assert.equal(createScene(null), null);
});
function fixture(compiles = true) {
  const handlers = {},
    uniforms = {},
    status = [];
  let draws = 0,
    deleted = 0;
  const gl = {
    VERTEX_SHADER: 1,
    FRAGMENT_SHADER: 2,
    COMPILE_STATUS: 3,
    LINK_STATUS: 4,
    TRIANGLES: 5,
    createShader: () => ({}),
    shaderSource() {},
    compileShader() {},
    getShaderParameter: () => compiles,
    getShaderInfoLog: () => "test compile failure",
    deleteShader() {},
    createProgram: () => ({}),
    attachShader() {},
    linkProgram() {},
    getProgramParameter: () => true,
    deleteProgram: () => deleted++,
    createVertexArray: () => ({}),
    deleteVertexArray() {},
    getUniformLocation: (_program, name) => name,
    viewport() {},
    useProgram() {},
    bindVertexArray() {},
    uniform2f: (key, ...v) => (uniforms[key] = v),
    uniform1f: (key, v) => (uniforms[key] = v),
    uniform3fv: (key, v) => (uniforms[key] = v),
    drawArrays: () => draws++,
  };
  const canvas = {
    width: 1,
    height: 1,
    getContext: () => gl,
    getBoundingClientRect: () => ({ width: 2000, height: 1000 }),
    addEventListener: (event, handler) => (handlers[event] = handler),
    removeEventListener: (event) => delete handlers[event],
  };
  const scene = createScene(canvas, { onStatus: (s) => status.push(s.state) });
  return {
    scene,
    canvas,
    handlers,
    uniforms,
    status,
    draws: () => draws,
    deleted: () => deleted,
  };
}
test("rendering caps resolution and keeps missing activity distinct from connected zero", () => {
  const f = fixture();
  f.scene.render({ angleDeg: 90, neuralActivity: null });
  assert.ok(f.canvas.width <= 900 && f.canvas.height <= 600);
  assert.equal(f.uniforms.uAngle, Math.PI / 2);
  assert.equal(f.uniforms.uConnected, 0);
  f.scene.render({ angleDeg: 90, neuralActivity: 0 });
  assert.equal(f.uniforms.uConnected, 1);
  assert.equal(f.uniforms.uActivity, 0);
  f.scene.render({ angleDeg: 90, neuralActivity: 1 / NEURAL_DISPLAY_GAIN });
  assert.equal(f.uniforms.uActivity, 1);
  f.scene.destroy();
  const draws = f.draws();
  f.scene.render({ angleDeg: 20 });
  assert.equal(f.draws(), draws);
});
test("context loss suspends drawing and restoration rerenders the latest pose", () => {
  const f = fixture();
  f.scene.render({ angleDeg: 90 });
  let prevented = false;
  f.handlers.webglcontextlost({ preventDefault: () => (prevented = true) });
  const draws = f.draws();
  f.scene.render({ angleDeg: 45 });
  assert.ok(prevented);
  assert.equal(f.draws(), draws);
  assert.equal(f.status.at(-1), "lost");
  f.handlers.webglcontextrestored();
  assert.equal(f.status.at(-1), "ready");
  assert.equal(f.draws(), draws + 1);
  assert.equal(f.uniforms.uAngle, Math.PI / 4);
  f.scene.destroy();
});
test("shader compile errors fail closed without replacing the diagram", () => {
  const f = fixture(false);
  assert.equal(f.scene, null);
  assert.equal(f.status.at(-1), "error");
  assert.equal(f.draws(), 0);
});
