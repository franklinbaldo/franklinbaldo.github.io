#!/usr/bin/env python3
# one-shot integrator for FlyDoom Phase 2A (rerun 2)
from pathlib import Path

p=Path('public/flydoom/index.html')
s=p.read_text()
card='''        <!-- Radar -->\n        <div class="card">'''
insert='''        <!-- Neural activity viewport (Phase 2A scaffold) -->\n        <div class="card">\n          <div class="card-header">\n            <span>NEURAL ACTIVITY · PHASE 2A</span>\n            <span id="neuralViewportStatus" style="color: var(--text-muted)">INIT</span>\n          </div>\n          <div class="canvas-container">\n            <canvas id="neuralCanvas" width="480" height="300"></canvas>\n          </div>\n          <div class="retina-note">\n            Isolated Three.js viewport. Current geometry is explicitly schematic until MaleCNS-derived macro meshes and population manifests are pinned.\n          </div>\n        </div>\n\n'''+card
if 'id="neuralCanvas"' not in s:
    s=s.replace(card,insert,1)
anchor='''      let retinaHUD = null;\n'''
if 'let neuralViewport = null;' not in s:
    s=s.replace(anchor,anchor+'''      let neuralViewport = null;\n      let neuralMacroActivity = null;\n\n      async function initNeuralViewport() {\n        const canvas = document.getElementById("neuralCanvas");\n        if (!canvas) return;\n        const status = document.getElementById("neuralViewportStatus");\n        try {\n          const { NeuralViewport } = await import("./neural_viewport.js");\n          neuralViewport = new NeuralViewport(canvas, status);\n        } catch (error) {\n          console.warn("NeuralViewport init failed:", error);\n          if (status) status.textContent = "UNAVAILABLE";\n        }\n      }\n\n''',1)
init='''        await Promise.all([initRetinaHUD(), loadFlatBuffersConnectome()]);'''
if init in s:
    s=s.replace(init,'''        await Promise.all([initRetinaHUD(), initNeuralViewport(), loadFlatBuffersConnectome()]);''',1)
render='''        if (retinaHUD && retinaFly) {\n          retinaHUD.render(retinaFly.wallDists, retinaFly.prizeDists);\n        }\n'''
if 'neuralViewport.render' not in s:
    s=s.replace(render,render+'''        if (neuralViewport) neuralViewport.render(neuralMacroActivity);\n''',1)
p.write_text(s)

ig=Path('.prettierignore')
t=ig.read_text() if ig.exists() else ''
line='public/flydoom/vendor/three.module.min.js\n'
if line not in t:
    ig.write_text(t + ('' if t.endswith('\n') or not t else '\n') + line)
