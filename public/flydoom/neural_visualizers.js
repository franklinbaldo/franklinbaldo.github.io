/* FlyDoom neural visualization registry.
 * Original browser implementation for franklinbaldo.github.io.
 * Design references: Frankweb33/flybrain-robot-bridge (MIT),
 * snedea/flybrain (MIT), and Jhongdlp/FlyBrain (MIT).
 * Renderers deliberately share one telemetry contract so community
 * visualizations can be added without coupling them to the simulator.
 */
(function () {
  "use strict";

  const renderers = new Map();
  let styleInstalled = false;

  function clamp01(v) {
    v = Number(v) || 0;
    return Math.max(0, Math.min(1, v));
  }

  function normalized(v) {
    v = Number(v) || 0;
    return clamp01(Math.abs(v) > 1 ? Math.tanh(Math.abs(v)) : Math.abs(v));
  }

  function installStyle() {
    if (styleInstalled) return;
    styleInstalled = true;
    const style = document.createElement("style");
    style.textContent = [
      ".fnv{background:#0b0f14;color:#c9d1d9;border:1px solid #30363d;border-radius:8px;overflow:hidden;font:12px ui-monospace,SFMono-Regular,Menlo,monospace}",
      ".fnv-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;background:#161b22;border-bottom:1px solid #30363d}",
      ".fnv-title{font-weight:700;letter-spacing:.04em;color:#e6edf3}",
      ".fnv-select{min-width:150px;background:#21262d;color:#c9d1d9;border:1px solid #30363d;border-radius:6px;padding:5px 7px;font:inherit}",
      ".fnv-canvas-wrap{position:relative;background:#020409;min-height:220px}",
      ".fnv canvas{display:block;width:100%;height:240px}",
      ".fnv-note{display:flex;justify-content:space-between;gap:8px;padding:6px 9px;color:#8b949e;border-top:1px solid #21262d;font-size:10px;line-height:1.35}",
      ".fnv-note b{color:#58a6ff;font-weight:600}",
      "@media(max-width:620px){.fnv canvas{height:210px}.fnv-head{align-items:flex-start;flex-direction:column}.fnv-select{width:100%}}"
    ].join("");
    document.head.appendChild(style);
  }

  function resizeCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(240, Math.floor(rect.width * dpr));
    const h = Math.max(180, Math.floor((rect.height || 240) * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    return { w: canvas.width, h: canvas.height, dpr: dpr };
  }

  function clear(ctx, w, h) {
    ctx.fillStyle = "#020409";
    ctx.fillRect(0, 0, w, h);
  }

  function hash01(i, salt) {
    let x = (i + 1) * 2654435761 ^ (salt * 2246822519);
    x ^= x >>> 16;
    x = Math.imul(x, 2246822519);
    x ^= x >>> 13;
    return ((x >>> 0) % 100000) / 100000;
  }

  function cloudPoint(i, w, h) {
    const side = i & 1 ? 1 : -1;
    const r1 = hash01(i, 11);
    const r2 = hash01(i, 37);
    const r3 = hash01(i, 71);
    if (r3 < 0.14) {
      return {
        x: w * (0.5 + (r1 - 0.5) * 0.18),
        y: h * (0.58 + r2 * 0.34)
      };
    }
    const cx = w * (0.5 + side * 0.22);
    const cy = h * 0.42;
    const angle = r1 * Math.PI * 2;
    const rad = Math.sqrt(r2);
    return {
      x: cx + Math.cos(angle) * rad * w * 0.22,
      y: cy + Math.sin(angle) * rad * h * 0.32
    };
  }

  function drawCloud(ctx, state, w, h) {
    clear(ctx, w, h);
    const a = state.activity || [];
    const count = Math.min(a.length || 0, 1800);
    if (!count) {
      ctx.fillStyle = "#8b949e";
      ctx.font = Math.max(12, w / 42) + "px ui-monospace, monospace";
      ctx.fillText("waiting for neural telemetry…", 18, 30);
      return;
    }
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < count; i++) {
      const src = Math.floor((i / count) * a.length);
      const v = normalized(a[src]);
      const p = cloudPoint(i, w, h);
      const alpha = 0.08 + v * 0.92;
      const radius = 0.8 + v * 3.2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(120,190,255," + alpha.toFixed(3) + ")";
      ctx.fill();
      if (v > 0.72) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 2.8, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255," + ((v - 0.7) * 0.32).toFixed(3) + ")";
        ctx.fill();
      }
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "rgba(139,148,158,.35)";
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.58);
    ctx.lineTo(w * 0.5, h * 0.94);
    ctx.stroke();
  }

  function makeRaster() {
    const rows = 72;
    const cols = 150;
    const history = Array.from({ length: cols }, function () {
      return new Float32Array(rows);
    });
    let cursor = 0;
    return function drawRaster(ctx, state, w, h) {
      const a = state.activity || [];
      if (a.length) {
        const col = history[cursor];
        for (let r = 0; r < rows; r++) {
          const src = Math.min(a.length - 1, Math.floor((r / rows) * a.length));
          col[r] = normalized(a[src]);
        }
        cursor = (cursor + 1) % cols;
      }
      clear(ctx, w, h);
      const cw = w / cols;
      const rh = h / rows;
      for (let x = 0; x < cols; x++) {
        const c = history[(cursor + x) % cols];
        for (let y = 0; y < rows; y++) {
          const v = c[y];
          if (v < 0.05) continue;
          ctx.fillStyle = "rgba(88,166,255," + (0.08 + v * 0.92).toFixed(3) + ")";
          ctx.fillRect(x * cw, y * rh, Math.ceil(cw), Math.ceil(rh));
        }
      }
      ctx.fillStyle = "rgba(201,209,217,.65)";
      ctx.fillRect(w - 1, 0, 1, h);
    };
  }

  function drawBars(ctx, state, w, h) {
    clear(ctx, w, h);
    let entries = [];
    if (state.channels && state.channels.length) {
      entries = state.channels.slice(0, 16).map(function (x, i) {
        return { label: x.label || ("ch " + (i + 1)), value: Number(x.value) || 0 };
      });
    } else {
      const a = state.activity || [];
      const n = Math.min(16, a.length);
      for (let i = 0; i < n; i++) {
        const idx = Math.floor((i / Math.max(1, n)) * a.length);
        entries.push({ label: "unit " + idx, value: Number(a[idx]) || 0 });
      }
    }
    if (!entries.length) return;
    const pad = 12;
    const labelW = Math.min(110, w * 0.3);
    const rowH = (h - pad * 2) / entries.length;
    ctx.font = Math.max(9, Math.min(12, rowH * 0.55)) + "px ui-monospace, monospace";
    entries.forEach(function (e, i) {
      const y = pad + i * rowH;
      const v = Math.max(-1, Math.min(1, e.value));
      ctx.fillStyle = "#8b949e";
      ctx.fillText(e.label, pad, y + rowH * 0.65);
      const x0 = labelW + pad;
      const bw = w - x0 - pad - 48;
      const mid = x0 + bw / 2;
      ctx.fillStyle = "#161b22";
      ctx.fillRect(x0, y + rowH * 0.2, bw, Math.max(3, rowH * 0.45));
      ctx.fillStyle = v >= 0 ? "#58a6ff" : "#f85149";
      const aw = Math.abs(v) * bw / 2;
      ctx.fillRect(v >= 0 ? mid : mid - aw, y + rowH * 0.2, aw, Math.max(3, rowH * 0.45));
      ctx.fillStyle = "#c9d1d9";
      ctx.textAlign = "right";
      ctx.fillText(v.toFixed(2), w - pad, y + rowH * 0.65);
      ctx.textAlign = "left";
    });
  }

  function drawSensory(ctx, state, w, h) {
    clear(ctx, w, h);
    const a = state.sensory || [];
    const b = state.secondary || [];
    const n = Math.max(a.length, b.length);
    if (!n) return;
    const cols = n <= 32 ? 8 : Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);
    const gap = 4;
    const pad = 10;
    const cw = (w - pad * 2 - gap * (cols - 1)) / cols;
    const rh = (h - pad * 2 - gap * (rows - 1)) / rows;
    for (let i = 0; i < n; i++) {
      const x = pad + (i % cols) * (cw + gap);
      const y = pad + Math.floor(i / cols) * (rh + gap);
      const p = normalized(a[i] || 0);
      const q = normalized(b[i] || 0);
      ctx.fillStyle = "rgba(22,27,34,.95)";
      ctx.fillRect(x, y, cw, rh);
      if (p > 0.01) {
        ctx.fillStyle = "rgba(46,160,67," + (0.18 + p * 0.82).toFixed(3) + ")";
        ctx.fillRect(x, y + rh * (1 - p), cw * 0.5, rh * p);
      }
      if (q > 0.01) {
        ctx.fillStyle = "rgba(188,140,255," + (0.18 + q * 0.82).toFixed(3) + ")";
        ctx.fillRect(x + cw * 0.5, y + rh * (1 - q), cw * 0.5, rh * q);
      }
    }
  }

  register("cloud", "Activity cloud", drawCloud, "topological live cloud · not anatomical geometry");
  register("raster", "Spike raster", makeRaster(), "sampled units × time");
  register("bars", "Populations", drawBars, "Frank-style signal → activity view");
  register("sensory", "Sensory field", drawSensory, "green=input · violet=secondary/error");

  function register(id, label, draw, description) {
    renderers.set(id, { id: id, label: label, draw: draw, description: description || "" });
  }

  function mount(host, options) {
    if (!host) return null;
    installStyle();
    options = options || {};
    host.classList.add("fnv");
    host.innerHTML = "";

    const head = document.createElement("div");
    head.className = "fnv-head";
    const title = document.createElement("span");
    title.className = "fnv-title";
    title.textContent = options.title || "NEURAL ACTIVITY";
    const select = document.createElement("select");
    select.className = "fnv-select";
    select.setAttribute("aria-label", "Neural visualization");
    head.appendChild(title);
    head.appendChild(select);

    const wrap = document.createElement("div");
    wrap.className = "fnv-canvas-wrap";
    const canvas = document.createElement("canvas");
    wrap.appendChild(canvas);

    const note = document.createElement("div");
    note.className = "fnv-note";
    const desc = document.createElement("span");
    const stats = document.createElement("b");
    note.appendChild(desc);
    note.appendChild(stats);

    host.appendChild(head);
    host.appendChild(wrap);
    host.appendChild(note);

    renderers.forEach(function (r) {
      const opt = document.createElement("option");
      opt.value = r.id;
      opt.textContent = r.label;
      select.appendChild(opt);
    });

    const key = options.storageKey || "fly-neural-viz";
    const requested = options.defaultMode || "cloud";
    const stored = localStorage.getItem(key);
    select.value = renderers.has(stored) ? stored : requested;
    if (!renderers.has(select.value)) select.value = "cloud";

    const state = { activity: [], sensory: [], secondary: [], channels: [], meta: {} };
    let dirty = true;
    let raf = 0;
    const ctx = canvas.getContext("2d", { alpha: false });

    function draw() {
      raf = 0;
      if (!dirty || !ctx) return;
      dirty = false;
      const size = resizeCanvas(canvas);
      const renderer = renderers.get(select.value) || renderers.get("cloud");
      renderer.draw(ctx, state, size.w, size.h);
      desc.textContent = renderer.description;
      const n = state.activity ? state.activity.length : 0;
      const hz = state.meta && state.meta.hz ? " · " + Number(state.meta.hz).toFixed(1) + " Hz" : "";
      stats.textContent = (n ? n.toLocaleString() + " units" : "telemetry") + hz;
    }

    function schedule() {
      dirty = true;
      if (!raf) raf = requestAnimationFrame(draw);
    }

    select.addEventListener("change", function () {
      localStorage.setItem(key, select.value);
      schedule();
    });

    const ro = new ResizeObserver(schedule);
    ro.observe(host);

    schedule();

    return {
      update: function (next) {
        next = next || {};
        if (next.activity) state.activity = Float32Array.from(next.activity);
        if (next.sensory) state.sensory = Float32Array.from(next.sensory);
        if (next.secondary) state.secondary = Float32Array.from(next.secondary);
        if (next.channels) state.channels = next.channels.map(function (x) {
          return { label: x.label, value: x.value };
        });
        if (next.meta) state.meta = Object.assign({}, next.meta);
        schedule();
      },
      setMode: function (id) {
        if (!renderers.has(id)) return false;
        select.value = id;
        localStorage.setItem(key, id);
        schedule();
        return true;
      },
      destroy: function () {
        ro.disconnect();
        if (raf) cancelAnimationFrame(raf);
        host.innerHTML = "";
      }
    };
  }

  window.FlyNeuralViz = {
    register: register,
    mount: mount,
    modes: function () {
      return Array.from(renderers.values()).map(function (r) {
        return { id: r.id, label: r.label, description: r.description };
      });
    }
  };
})();