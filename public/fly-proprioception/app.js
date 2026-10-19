// Worker postMessage has no targetOrigin parameter.
/* eslint-disable unicorn/require-post-message-target-origin */
import { createScene } from "./scene.js";
import { CHANNELS, passiveState, encodeFeCO } from "./model.js";
const $ = (id) => document.getElementById(id);
const labels = [
  "Claw · flexão",
  "Claw · extensão",
  "Hook · flexão",
  "Hook · extensão",
  "Club · movimento",
];
for (const [i, channel] of CHANNELS.entries()) {
  const row = document.createElement("div");
  row.className = "channel";
  const label = document.createElement("label");
  label.htmlFor = channel;
  label.textContent = labels[i];
  const output = document.createElement("span");
  output.id = `${channel}-value`;
  label.append(output);
  const meter = document.createElement("meter");
  meter.id = channel;
  meter.min = 0;
  meter.max = 1;
  meter.value = 0;
  row.append(label, meter);
  $("channels").append(row);
}
let time = 0,
  playing = false,
  timer = null,
  worker = null,
  connected = false,
  generation = 0,
  pending = false,
  bufferedFrame = null;
const readParameters = () =>
  Object.fromEntries(
    ["center", "amplitude", "frequency"].map((id) => [id, Number($(id).value)])
  );
let neuralActivity = null;
const appearanceDefaults = {
  "scene-mode": "inspection",
  "scene-curvature": "0.35",
  "scene-roughness": "0.35",
  "scene-light": "35",
  "scene-detail": "0.3",
  "scene-palette": "teal",
};
const readAppearance = () => ({
  mode: $("scene-mode").value,
  curvature: Number($("scene-curvature").value),
  roughness: Number($("scene-roughness").value),
  lightAzimuth: Number($("scene-light").value),
  surfaceDetail: Number($("scene-detail").value),
  palette: $("scene-palette").value,
});
const scene = createScene($("body-scene"), {
  onStatus: ({ state, message }) => {
    $("body-scene").hidden = state !== "ready";
    $("scene-fallback").hidden = state === "ready";
    $("scene-status").textContent = message;
  },
});
function render() {
  const parameters = Object.fromEntries(
    ["center", "amplitude", "frequency"].map((id) => [id, Number($(id).value)])
  );
  $("center-value").value = `${parameters.center}°`;
  $("amplitude-value").value = `${parameters.amplitude}°`;
  $("frequency-value").value = `${parameters.frequency.toFixed(2)} Hz`;
  const state = passiveState(time, parameters),
    signals = encodeFeCO(state);
  $("angle").textContent = `${state.angleDeg.toFixed(1)}°`;
  $("velocity").textContent = `${state.velocityDegPerSec.toFixed(1)}°/s`;
  $("time").textContent = `${time.toFixed(2)} s`;
  $("scene-angle").textContent = `${state.angleDeg.toFixed(1)}°`;
  $("fallback-tibia").setAttribute(
    "x2",
    320 - 170 * Math.cos((state.angleDeg * Math.PI) / 180)
  );
  $("fallback-tibia").setAttribute(
    "y2",
    140 + 170 * Math.sin((state.angleDeg * Math.PI) / 180)
  );
  for (const [id, suffix] of [
    ["scene-curvature", ""],
    ["scene-roughness", ""],
    ["scene-light", "°"],
    ["scene-detail", ""],
  ])
    $(`${id}-value`).value =
      `${Number($(id).value).toFixed(suffix ? 0 : 2)}${suffix}`;
  scene?.render({ ...state, neuralActivity }, readAppearance());
  const angle = (state.angleDeg * Math.PI) / 180;
  $("tibia").setAttribute("x2", 160 - 120 * Math.cos(angle));
  $("tibia").setAttribute("y2", 100 + 120 * Math.sin(angle));
  for (const channel of CHANNELS) {
    $(channel).value = signals[channel];
    $(`${channel}-value`).textContent = signals[channel].toFixed(2);
  }
}
function pause() {
  clearTimeout(timer);
  playing = false;

  $("play").textContent = "Iniciar movimento";
  $("play").setAttribute("aria-pressed", "false");
  $("motion-status").textContent = "Em pausa";
}
function tick() {
  if (!playing || pending) return;
  if (connected) {
    pending = true;
    worker.postMessage({
      type: "step",
      time: time + 0.1,
      parameters: readParameters(),
      silenced: $("silenced").checked,
      generation,
    });
  } else {
    time += 0.1;
    render();
    timer = setTimeout(tick, 100);
  }
}
function reset() {
  pause();
  generation++;
  pending = false;
  bufferedFrame = null;
  time = 0;
  neuralActivity = connected ? 0 : null;
  worker?.postMessage({ type: "reset" });
  $("vnc-activity").textContent = connected ? "0.000000" : "—";
  $("ascending-activity").textContent = connected ? "0.000000" : "—";
  $("neural-steps").textContent = "0";
  render();
}
function applyFrame(data) {
  neuralActivity = data.activity.vnc_intrinsic;
  time = data.time;
  $("vnc-activity").textContent = data.activity.vnc_intrinsic.toFixed(6);
  $("ascending-activity").textContent =
    data.activity.ascending_neuron.toFixed(6);
  $("neural-steps").textContent = String(data.steps);
  render();
}
$("connect").addEventListener("click", () => {
  reset();
  $("connect").disabled = true;
  $("neural-status").textContent = "VERIFYING";
  $("neural-detail").textContent =
    "Verificando hash do artefato e identidades antes de conectar…";
  try {
    worker = new Worker(new URL("./neural-worker.js", import.meta.url), {
      type: "module",
    });
  } catch {
    $("neural-status").textContent = "NOT_CONNECTED";
    $("neural-detail").textContent =
      "Este navegador não iniciou o worker. A articulação e o encoder continuam disponíveis.";
    $("connect").disabled = false;
    return;
  }
  const activeWorker = worker;
  const fail = (message) => {
    if (worker !== activeWorker) return;
    pause();
    connected = false;
    pending = false;
    bufferedFrame = null;
    worker.terminate();
    worker = null;
    neuralActivity = null;
    render();
    $("vnc-activity").textContent = "—";
    $("ascending-activity").textContent = "—";
    $("neural-steps").textContent = "0";
    $("neural-status").textContent = "NOT_CONNECTED";
    $("neural-detail").textContent = `Modelo indisponível: ${message}`;
    $("connect").disabled = false;
  };
  worker.addEventListener("error", () => fail("falha no worker"));
  worker.addEventListener("message", ({ data }) => {
    if (worker !== activeWorker) return;
    if (data.type === "ready") {
      connected = true;
      reset();
      $("neural-status").textContent = data.status;
      $("neural-detail").textContent =
        "33 aferentes identificados (MetaLN, direita). Grafo verificado. Inicie o movimento para propagar entrada artificial; um passo recorrente a cada 0,1 s de demonstração, sem equivalência temporal fisiológica.";
    } else if (data.type === "error") fail(data.message);
    else if (data.type === "frame" && data.generation === generation) {
      pending = false;
      if (!playing) {
        bufferedFrame = data;
        return;
      }
      applyFrame(data);
      if (playing) timer = setTimeout(tick, 100);
    }
  });
  worker.postMessage({ type: "init" });
});
$("play").addEventListener("click", () => {
  if (playing) return pause();
  playing = true;
  $("play").textContent = "Pausar movimento";
  $("play").setAttribute("aria-pressed", "true");
  $("motion-status").textContent = "Movimento passivo";
  if (bufferedFrame) {
    applyFrame(bufferedFrame);
    bufferedFrame = null;
    timer = setTimeout(tick, 100);
  } else tick();
});
$("reset").addEventListener("click", reset);
for (const id of ["center", "amplitude", "frequency", "silenced"])
  $(id).addEventListener("input", reset);
for (const id of Object.keys(appearanceDefaults))
  $(id).addEventListener("input", render);
$("scene-reset").addEventListener("click", () => {
  for (const [id, value] of Object.entries(appearanceDefaults))
    $(id).value = value;
  render();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
});
render();
