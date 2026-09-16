#!/usr/bin/env python3
# Deterministic, one-shot integration helper for FlyDoom PR 1A.
from pathlib import Path

PATH = Path("public/flydoom/index.html")
text = PATH.read_text(encoding="utf-8")

css_anchor = """      #canvasRadar {\n        width: 100%;\n        height: 260px;\n      }\n"""
css_insert = css_anchor + """      #compoundEyeCanvas {\n        width: 100%;\n        height: auto;\n        aspect-ratio: 16/10;\n        background: #05080c;\n      }\n      .retina-note {\n        padding: 7px 10px 9px;\n        color: var(--text-muted);\n        font-size: 0.66rem;\n        line-height: 1.35;\n        border-top: 1px solid var(--border);\n      }\n      #compoundEyeInspector {\n        color: var(--accent);\n        font-family: monospace;\n      }\n"""
if "#compoundEyeCanvas" not in text:
    if css_anchor not in text:
        raise SystemExit("CSS anchor not found")
    text = text.replace(css_anchor, css_insert, 1)

html_anchor = """      <!-- Right Side: 2D Radar & Neuro-Telemetry -->\n      <div style=\"display: flex; flex-direction: column; gap: 12px\">\n        <!-- Radar -->\n"""
html_insert = """      <!-- Right Side: Perception, 2D Radar & Neuro-Telemetry -->\n      <div style=\"display: flex; flex-direction: column; gap: 12px\">\n        <!-- Compound-eye reconstruction -->\n        <div class=\"card\">\n          <div class=\"card-header\">\n            <span>COMPOUND-EYE RECONSTRUCTION</span>\n            <span id=\"compoundEyeInspector\">1,771 MaleCNS columns</span>\n          </div>\n          <div class=\"canvas-container\">\n            <canvas id=\"compoundEyeCanvas\" width=\"480\" height=\"300\"></canvas>\n          </div>\n          <div class=\"retina-note\">\n            Reconstructed Retinotopic Field (1,771 MaleCNS Columns) · Overlay: 32 Active Model Inputs.<br />\n            Biologically grounded reconstruction; highlighted sectors are the actual current encoder channels.\n          </div>\n        </div>\n\n        <!-- Radar -->\n"""
if "id=\"compoundEyeCanvas\"" not in text:
    if html_anchor not in text:
        raise SystemExit("HTML anchor not found")
    text = text.replace(html_anchor, html_insert, 1)

state_anchor = """      let neuralWorker = null;\n      let workerBusy = false;\n      let circuit = null;\n"""
state_insert = state_anchor + """      let retinaHUD = null;\n\n      async function initRetinaHUD() {\n        const canvas = document.getElementById(\"compoundEyeCanvas\");\n        if (!canvas) return;\n        const [{ CompoundEyeHUD }, columns] = await Promise.all([\n          import(\"./retina_hud.js\"),\n          fetch(\"./retinotopic_columns_1771.json\").then((r) => {\n            if (!r.ok) throw new Error(`retina geometry HTTP ${r.status}`);\n            return r.json();\n          }),\n        ]);\n        retinaHUD = new CompoundEyeHUD(canvas, columns);\n        const inspector = document.getElementById(\"compoundEyeInspector\");\n        canvas.addEventListener(\"pointermove\", (event) => {\n          const fly = swarm[selectedFlyIdx] || swarm[0];\n          if (!fly || !retinaHUD || !inspector) return;\n          const hit = retinaHUD.inspect(event.clientX, event.clientY, fly.wallDists, fly.prizeDists);\n          inspector.textContent = `ch ${hit.channel} → ${hit.target} · stim ${hit.stim.toFixed(2)}`;\n        });\n        canvas.addEventListener(\"pointerleave\", () => {\n          if (inspector) inspector.textContent = \"1,771 MaleCNS columns\";\n        });\n      }\n"""
if "async function initRetinaHUD()" not in text:
    if state_anchor not in text:
        raise SystemExit("state anchor not found")
    text = text.replace(state_anchor, state_insert, 1)

render_anchor = """        render3D();\n        renderRadar();\n        updateHUD();\n"""
render_insert = """        render3D();\n        const retinaFly = swarm[selectedFlyIdx] || swarm[0];\n        if (retinaHUD && retinaFly) {\n          retinaHUD.render(retinaFly.wallDists, retinaFly.prizeDists);\n        }\n        renderRadar();\n        updateHUD();\n"""
if "retinaHUD.render(retinaFly.wallDists" not in text:
    if render_anchor not in text:
        raise SystemExit("render anchor not found")
    text = text.replace(render_anchor, render_insert, 1)

load_anchor = """      window.addEventListener(\"DOMContentLoaded\", async () => {\n        await loadFlatBuffersConnectome();\n        requestAnimationFrame(tick);\n      });\n"""
load_insert = """      window.addEventListener(\"DOMContentLoaded\", async () => {\n        await Promise.all([initRetinaHUD(), loadFlatBuffersConnectome()]);\n        requestAnimationFrame(tick);\n      });\n"""
if "Promise.all([initRetinaHUD(), loadFlatBuffersConnectome()])" not in text:
    if load_anchor not in text:
        raise SystemExit("DOMContentLoaded anchor not found")
    text = text.replace(load_anchor, load_insert, 1)

PATH.write_text(text, encoding="utf-8")
print(f"patched {PATH}")
