#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE="$SCRIPT_DIR/kaggle.sh"
TMP="$(mktemp)"
RESUME_DIR="$(mktemp -d)"
trap 'rm -f "$TMP"; rm -rf "$RESUME_DIR"' EXIT

KERNEL_ID="${KAGGLE_MALECNS_FULLSCREEN_KERNEL_ID:-${KAGGLE_USERNAME}/malecns-physical-full-screen}"
RESUME_CKPT=""
if kaggle kernels output "$KERNEL_ID" -p "$RESUME_DIR" -o --file-pattern '.*full-screen-decoder[.]npz' >/dev/null 2>&1; then
  RESUME_CKPT="$(find "$RESUME_DIR" -type f -name 'full-screen-decoder.npz' -print -quit)"
fi

python3 - "$BASE" "$TMP" <<'PY'
from pathlib import Path
import sys

src = Path(sys.argv[1]).read_text(encoding='utf-8')
text = src.replace('run_visual_efficiency_curriculum.py', 'run_physical_full_screen_ray_room.py')
text = text.replace('"--steps", "300",', '"--steps", "350",')
for line in (
    '    "--population", "7",\n',
    '    "--generations-per-budget", "2",\n',
    '    "--budgets", "0.12,0.06,0.03",\n',
    '    "--radius", "0.75",\n',
    '    "--latent-gain", "20000",\n',
    '    "--mutation-sigma", "0.18",\n',
):
    text = text.replace(line, '')
text = text.replace(
    '    "--heading-offset-deg", "45",\n',
    '    "--screen-width-px", "64",\n'
    '    "--screen-height-px", "36",\n'
    '    "--feature-dim", "256",\n'
    '    "--screen-budget", "0.15",\n'
    '    "--heading-offset-deg", "30",\n',
)
text = text.replace(
    '    "--reward-feedback-gain", "1000.0",\n',
    '    "--reward-feedback-gain", "1000.0",\n'
    '    "--projection-gain", "20000",\n'
    '    "--plastic-reward-gain", "100000000",\n'
    '    "--learning-rate", "0.001",\n'
    '    "--exploration-sigma", "0.05",\n'
    '    "--eligibility-decay", "0.95",\n'
    '    "--baseline-rate", "0.02",\n',
)
# Only render the emitted TV frame after training. Retinal PNGs are produced by
# the ray-room runner from the actual vector delivered to the receiver at the
# best tick; do not reconstruct them after the fact.
text = text.replace(
    'summary = json.loads((run_out / "visual-efficiency-summary.json").read_text(encoding="utf-8"))',
    'run(\n'
    '    sys.executable,\n'
    '    visual_exp / "scripts/render_screen_png.py",\n'
    '    "--frame", run_out / "best-full-screen-frame.npy",\n'
    '    "--output", run_out / "best-full-screen-frame.png",\n'
    '    cwd=visual_exp,\n'
    ')\n\n'
    'summary = json.loads((run_out / "full-screen-summary.json").read_text(encoding="utf-8"))',
)
text = text.replace('"title": "MaleCNS Visual Efficiency",', '"title": "MaleCNS Ray Room Compound Eye",')
text = text.replace('    "progress.jsonl",', '    "full-screen-progress.jsonl",')
text = text.replace('    "winner-retina.txt",\n', '')
text = text.replace('    "winner-top-receptors.json",\n', '')
text = text.replace('    "visual-efficiency-summary.json",', '    "full-screen-summary.json",')
text = text.replace(
    '    "full-screen-summary.json",\n):',
    '    "full-screen-summary.json",\n'
    '    "full-screen-decoder.npz",\n'
    '    "best-full-screen-frame.npy",\n'
    '    "best-full-screen-frame.pgm",\n'
    '    "best-full-screen-frame.txt",\n'
    '    "best-full-screen-frame.png",\n'
    '    "best-retina-actual-learned.npy",\n'
    '    "best-retina-actual-uniform.npy",\n'
    '    "best-retina-actual-vs-uniform.npy",\n'
    '    "best-retina-actual-compound-eye.png",\n'
    '    "best-retina-actual-compound-eye-contrast.png",\n'
    '    "best-retina-actual-panorama.png",\n'
    '    "best-retina-actual-panorama-contrast.png",\n'
    '    "best-retina-vs-uniform-compound-eye.png",\n'
    '    "best-retina-vs-uniform-panorama.png",\n'
    '    "compound-eye-environment.json",\n):',
)
text = text.replace(
    'for path in run_out.glob("winner-retina-budget-*.txt"):\n    shutil.copy2(path, public_cache / path.name)\n',
    '',
)
text = text.replace(
    '"experiment": "malecns-visual-efficiency-curriculum-v1",',
    '"experiment": "malecns-physical-full-screen-attractor-v4-ray-room-compound-eye",',
)

for required in (
    'run_physical_full_screen_ray_room.py',
    'render_screen_png.py',
    '"--screen-width-px", "64"',
    '"--screen-height-px", "36"',
    '"--feature-dim", "256"',
    '"--projection-gain", "20000"',
    'full-screen-summary.json',
    'full-screen-decoder.npz',
    'best-retina-actual-compound-eye.png',
    'best-retina-actual-panorama.png',
    'compound-eye-environment.json',
):
    if required not in text:
        raise SystemExit(f'ray-room bridge rewrite missing {required}')
for forbidden in ('"--population"', '"--generations-per-budget"', '"--budgets"', '"--radius"', '"--latent-gain"', '"--mutation-sigma"', '"--initial-decoder"'):
    if forbidden in text:
        raise SystemExit(f'ray-room bridge retained unsupported arg {forbidden}')
Path(sys.argv[2]).write_text(text, encoding='utf-8')
PY

if [[ -n "$RESUME_CKPT" ]]; then
  echo "Prior full-screen decoder exists; ray-room calibration run starts fresh so the changed sensory physics is not confounded by the old environment."
else
  echo "No prior full-screen decoder found; bootstrapping fresh 256x2304 decoder in ray-cast room"
fi
bash "$TMP" --kernel-id "$KERNEL_ID" "$@"
