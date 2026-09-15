#!/usr/bin/env bash
set -euo pipefail

BASE="$(cd "$(dirname "${BASH_SOURCE[0]}")/../malecns-visual-attractor" && pwd)/kaggle.sh"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

python3 - "$BASE" "$TMP" <<'PY'
from pathlib import Path
import sys

src = Path(sys.argv[1]).read_text(encoding="utf-8")
start = src.index("run(\n    sys.executable,\n    visual_exp / \"scripts/run_visual_efficiency_curriculum.py\"")
end = src.index("\n\nsummary = json.loads", start)
replacement = '''run(
    sys.executable,
    visual_exp / "scripts/run_swarm_capacity_probe.py",
    "--graph", graph,
    "--interface", interface,
    "--screen-geometry", screen_geometry,
    "--output-dir", run_out,
    "--device", "cuda",
    "--swarm-size", "64",
    "--microbatch-size", "64",
    "--steps", "1",
    "--screen-width-px", "64",
    "--screen-height-px", "36",
    "--physical-width", "0.42",
    "--ambient", "0.08",
    "--seed", "20260915",
    "--spectral-scale", "3776.27",
    "--gain", "1.0",
    "--leak", "0.2",
    "--visual-scale", "0.5",
    cwd=visual_exp,
)'''
src = src[:start] + replacement + src[end:]
src = src.replace('visual-efficiency-summary.json', 'swarm-capacity-summary.json')
src = src.replace('"progress.jsonl",\n    "winner-retina.txt",\n    "winner-top-receptors.json",\n    "swarm-capacity-summary.json",', '"swarm-capacity-summary.json",')
src = src.replace('for path in run_out.glob("winner-retina-budget-*.txt"):\n    shutil.copy2(path, public_cache / path.name)\n', '')
src = src.replace('"experiment": "malecns-visual-efficiency-curriculum-v1",', '"experiment": "malecns-telemetry-smoke-v1",')
src = src.replace('"title": "MaleCNS Visual Efficiency",', '"title": "MaleCNS Telemetry Smoke 64x64",')
# Critical observability fix: with -t/--timeout the Kaggle CLI waits for the
# kernel run, so our `kernels logs --follow` was unreachable until completion.
# Push fire-and-forget, then let the existing status/log followers observe it.
src = src.replace(
    'kaggle kernels push -p "$STAGE" --accelerator "$ACCELERATOR" -t "${KAGGLE_MALECNS_VISUAL_TIMEOUT:-21600}"',
    'echo "[launcher] pushing Kaggle version (non-blocking)"\n'
    'kaggle kernels push -p "$STAGE" --accelerator "$ACCELERATOR"\n'
    'echo "[launcher] push returned; starting live logs/status"'
)
for required in (
    'run_swarm_capacity_probe.py',
    '"--swarm-size", "64"',
    '"--microbatch-size", "64"',
    '"--steps", "1"',
    'swarm-capacity-summary.json',
    '[launcher] push returned; starting live logs/status',
):
    if required not in src:
        raise SystemExit(f"telemetry smoke rewrite missing {required}")
Path(sys.argv[2]).write_text(src, encoding="utf-8")
PY

# Reuse the public kernel so the version is visible in the Kaggle UI.
export KAGGLE_MALECNS_EFFICIENCY_KERNEL_ID="${KAGGLE_MALECNS_SWARM_CAPACITY_KERNEL_ID:-${KAGGLE_USERNAME}/malecns-static-swarm-evolution}"
bash "$TMP" "$@"
