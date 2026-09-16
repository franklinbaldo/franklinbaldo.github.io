#!/usr/bin/env python3
"""Apply the Phase 2A macro-telemetry patch to FlyDoom's inline worker.

This is intentionally a deterministic source transform with exact anchors. It
fails rather than guessing if the surrounding runtime code changes.
"""
from pathlib import Path

PATH = Path("public/flydoom/index.html")
text = PATH.read_text(encoding="utf-8")


def replace_once(old: str, new: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"expected exactly one patch anchor, found {count}: {old[:120]!r}")
    text = text.replace(old, new, 1)


replace_once(
'''              weights: new Uint8Array(msg.weights),
              lut: new Float32Array(msg.lut),
            };

            for (let f = 0; f < 8; f++) {''',
'''              weights: new Uint8Array(msg.weights),
              lut: new Float32Array(msg.lut),
              regionMap: new Uint8Array(msg.regionMap),
              regionCounts: new Uint32Array(4),
            };
            if (connectome.regionMap.length !== connectome.n_neurons) {
              throw new Error(
                `regionMap length ${connectome.regionMap.length} != ${connectome.n_neurons}`
              );
            }
            for (let r = 0; r < connectome.n_neurons; r++) {
              const code = connectome.regionMap[r];
              if (code >= 1 && code <= 3) connectome.regionCounts[code]++;
            }

            for (let f = 0; f < 8; f++) {'''
)

replace_once(
'''            const scales = connectome.scales;

            if (numFlies === 1) {''',
'''            const scales = connectome.scales;
            const regionMap = connectome.regionMap;
            const macroSums = Array.from(
              { length: numFlies },
              () => new Float64Array(4)
            );

            if (numFlies === 1) {'''
)

replace_once(
'''                nx0[r] = 0.65 * s0[r] + 0.35 * Math.tanh(acc0 * scales[r] * 3.5 + drv0[r]);
              }
            } else if (numFlies === 2) {''',
'''                nx0[r] = 0.65 * s0[r] + 0.35 * Math.tanh(acc0 * scales[r] * 3.5 + drv0[r]);
                const region = regionMap[r];
                if (region >= 1 && region <= 3) {
                  macroSums[0][region] += Math.abs(nx0[r]);
                }
              }
            } else if (numFlies === 2) {'''
)

replace_once(
'''                nx0[r] = 0.65 * s0[r] + 0.35 * Math.tanh(acc0 * sc + drv0[r]);
                nx1[r] = 0.65 * s1[r] + 0.35 * Math.tanh(acc1 * sc + drv1[r]);
              }
            } else {''',
'''                nx0[r] = 0.65 * s0[r] + 0.35 * Math.tanh(acc0 * sc + drv0[r]);
                nx1[r] = 0.65 * s1[r] + 0.35 * Math.tanh(acc1 * sc + drv1[r]);
                const region = regionMap[r];
                if (region >= 1 && region <= 3) {
                  macroSums[0][region] += Math.abs(nx0[r]);
                  macroSums[1][region] += Math.abs(nx1[r]);
                }
              }
            } else {'''
)

replace_once(
'''                for (let f = 0; f < numFlies; f++) {
                  nextStates[f][r] = 0.65 * states[f][r] + 0.35 * Math.tanh(SWARM_ACC[f] * sc + drives[f][r]);
                }
              }
            }''',
'''                const region = regionMap[r];
                for (let f = 0; f < numFlies; f++) {
                  nextStates[f][r] = 0.65 * states[f][r] + 0.35 * Math.tanh(SWARM_ACC[f] * sc + drives[f][r]);
                  if (region >= 1 && region <= 3) {
                    macroSums[f][region] += Math.abs(nextStates[f][r]);
                  }
                }
              }
            }'''
)

replace_once(
'''            const stepLatency = performance.now() - t0;
            self.postMessage({ type: "stepResult", results, stepLatency });''',
'''            const selected = Math.max(
              0,
              Math.min(numFlies - 1, Number(msg.selectedFlyIdx) || 0)
            );
            const counts = connectome.regionCounts;
            const sums = macroSums[selected];
            const macroActivity = {
              optic: counts[1] ? sums[1] / counts[1] : 0,
              central: counts[2] ? sums[2] / counts[2] : 0,
              descending: counts[3] ? sums[3] / counts[3] : 0,
            };
            const stepLatency = performance.now() - t0;
            self.postMessage({
              type: "stepResult",
              results,
              stepLatency,
              macroActivity,
            });'''
)

replace_once(
'''        const binRes = await fetch("malecns_l3_compact.mcns");
        const arrayBuf = await binRes.arrayBuffer();''',
'''        const [binRes, regionRes] = await Promise.all([
          fetch("malecns_l3_compact.mcns"),
          fetch("data/region_map.bin"),
        ]);
        if (!binRes.ok) throw new Error(`MCNS HTTP ${binRes.status}`);
        if (!regionRes.ok) throw new Error(`region_map HTTP ${regionRes.status}`);
        const [arrayBuf, regionBuf] = await Promise.all([
          binRes.arrayBuffer(),
          regionRes.arrayBuffer(),
        ]);'''
)

replace_once(
'''        const lut = getVector(9, 4, Float32Array);

        // Create inline Web Worker''',
'''        const lut = getVector(9, 4, Float32Array);
        const regionMap = new Uint8Array(regionBuf);
        if (regionMap.length !== offsets.length - 1) {
          throw new Error(
            `region_map length ${regionMap.length} != runtime neurons ${offsets.length - 1}`
          );
        }

        // Create inline Web Worker'''
)

replace_once(
'''          } else if (msg.type === "stepResult") {
            workerBusy = false;
            liveLatency = msg.stepLatency;
            const results = msg.results;''',
'''          } else if (msg.type === "stepResult") {
            workerBusy = false;
            liveLatency = msg.stepLatency;
            if (msg.macroActivity && neuralViewport) {
              neuralViewport.ingest({ macroActivity: msg.macroActivity });
            }
            const results = msg.results;'''
)

replace_once(
'''          lut: lut.buffer.slice(
            lut.byteOffset,
            lut.byteOffset + lut.byteLength
          ),
        });''',
'''          lut: lut.buffer.slice(
            lut.byteOffset,
            lut.byteOffset + lut.byteLength
          ),
          regionMap: regionMap.buffer.slice(
            regionMap.byteOffset,
            regionMap.byteOffset + regionMap.byteLength
          ),
        });'''
)

replace_once(
'''        if (neuralViewport) neuralViewport.render(neuralMacroActivity);''',
'''        if (neuralViewport) neuralViewport.render();'''
)

# The step request has a stable payload anchor in the animation loop.
replace_once(
'''            neuralWorker.postMessage({
              type: "step",
              numFlies: swarm.length,
              flies: fliesData,
            });''',
'''            neuralWorker.postMessage({
              type: "step",
              numFlies: swarm.length,
              selectedFlyIdx,
              flies: fliesData,
            });'''
)

PATH.write_text(text, encoding="utf-8")
print("FlyDoom Phase 2A macro runtime patch applied")
