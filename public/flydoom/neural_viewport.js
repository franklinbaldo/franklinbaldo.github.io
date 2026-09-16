import * as THREE from "./vendor/three.module.js";

const BASE_OPACITY = 0.1;
const ACTIVITY_GAIN = 0.85;
const HISTORY_LIMIT = 180;
const RASTER_LIMIT = 80;
const VIEW_STORAGE_KEY = "flydoom.neural-view";

const VIEW_MODES = [
  ["macro3d", "Macro 3D"],
  ["soma3d", "Active somata 3D"],
  ["raster", "Spike / activity raster"],
  ["timeline", "Population timeline"],
  ["top", "Top active neurons"],
  ["flow", "Regional flow"],
];

const REGION_LABELS = {
  0: "other",
  1: "optic",
  2: "central",
  3: "descending",
};

function clamp01(value) {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

function normalizeTelemetry(payload) {
  if (!payload) return null;
  if (payload.macro || payload.neurons || payload.edges) return payload;
  if (
    Number.isFinite(payload.optic) ||
    Number.isFinite(payload.central) ||
    Number.isFinite(payload.descending)
  ) {
    return { macro: payload, neurons: [], edges: [] };
  }
  return payload;
}

export class NeuralViewport {
  constructor(canvas, statusEl = null) {
    this.canvas = canvas;
    this.statusEl = statusEl;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.materials = null;
    this.meshes = null;
    this.somaPoints = null;
    this.available = false;
    this.telemetry = null;
    this.history = [];
    this.rasterRows = [];
    this.mode = this.restoreMode();
    this.twoDCanvas = null;
    this.twoD = null;
    this.selector = null;
    this.helpEl = null;

    this.installViewControls();

    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      this.renderer.setSize(canvas.width, canvas.height, false);

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(
        38,
        canvas.width / canvas.height,
        0.1,
        1000
      );
      this.camera.position.set(0, 0, 8.5);

      this.materials = {
        optic: this.makeMaterial(0x00f0ff),
        central: this.makeMaterial(0xff00aa),
        descending: this.makeMaterial(0x00ff66),
      };

      this.meshes = this.makeScaffoldMeshes();
      for (const mesh of Object.values(this.meshes)) this.scene.add(mesh);

      this.available = true;
      this.applyMode();
      this.render();
    } catch (error) {
      console.warn("NeuralViewport unavailable:", error);
      this.setStatus("NEURAL VIEW UNAVAILABLE");
      this.mode = "timeline";
      this.applyMode();
    }
  }

  restoreMode() {
    try {
      const saved = window.localStorage.getItem(VIEW_STORAGE_KEY);
      return VIEW_MODES.some(([value]) => value === saved) ? saved : "macro3d";
    } catch {
      return "macro3d";
    }
  }

  installViewControls() {
    const container = this.canvas.closest(".canvas-container") || this.canvas.parentElement;
    if (!container) return;

    const toolbar = document.createElement("div");
    toolbar.style.cssText =
      "display:flex;gap:8px;align-items:center;justify-content:space-between;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,.08);font:11px/1.2 ui-monospace,monospace;";

    const label = document.createElement("span");
    label.textContent = "VIEW";
    label.style.opacity = "0.7";

    this.selector = document.createElement("select");
    this.selector.setAttribute("aria-label", "Neural visualization mode");
    this.selector.style.cssText =
      "max-width:230px;background:#0d1117;color:#c9d1d9;border:1px solid #30363d;border-radius:4px;padding:3px 6px;font:inherit;";
    for (const [value, text] of VIEW_MODES) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = text;
      this.selector.append(option);
    }
    this.selector.value = this.mode;
    this.selector.addEventListener("change", () => this.setMode(this.selector.value));

    toolbar.append(label, this.selector);
    container.insertBefore(toolbar, this.canvas);

    this.twoDCanvas = document.createElement("canvas");
    this.twoDCanvas.width = this.canvas.width;
    this.twoDCanvas.height = this.canvas.height;
    this.twoDCanvas.style.cssText = this.canvas.style.cssText;
    this.twoDCanvas.style.width = "100%";
    this.twoDCanvas.style.height = "auto";
    this.twoDCanvas.hidden = true;
    this.canvas.insertAdjacentElement("afterend", this.twoDCanvas);
    this.twoD = this.twoDCanvas.getContext("2d");

    this.helpEl = document.createElement("div");
    this.helpEl.style.cssText =
      "padding:5px 8px;border-top:1px solid rgba(255,255,255,.06);color:#8b949e;font:10px/1.35 ui-monospace,monospace;";
    container.append(this.helpEl);
  }

  setMode(mode) {
    if (!VIEW_MODES.some(([value]) => value === mode)) return;
    this.mode = mode;
    if (this.selector) this.selector.value = mode;
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, mode);
    } catch {
      // localStorage is an optional convenience only.
    }
    this.applyMode();
    this.render(this.telemetry);
  }

  applyMode() {
    const isThree = this.mode === "macro3d" || this.mode === "soma3d";
    this.canvas.hidden = !isThree;
    if (this.twoDCanvas) this.twoDCanvas.hidden = isThree;

    const help = {
      macro3d:
        "Schematic macro-regions. Brightness follows measured regional activity when available.",
      soma3d:
        "Real soma coordinates when supplied by telemetry; otherwise no anatomical points are invented.",
      raster:
        "Recent active-neuron rows. Requires sparse neuron activity in the telemetry DTO.",
      timeline:
        "Rolling optic / central / descending activity history.",
      top: "Ranked sparse active neurons with bodyId, region and activity.",
      flow: "Regional contribution matrix derived from telemetry flow/edge summaries when available.",
    };
    if (this.helpEl) this.helpEl.textContent = help[this.mode] || "";
    this.setStatus(`VIEW · ${this.mode.toUpperCase()}`);
  }

  makeMaterial(color) {
    return new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: BASE_OPACITY,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      wireframe: true,
    });
  }

  makeScaffoldMeshes() {
    const opticGeometry = new THREE.SphereGeometry(1.25, 16, 10);
    const centralGeometry = new THREE.SphereGeometry(1.55, 18, 12);
    const descendingGeometry = new THREE.CapsuleGeometry(0.32, 2.7, 8, 12);

    const opticLeft = new THREE.Mesh(opticGeometry, this.materials.optic);
    opticLeft.scale.set(0.55, 1.0, 0.8);
    opticLeft.position.x = -2.05;

    const opticRight = opticLeft.clone();
    opticRight.position.x = 2.05;

    const opticGroup = new THREE.Group();
    opticGroup.add(opticLeft, opticRight);

    const central = new THREE.Mesh(centralGeometry, this.materials.central);
    central.scale.set(1.25, 0.82, 0.72);

    const descending = new THREE.Mesh(
      descendingGeometry,
      this.materials.descending
    );
    descending.rotation.z = Math.PI;
    descending.position.y = -2.3;

    return { optic: opticGroup, central, descending };
  }

  setStatus(text) {
    if (this.statusEl) this.statusEl.textContent = text;
  }

  update(payload) {
    const telemetry = normalizeTelemetry(payload);
    if (!telemetry) return;
    this.telemetry = telemetry;

    const macro = telemetry.macro || null;
    if (macro) {
      this.history.push({
        tick: telemetry.tick ?? this.history.length,
        optic: clamp01(macro.optic),
        central: clamp01(macro.central),
        descending: clamp01(macro.descending),
      });
      if (this.history.length > HISTORY_LIMIT) this.history.shift();

      if (this.materials) {
        for (const key of ["optic", "central", "descending"]) {
          this.materials[key].opacity =
            BASE_OPACITY + clamp01(macro[key]) * ACTIVITY_GAIN;
        }
      }
    }

    const neurons = Array.isArray(telemetry.neurons) ? telemetry.neurons : [];
    if (neurons.length) {
      this.rasterRows.push({
        tick: telemetry.tick ?? this.rasterRows.length,
        neurons: neurons.slice(0, 128),
      });
      if (this.rasterRows.length > RASTER_LIMIT) this.rasterRows.shift();
    }
  }

  render(payload = null) {
    if (payload) this.update(payload);

    if (this.mode === "macro3d") {
      if (!this.available) return;
      this.setMacroVisibility(true);
      this.clearSomaPoints();
      this.renderer.render(this.scene, this.camera);
      this.setStatus(this.telemetry?.macro ? "LIVE · MACRO 3D" : "SCHEMATIC · MACRO 3D");
      return;
    }

    if (this.mode === "soma3d") {
      if (!this.available) return;
      this.setMacroVisibility(true);
      this.renderSomata3D();
      this.renderer.render(this.scene, this.camera);
      return;
    }

    if (!this.twoD) return;
    if (this.mode === "raster") this.renderRaster();
    else if (this.mode === "timeline") this.renderTimeline();
    else if (this.mode === "top") this.renderTopNeurons();
    else if (this.mode === "flow") this.renderFlow();
  }

  setMacroVisibility(visible) {
    for (const mesh of Object.values(this.meshes || {})) mesh.visible = visible;
  }

  clearSomaPoints() {
    if (!this.somaPoints) return;
    this.scene.remove(this.somaPoints);
    this.somaPoints.geometry.dispose();
    this.somaPoints.material.dispose();
    this.somaPoints = null;
  }

  renderSomata3D() {
    this.clearSomaPoints();
    const neurons = Array.isArray(this.telemetry?.neurons)
      ? this.telemetry.neurons
      : [];
    const positioned = neurons.filter(
      (n) => Number.isFinite(n.x) && Number.isFinite(n.y) && Number.isFinite(n.z)
    );

    if (!positioned.length) {
      this.setStatus("SOMATA 3D · WAITING FOR XYZ");
      return;
    }

    const coords = new Float32Array(positioned.length * 3);
    let maxAbs = 1;
    for (const neuron of positioned) {
      maxAbs = Math.max(maxAbs, Math.abs(neuron.x), Math.abs(neuron.y), Math.abs(neuron.z));
    }
    const scale = 3.2 / maxAbs;
    positioned.forEach((neuron, index) => {
      coords[index * 3] = neuron.x * scale;
      coords[index * 3 + 1] = neuron.y * scale;
      coords[index * 3 + 2] = neuron.z * scale;
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(coords, 3));
    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.09,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.somaPoints = new THREE.Points(geometry, material);
    this.scene.add(this.somaPoints);
    this.setStatus(`LIVE · ${positioned.length} ACTIVE SOMATA`);
  }

  clear2D(title, subtitle = "") {
    const ctx = this.twoD;
    const { width, height } = this.twoDCanvas;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#05080d";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#c9d1d9";
    ctx.font = "12px ui-monospace, monospace";
    ctx.fillText(title, 12, 20);
    if (subtitle) {
      ctx.fillStyle = "#6e7681";
      ctx.font = "10px ui-monospace, monospace";
      ctx.fillText(subtitle, 12, 36);
    }
  }

  renderTimeline() {
    this.clear2D("POPULATION ACTIVITY", "rolling normalized macro activity");
    const ctx = this.twoD;
    const { width, height } = this.twoDCanvas;
    if (this.history.length < 2) {
      this.drawWaiting("Waiting for macro telemetry");
      this.setStatus("TIMELINE · WAITING FOR MACRO");
      return;
    }

    const series = [
      ["optic", "#00f0ff"],
      ["central", "#ff00aa"],
      ["descending", "#00ff66"],
    ];
    const left = 12;
    const top = 52;
    const chartW = width - 24;
    const chartH = height - 78;

    ctx.strokeStyle = "#21262d";
    ctx.lineWidth = 1;
    for (let y = 0; y <= 4; y++) {
      const py = top + (chartH * y) / 4;
      ctx.beginPath();
      ctx.moveTo(left, py);
      ctx.lineTo(left + chartW, py);
      ctx.stroke();
    }

    for (const [key, color] of series) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      this.history.forEach((sample, index) => {
        const x = left + (chartW * index) / Math.max(1, this.history.length - 1);
        const y = top + chartH * (1 - sample[key]);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    ctx.font = "10px ui-monospace, monospace";
    let x = 12;
    for (const [key, color] of series) {
      ctx.fillStyle = color;
      ctx.fillText(key, x, height - 10);
      x += ctx.measureText(key).width + 18;
    }
    this.setStatus("LIVE · POPULATION TIMELINE");
  }

  renderRaster() {
    this.clear2D("ACTIVE-NEURON RASTER", "sparse top-K activity; one column per recent tick");
    const ctx = this.twoD;
    const { width, height } = this.twoDCanvas;
    if (!this.rasterRows.length) {
      this.drawWaiting("Waiting for sparse neuron telemetry");
      this.setStatus("RASTER · WAITING FOR NEURONS");
      return;
    }

    const all = new Map();
    for (const row of this.rasterRows) {
      for (const neuron of row.neurons) {
        const id = String(neuron.bodyId ?? neuron.index ?? "?");
        const previous = all.get(id) || 0;
        all.set(id, Math.max(previous, Math.abs(neuron.activity || 0)));
      }
    }
    const ids = [...all.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 48)
      .map(([id]) => id);
    const rowIndex = new Map(ids.map((id, index) => [id, index]));
    const left = 72;
    const top = 48;
    const chartW = width - left - 10;
    const chartH = height - top - 12;
    const cellW = chartW / Math.max(1, this.rasterRows.length);
    const cellH = chartH / Math.max(1, ids.length);

    ctx.fillStyle = "#6e7681";
    ctx.font = "8px ui-monospace, monospace";
    ids.forEach((id, index) => {
      if (index % Math.max(1, Math.ceil(ids.length / 12)) === 0) {
        ctx.fillText(id.slice(-9), 4, top + index * cellH + cellH);
      }
    });

    this.rasterRows.forEach((sample, col) => {
      for (const neuron of sample.neurons) {
        const id = String(neuron.bodyId ?? neuron.index ?? "?");
        const row = rowIndex.get(id);
        if (row === undefined) continue;
        const alpha = 0.25 + 0.75 * clamp01(Math.abs(neuron.activity || 0));
        ctx.fillStyle = `rgba(88,166,255,${alpha})`;
        ctx.fillRect(left + col * cellW, top + row * cellH, Math.max(1, cellW), Math.max(1, cellH));
      }
    });
    this.setStatus(`LIVE · RASTER ${ids.length} NEURONS`);
  }

  renderTopNeurons() {
    this.clear2D("TOP ACTIVE NEURONS", "current sparse telemetry snapshot");
    const ctx = this.twoD;
    const neurons = Array.isArray(this.telemetry?.neurons)
      ? [...this.telemetry.neurons]
      : [];
    if (!neurons.length) {
      this.drawWaiting("Waiting for sparse neuron telemetry");
      this.setStatus("TOP-K · WAITING FOR NEURONS");
      return;
    }

    neurons.sort((a, b) => Math.abs(b.activity || 0) - Math.abs(a.activity || 0));
    const shown = neurons.slice(0, 14);
    const max = Math.max(...shown.map((n) => Math.abs(n.activity || 0)), 1e-9);
    ctx.font = "9px ui-monospace, monospace";
    shown.forEach((neuron, index) => {
      const y = 50 + index * 17;
      const id = String(neuron.bodyId ?? neuron.index ?? "?");
      const region = REGION_LABELS[neuron.region] || String(neuron.region ?? "?");
      const value = Math.abs(neuron.activity || 0);
      ctx.fillStyle = "#8b949e";
      ctx.fillText(`${id.slice(-12).padStart(12)} ${region.padEnd(10)}`, 8, y + 9);
      ctx.fillStyle = "#238636";
      ctx.fillRect(190, y + 2, (value / max) * 205, 9);
      ctx.fillStyle = "#c9d1d9";
      ctx.fillText(value.toFixed(3), 402, y + 9);
    });
    this.setStatus(`LIVE · TOP ${shown.length}`);
  }

  renderFlow() {
    this.clear2D("REGIONAL FLOW", "instantaneous weighted-contribution summary");
    const ctx = this.twoD;
    const flow = this.telemetry?.flow || this.telemetry?.regionalFlow || null;
    if (!flow) {
      this.drawWaiting("Waiting for regional flow telemetry");
      this.setStatus("FLOW · WAITING FOR EDGES");
      return;
    }

    const names = ["optic", "central", "descending"];
    const cells = [];
    let max = 0;
    names.forEach((from) => {
      names.forEach((to) => {
        const value = Number(flow?.[from]?.[to] ?? flow?.[`${from}->${to}`] ?? 0) || 0;
        max = Math.max(max, Math.abs(value));
        cells.push({ from, to, value });
      });
    });
    max ||= 1;

    const left = 115;
    const top = 78;
    const size = 62;
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "center";
    names.forEach((name, index) => {
      ctx.fillStyle = "#8b949e";
      ctx.fillText(name, left + index * size + size / 2, top - 12);
      ctx.save();
      ctx.translate(left - 14, top + index * size + size / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(name, 0, 0);
      ctx.restore();
    });

    cells.forEach(({ from, to, value }) => {
      const col = names.indexOf(to);
      const row = names.indexOf(from);
      const alpha = 0.08 + 0.82 * (Math.abs(value) / max);
      ctx.fillStyle = value >= 0 ? `rgba(46,160,67,${alpha})` : `rgba(248,81,73,${alpha})`;
      ctx.fillRect(left + col * size, top + row * size, size - 3, size - 3);
      ctx.fillStyle = "#f0f6fc";
      ctx.fillText(value.toFixed(2), left + col * size + size / 2, top + row * size + size / 2 + 3);
    });
    ctx.textAlign = "start";
    this.setStatus("LIVE · REGIONAL FLOW");
  }

  drawWaiting(message) {
    const ctx = this.twoD;
    const { width, height } = this.twoDCanvas;
    ctx.fillStyle = "#484f58";
    ctx.font = "12px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText(message, width / 2, height / 2);
    ctx.textAlign = "start";
  }

  dispose() {
    this.clearSomaPoints();
    if (this.available) {
      for (const mesh of Object.values(this.meshes || {})) {
        mesh.traverse?.((node) => node.geometry?.dispose?.());
      }
      for (const material of Object.values(this.materials || {})) material.dispose();
      this.renderer.dispose();
    }
    this.available = false;
  }
}
