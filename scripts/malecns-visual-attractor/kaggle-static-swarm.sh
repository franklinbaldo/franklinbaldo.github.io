#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE="$SCRIPT_DIR/kaggle.sh"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT
KERNEL_ID="${KAGGLE_MALECNS_STATIC_SWARM_KERNEL_ID:-${KAGGLE_USERNAME}/malecns-static-swarm-evolution}"

python3 - "$BASE" "$TMP" <<'PY'
from pathlib import Path
import sys
src=Path(sys.argv[1]).read_text(encoding='utf-8')
text=src.replace('run_visual_efficiency_curriculum.py','run_swarm_screen_evolution.py')
# Remove curriculum-only arguments.
for line in (
    '    "--generations-per-budget", "2",\n',
    '    "--budgets", "0.12,0.06,0.03",\n',
    '    "--radius", "0.75",\n',
    '    "--heading-offset-deg", "45",\n',
    '    "--latent-gain", "20000",\n',
    '    "--telemetry-every", "100",\n',
): text=text.replace(line,'')
text=text.replace('    "--flies", "8",\n','    "--flies", "24",\n')
text=text.replace('    "--steps", "300",\n','    "--steps", "160",\n    "--final-steps", "240",\n')
text=text.replace('    "--population", "7",\n','    "--population", "5",\n    "--elites", "2",\n    "--rounds", "3",\n')
text=text.replace('    "--mutation-sigma", "0.18",\n','    "--mutation-sigma", "0.015",\n    "--screen-width-px", "64",\n    "--screen-height-px", "36",\n    "--feature-dim", "256",\n    "--screen-budget", "0.15",\n    "--physical-width", "0.42",\n    "--ambient", "0.08",\n    "--projection-gain", "20000",\n    "--plastic-reward-gain", "100000000",\n    "--learning-rate", "0.001",\n    "--exploration-sigma", "0.05",\n    "--eligibility-decay", "0.95",\n    "--baseline-rate", "0.02",\n')
text=text.replace('summary = json.loads((run_out / "visual-efficiency-summary.json").read_text(encoding="utf-8"))','summary = json.loads((run_out / "swarm-summary.json").read_text(encoding="utf-8"))')
text=text.replace('"title": "MaleCNS Visual Efficiency",','"title": "MaleCNS Static Swarm Evolution",')
text=text.replace('    "progress.jsonl",\n    "winner-retina.txt",\n    "winner-top-receptors.json",\n    "visual-efficiency-summary.json",\n','    "swarm-progress.jsonl",\n    "swarm-summary.json",\n    "retinal-transport.npz",\n    "swarm-winner-frame.npy",\n    "swarm-winner-frame.png",\n    "swarm-winner-decoder.npz",\n    "swarm-winner-retinas.npy",\n    "swarm-best-fly-compound-eye.png",\n    "swarm-best-fly-panorama.png",\n    "swarm-hard-fly-compound-eye.png",\n    "swarm-hard-fly-panorama.png",\n')
text=text.replace('for path in run_out.glob("winner-retina-budget-*.txt"):\n    shutil.copy2(path, public_cache / path.name)\n','')
text=text.replace('"experiment": "malecns-visual-efficiency-curriculum-v1",','"experiment": "malecns-static-optics-swarm-evolution-v1",')
for required in ('run_swarm_screen_evolution.py','swarm-summary.json','retinal-transport.npz','"--flies", "24"','"--rounds", "3"'):
    if required not in text: raise SystemExit(f'missing static swarm rewrite: {required}')
Path(sys.argv[2]).write_text(text,encoding='utf-8')
PY

bash "$TMP" --kernel-id "$KERNEL_ID" "$@"
