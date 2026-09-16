#!/usr/bin/env python3
# One-shot integration helper for FlyDoom PR 1B.
from pathlib import Path

PATH = Path("public/flydoom/index.html")
text = PATH.read_text(encoding="utf-8")

css_anchor = """      .meter-val {\n        width: 45px;\n        text-align: right;\n        font-family: monospace;\n        font-size: 0.72rem;\n      }\n"""
css_insert = css_anchor + """      .motor-truth {\n        margin-top: 6px;\n        padding-top: 8px;\n        border-top: 1px solid var(--border);\n      }\n      .motor-truth-title {\n        margin-bottom: 6px;\n        color: var(--text-muted);\n        font-family: monospace;\n        font-size: 0.7rem;\n        font-weight: 600;\n      }\n      .motor-track {\n        flex: 1;\n        height: 9px;\n        background: #21262d;\n        border-radius: 4px;\n        position: relative;\n        overflow: hidden;\n      }\n      .motor-track::before {\n        content: \"\";\n        position: absolute;\n        left: 50%;\n        top: 0;\n        bottom: 0;\n        width: 1px;\n        background: #8b949e;\n        z-index: 2;\n      }\n      .motor-limit {\n        position: absolute;\n        top: 0;\n        bottom: 0;\n        width: 1px;\n        background: rgba(241, 224, 90, 0.65);\n        z-index: 2;\n      }\n      .motor-limit-left { left: 35%; }\n      .motor-limit-right { left: 65%; }\n      .motor-fill {\n        position: absolute;\n        top: 0;\n        bottom: 0;\n        left: 50%;\n        width: 0;\n        background: var(--accent);\n      }\n      .motor-separator {\n        border-top: 1px dashed #30363d;\n        margin: 5px 0;\n      }\n      .odor-drive {\n        color: var(--green);\n        font-family: monospace;\n        font-size: 0.68rem;\n        display: flex;\n        justify-content: space-between;\n        gap: 8px;\n      }\n"""
if ".motor-truth {" not in text:
    if css_anchor not in text:
        raise SystemExit("CSS anchor not found")
    text = text.replace(css_anchor, css_insert, 1)

html_anchor = """            <!-- Motor Steering -->\n            <div class=\"meter-row\">\n              <span class=\"meter-label\">Motor Curva:</span>\n              <div class=\"meter-bar-bg\" style=\"position: relative\">\n                <div\n                  style=\"\n                    position: absolute;\n                    left: 50%;\n                    top: 0;\n                    bottom: 0;\n                    width: 2px;\n                    background: #8b949e;\n                  \"\n                ></div>\n                <div\n                  id=\"barTorque\"\n                  class=\"meter-bar-fill\"\n                  style=\"position: absolute; left: 50%; width: 0%\"\n                ></div>\n              </div>\n              <span class=\"meter-val\" id=\"valTorque\">0.0°</span>\n            </div>\n"""
html_insert = """            <div class=\"odor-drive\">\n              <span>ODOR L ×3.5 <b id=\"valOdorDriveL\">0.000</b></span>\n              <span>ODOR R ×3.5 <b id=\"valOdorDriveR\">0.000</b></span>\n            </div>\n\n            <!-- Motor Truth -->\n            <div class=\"motor-truth\">\n              <div class=\"motor-truth-title\">MOTOR TRUTH · TORQUE DECOMPOSITION</div>\n              <div id=\"motorTruthRows\"></div>\n              <div class=\"retina-note\" style=\"padding: 6px 0 0; border-top: 0\">\n                Yellow ticks mark the physical clamp at ±0.45. Telemetry is observational only.\n              </div>\n            </div>\n"""
if "id=\"motorTruthRows\"" not in text:
    if html_anchor not in text:
        raise SystemExit("Motor HUD anchor not found")
    text = text.replace(html_anchor, html_insert, 1)

worker_anchor = """              results.push({\n                torque: Math.max(-0.45, Math.min(0.45, totalTorque)),\n                thrust: Math.max(0.08, Math.min(0.38, fwdThrust)),\n                meanAct: actTot\n              });\n"""
worker_insert = """              results.push({\n                torque: Math.max(-0.45, Math.min(0.45, totalTorque)),\n                rawTorque: totalTorque,\n                thrust: Math.max(0.08, Math.min(0.38, fwdThrust)),\n                meanAct: actTot,\n                motorTerms: {\n                  connectome: connSteer,\n                  phototaxis: visualSteer,\n                  chemotaxis: odorSteer,\n                  saccade\n                }\n              });\n"""
if "rawTorque: totalTorque" not in text:
    if worker_anchor not in text:
        raise SystemExit("Worker payload anchor not found")
    text = text.replace(worker_anchor, worker_insert, 1)

message_anchor = """                swarm[f].applyMotorCommand(\n                  results[f].torque,\n                  results[f].thrust,\n                  results[f].meanAct\n                );\n"""
message_insert = message_anchor + """                swarm[f].motorTelemetry = results[f];\n"""
if "swarm[f].motorTelemetry = results[f];" not in text:
    if message_anchor not in text:
        raise SystemExit("Worker message anchor not found")
    text = text.replace(message_anchor, message_insert, 1)

ctor_anchor = """          this.currentThrust = 0.2;\n\n          this.resetPosition();\n"""
ctor_insert = """          this.currentThrust = 0.2;\n          this.motorTelemetry = null;\n\n          this.resetPosition();\n"""
if "this.motorTelemetry = null;" not in text:
    if ctor_anchor not in text:
        raise SystemExit("FlyAgent telemetry anchor not found")
    text = text.replace(ctor_anchor, ctor_insert, 1)

hud_anchor = """        document.getElementById(\"valOdorL\").innerText = ppmL + \" ppm\";\n        document.getElementById(\"valOdorR\").innerText = ppmR + \" ppm\";\n"""
hud_insert = hud_anchor + """        document.getElementById(\"valOdorDriveL\").innerText = (activeFly.odorL * 3.5).toFixed(3);\n        document.getElementById(\"valOdorDriveR\").innerText = (activeFly.odorR * 3.5).toFixed(3);\n"""
if "valOdorDriveL" not in text[text.find("function updateHUD()"):]:
    if hud_anchor not in text:
        raise SystemExit("Odor HUD anchor not found")
    text = text.replace(hud_anchor, hud_insert, 1)

torque_block_start = """        const torqueDeg = (activeFly.currentTorque * 180) / Math.PI;\n"""
torque_block_end = """        document.getElementById(\"valTorque\").innerText =\n          (torqueDeg > 0 ? \"+\" : \"\") + torqueDeg.toFixed(1) + \"°\";\n\n"""
if torque_block_start in text:
    start = text.index(torque_block_start)
    end = text.index(torque_block_end, start) + len(torque_block_end)
    text = text[:start] + text[end:]

helper_anchor = """      function updateHUD() {\n"""
helper_code = """      const MOTOR_DISPLAY_RANGE = 1.5;\n      const MOTOR_ROWS = [\n        [\"connectome\", \"CONNECTOME\"],\n        [\"phototaxis\", \"PHOTOTAXIS\"],\n        [\"chemotaxis\", \"CHEMOTAXIS\"],\n        [\"saccade\", \"COLLISION (SACCADE)\"],\n      ];\n\n      function ensureMotorTruthRows() {\n        const root = document.getElementById(\"motorTruthRows\");\n        if (!root || root.childElementCount) return;\n        const rows = [...MOTOR_ROWS, [\"rawTorque\", \"RAW TOTAL\"], [\"torque\", \"CLAMPED OUTPUT\"]];\n        for (const [key, label] of rows) {\n          if (key === \"rawTorque\") {\n            const sep = document.createElement(\"div\");\n            sep.className = \"motor-separator\";\n            root.appendChild(sep);\n          }\n          const row = document.createElement(\"div\");\n          row.className = \"meter-row\";\n          row.innerHTML = `\n            <span class=\"meter-label\">${label}</span>\n            <div class=\"motor-track\">\n              <span class=\"motor-limit motor-limit-left\"></span>\n              <span class=\"motor-limit motor-limit-right\"></span>\n              <span class=\"motor-fill\" id=\"motor-${key}\"></span>\n            </div>\n            <span class=\"meter-val\" id=\"motor-val-${key}\">0.000</span>`;\n          root.appendChild(row);\n        }\n      }\n\n      function setMotorBar(key, value) {\n        const fill = document.getElementById(`motor-${key}`);\n        const valueEl = document.getElementById(`motor-val-${key}`);\n        if (!fill || !valueEl) return;\n        const clipped = Math.max(-MOTOR_DISPLAY_RANGE, Math.min(MOTOR_DISPLAY_RANGE, value));\n        const span = Math.abs(clipped) / MOTOR_DISPLAY_RANGE * 50;\n        fill.style.left = clipped < 0 ? `${50 - span}%` : \"50%\";\n        fill.style.width = `${span}%`;\n        fill.style.background = clipped < 0 ? \"#f85149\" : \"#2ea043\";\n        valueEl.textContent = `${value >= 0 ? \"+\" : \"\"}${value.toFixed(3)}`;\n      }\n\n"""
if "function ensureMotorTruthRows()" not in text:
    if helper_anchor not in text:
        raise SystemExit("updateHUD anchor not found")
    text = text.replace(helper_anchor, helper_code + helper_anchor, 1)

update_anchor = """        const scentBadge = document.getElementById(\"scentStatusBadge\");\n"""
update_insert = """        ensureMotorTruthRows();\n        const telemetry = activeFly.motorTelemetry;\n        if (telemetry?.motorTerms) {\n          for (const [key] of MOTOR_ROWS) setMotorBar(key, telemetry.motorTerms[key] || 0);\n          setMotorBar(\"rawTorque\", telemetry.rawTorque || 0);\n          setMotorBar(\"torque\", telemetry.torque || 0);\n        }\n\n""" + update_anchor
if "const telemetry = activeFly.motorTelemetry;" not in text:
    if update_anchor not in text:
        raise SystemExit("Motor telemetry update anchor not found")
    text = text.replace(update_anchor, update_insert, 1)

PATH.write_text(text, encoding="utf-8")
print(f"patched {PATH}")
