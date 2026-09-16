#!/usr/bin/env python3
from pathlib import Path

path = Path('public/flydoom/index.html')
text = path.read_text(encoding='utf-8')

css_anchor = '''      .motor-truth-title {\n        margin-bottom: 6px;\n        color: var(--text-muted);\n        font-family: monospace;\n        font-size: 0.7rem;\n        font-weight: 600;\n      }\n'''
css_insert = css_anchor + '''      .motor-truth-summary {\n        display: flex;\n        align-items: center;\n        justify-content: space-between;\n        gap: 8px;\n        margin-bottom: 7px;\n        padding: 6px 7px;\n        border: 1px solid #30363d;\n        border-radius: 6px;\n        background: rgba(255,255,255,0.025);\n        font-family: monospace;\n        font-size: 0.68rem;\n      }\n      .motor-dominant-label {\n        color: var(--text-muted);\n        margin-right: 5px;\n      }\n      .motor-status {\n        border: 1px solid rgba(46,160,67,0.5);\n        color: #3fb950;\n        border-radius: 999px;\n        padding: 2px 6px;\n        font-weight: 700;\n        letter-spacing: .04em;\n      }\n      .motor-status.saturated {\n        border-color: rgba(241,224,90,0.65);\n        color: #f1e05a;\n        background: rgba(241,224,90,0.08);\n      }\n      .motor-direction-scale {\n        display: grid;\n        grid-template-columns: 1fr auto 1fr;\n        gap: 8px;\n        margin: 0 48px 5px 85px;\n        color: #6e7681;\n        font-family: monospace;\n        font-size: 0.58rem;\n      }\n      .motor-direction-scale span:last-child { text-align: right; }\n      .motor-row-dominant .meter-label,\n      .motor-row-dominant .meter-val {\n        color: #fff;\n        font-weight: 700;\n      }\n'''
if '.motor-truth-summary {' not in text:
    if css_anchor not in text:
        raise SystemExit('CSS anchor missing')
    text = text.replace(css_anchor, css_insert, 1)

html_anchor = '''              <div class="motor-truth-title">\n                MOTOR TRUTH · TORQUE DECOMPOSITION\n              </div>\n              <div id="motorTruthRows"></div>\n'''
html_insert = '''              <div class="motor-truth-title">\n                MOTOR TRUTH · TORQUE DECOMPOSITION\n              </div>\n              <div class="motor-truth-summary">\n                <div><span class="motor-dominant-label">DOMINANT</span><b id="motorDominant">—</b></div>\n                <span class="motor-status" id="motorClampStatus">LINEAR</span>\n              </div>\n              <div class="motor-direction-scale"><span>← LEFT</span><span>0</span><span>RIGHT →</span></div>\n              <div id="motorTruthRows"></div>\n'''
if 'id="motorDominant"' not in text:
    if html_anchor not in text:
        raise SystemExit('HTML anchor missing')
    text = text.replace(html_anchor, html_insert, 1)

rows_anchor = '''      const MOTOR_ROWS = [\n        ["connectome", "CONNECTOME"],\n        ["phototaxis", "PHOTOTAXIS"],\n        ["chemotaxis", "CHEMOTAXIS"],\n        ["saccade", "COLLISION (SACCADE)"],\n      ];\n'''
rows_insert = rows_anchor + '''      const MOTOR_COLORS = {\n        connectome: "#58a6ff",\n        phototaxis: "#f1e05a",\n        chemotaxis: "#3fb950",\n        saccade: "#bc8cff",\n        rawTorque: "#c9d1d9",\n        torque: "#ff7b72",\n      };\n'''
if 'const MOTOR_COLORS' not in text:
    if rows_anchor not in text:
        raise SystemExit('MOTOR_ROWS anchor missing')
    text = text.replace(rows_anchor, rows_insert, 1)

row_anchor = '''          const row = document.createElement("div");\n          row.className = "meter-row";\n          row.innerHTML = `\n'''
row_insert = '''          const row = document.createElement("div");\n          row.className = "meter-row";\n          row.dataset.motorKey = key;\n          row.innerHTML = `\n'''
if 'row.dataset.motorKey = key;' not in text:
    if row_anchor not in text:
        raise SystemExit('row anchor missing')
    text = text.replace(row_anchor, row_insert, 1)

color_anchor = '''        fill.style.background = clipped < 0 ? "#f85149" : "#2ea043";\n        valueEl.textContent = `${value >= 0 ? "+" : ""}${value.toFixed(3)}`;\n'''
color_insert = '''        fill.style.background = MOTOR_COLORS[key] || "#58a6ff";\n        valueEl.textContent = `${value >= 0 ? "+" : ""}${value.toFixed(3)}`;\n'''
if color_anchor in text:
    text = text.replace(color_anchor, color_insert, 1)

telemetry_anchor = '''        if (telemetry?.motorTerms) {\n          for (const [key] of MOTOR_ROWS)\n            setMotorBar(key, telemetry.motorTerms[key] || 0);\n          setMotorBar("rawTorque", telemetry.rawTorque || 0);\n          setMotorBar("torque", telemetry.torque || 0);\n        }\n'''
telemetry_insert = '''        if (telemetry?.motorTerms) {\n          for (const [key] of MOTOR_ROWS)\n            setMotorBar(key, telemetry.motorTerms[key] || 0);\n          setMotorBar("rawTorque", telemetry.rawTorque || 0);\n          setMotorBar("torque", telemetry.torque || 0);\n\n          let dominantKey = MOTOR_ROWS[0][0];\n          for (const [key] of MOTOR_ROWS) {\n            if (Math.abs(telemetry.motorTerms[key] || 0) > Math.abs(telemetry.motorTerms[dominantKey] || 0)) dominantKey = key;\n          }\n          const dominantLabel = MOTOR_ROWS.find(([key]) => key === dominantKey)?.[1] || dominantKey;\n          const dominantEl = document.getElementById("motorDominant");\n          if (dominantEl) {\n            const v = telemetry.motorTerms[dominantKey] || 0;\n            dominantEl.textContent = `${dominantLabel} ${v >= 0 ? "→" : "←"} ${Math.abs(v).toFixed(3)}`;\n            dominantEl.style.color = MOTOR_COLORS[dominantKey] || "#fff";\n          }\n          document.querySelectorAll("[data-motor-key]").forEach((row) => {\n            row.classList.toggle("motor-row-dominant", row.dataset.motorKey === dominantKey);\n          });\n          const clampStatus = document.getElementById("motorClampStatus");\n          if (clampStatus) {\n            const saturated = Math.abs(telemetry.rawTorque || 0) > 0.45;\n            clampStatus.textContent = saturated ? "SATURATED" : "LINEAR";\n            clampStatus.classList.toggle("saturated", saturated);\n          }\n        }\n'''
if 'dominantKey = MOTOR_ROWS[0][0]' not in text:
    if telemetry_anchor not in text:
        raise SystemExit('telemetry anchor missing')
    text = text.replace(telemetry_anchor, telemetry_insert, 1)

note_old = '''                Yellow ticks mark the physical clamp at ±0.45. Telemetry is\n                observational only.\n'''
note_new = '''                Colors identify motor sources; direction is encoded spatially. Yellow ticks mark the physical clamp at ±0.45.\n'''
if note_old in text:
    text = text.replace(note_old, note_new, 1)

path.write_text(text, encoding='utf-8')
print('polished', path)
