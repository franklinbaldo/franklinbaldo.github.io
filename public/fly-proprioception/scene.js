import { vertexSource, fragmentSource } from "./scene-shaders.js";

// Display-only gain on real mean absolute VNC activity. Never fed into the model.
export const NEURAL_DISPLAY_GAIN = 1000;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const finite = (x, fallback) => (Number.isFinite(x) ? x : fallback);
const palettes = {
  teal: [0.12, 0.64, 0.64],
  amber: [0.88, 0.43, 0.13],
  violet: [0.48, 0.31, 0.79],
};

// Pure geometry contract, matching the shader. The angle is the included angle.
export function jointPose(angleDeg = 90) {
  const angle = (finite(angleDeg, 90) * Math.PI) / 180;
  return {
    hip: [-1.25, 1.65, 0],
    knee: [0, 1.65, 0],
    tip: [-Math.cos(angle) * 1.36, 1.65 - Math.sin(angle) * 1.36, 0],
  };
}
export function normalizeAppearance(appearance = {}) {
  return {
    mode: appearance.mode === "artistic" ? "artistic" : "inspection",
    curvature: clamp(finite(appearance.curvature, 0.45), 0, 1),
    roughness: clamp(finite(appearance.roughness, 0.35), 0, 1),
    lightAzimuth: finite(appearance.lightAzimuth, 55),
    surfaceDetail: clamp(finite(appearance.surfaceDetail, 0.5), 0, 1),
    palette: Object.hasOwn(palettes, appearance.palette)
      ? appearance.palette
      : "teal",
  };
}

/** On-demand WebGL2 scene. onStatus receives {state,message}.
 * States: ready, unavailable, lost, error. Returns null on initialization failure.
 * render(state, appearance): state {angleDeg,velocityDegPerSec,timeSec,neuralActivity:number|null};
 * appearance {mode:'inspection'|'artistic',curvature:0..1,roughness:0..1,
 * lightAzimuth:degrees,palette:'teal'|'amber'|'violet',surfaceDetail:0..1}.
 * Velocity/time are accepted but do not introduce decorative motion.
 */
export function createScene(canvas, { onStatus = () => {} } = {}) {
  let gl,
    program,
    vao,
    uniforms,
    disposed = false,
    lost = false,
    last = null;
  const status = (state, message) => onStatus({ state, message });
  try {
    gl = canvas?.getContext?.("webgl2", {
      alpha: false,
      antialias: false,
      powerPreference: "low-power",
      preserveDrawingBuffer: false,
    });
  } catch {
    gl = null;
  }
  if (!gl) {
    status("unavailable", "WebGL2 indisponível; diagrama 2D ativo");
    return null;
  }
  function release() {
    if (program) gl.deleteProgram(program);
    if (vao) gl.deleteVertexArray(vao);
    program = null;
    vao = null;
  }
  function initialize() {
    const shaders = [];
    try {
      for (const [type, source] of [
        [gl.VERTEX_SHADER, vertexSource],
        [gl.FRAGMENT_SHADER, fragmentSource],
      ]) {
        const shader = gl.createShader(type);
        shaders.push(shader);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
          throw new Error(
            gl.getShaderInfoLog(shader) || "Shader compilation failed"
          );
      }
      program = gl.createProgram();
      for (const shader of shaders) gl.attachShader(program, shader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw new Error(gl.getProgramInfoLog(program) || "Shader link failed");
      vao = gl.createVertexArray();
      uniforms = Object.fromEntries(
        [
          "Resolution",
          "Angle",
          "Curvature",
          "Roughness",
          "Light",
          "Detail",
          "Artistic",
          "Activity",
          "Connected",
          "Palette",
        ].map((name) => [name, gl.getUniformLocation(program, `u${name}`)])
      );
      status("ready", "Cena 3D pronta · geometria esquemática");
      return true;
    } catch (error) {
      release();
      status("error", `Cena 3D indisponível: ${error.message}`);
      return false;
    } finally {
      for (const shader of shaders) if (shader) gl.deleteShader(shader);
    }
  }
  if (!initialize()) return null;
  function render(state = {}, appearance = {}) {
    appearance = normalizeAppearance(appearance);
    last = [{ ...state }, { ...appearance }];
    if (disposed || lost || !program) return;
    const rect = canvas.getBoundingClientRect?.();
    const cssWidth = rect?.width || canvas.clientWidth || 640;
    const cssHeight = rect?.height || canvas.clientHeight || 420;
    const mobile = cssWidth < 600;
    const dpr = Math.min(finite(globalThis.devicePixelRatio, 1), 1.5);
    const scale = Math.min(
      dpr,
      (mobile ? 640 : 900) / cssWidth,
      (mobile ? 420 : 600) / cssHeight
    );
    const width = Math.max(1, Math.round(cssWidth * scale)),
      height = Math.max(1, Math.round(cssHeight * scale));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    gl.viewport(0, 0, width, height);
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.uniform2f(uniforms.Resolution, width, height);
    gl.uniform1f(uniforms.Angle, (finite(state.angleDeg, 90) * Math.PI) / 180);
    gl.uniform1f(
      uniforms.Curvature,
      clamp(finite(appearance.curvature, 0.45), 0, 1)
    );
    gl.uniform1f(
      uniforms.Roughness,
      clamp(finite(appearance.roughness, 0.35), 0, 1)
    );
    gl.uniform1f(
      uniforms.Light,
      (finite(appearance.lightAzimuth, 55) * Math.PI) / 180
    );
    gl.uniform1f(
      uniforms.Detail,
      clamp(finite(appearance.surfaceDetail, 0.5), 0, 1)
    );
    gl.uniform1f(uniforms.Artistic, appearance.mode === "artistic" ? 1 : 0);
    const connected =
      typeof state.neuralActivity === "number" &&
      Number.isFinite(state.neuralActivity);
    gl.uniform1f(uniforms.Connected, connected ? 1 : 0);
    gl.uniform1f(
      uniforms.Activity,
      connected
        ? clamp(Math.abs(state.neuralActivity) * NEURAL_DISPLAY_GAIN, 0, 1)
        : 0
    );
    gl.uniform3fv(
      uniforms.Palette,
      palettes[appearance.palette] || palettes.teal
    );
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  }
  function onLost(event) {
    event.preventDefault();
    lost = true;
    status("lost", "Contexto 3D interrompido; diagrama 2D ativo");
  }
  function onRestored() {
    if (disposed) return;
    lost = false;
    program = null;
    vao = null;
    if (initialize() && last) render(...last);
  }
  canvas.addEventListener?.("webglcontextlost", onLost);
  canvas.addEventListener?.("webglcontextrestored", onRestored);
  const observer =
    typeof globalThis.ResizeObserver === "function"
      ? new globalThis.ResizeObserver(() => {
          if (last) render(...last);
        })
      : null;
  observer?.observe(canvas);
  return {
    render,
    destroy() {
      if (disposed) return;
      disposed = true;
      observer?.disconnect();
      canvas.removeEventListener?.("webglcontextlost", onLost);
      canvas.removeEventListener?.("webglcontextrestored", onRestored);
      if (!lost) release();
      last = null;
    },
  };
}
