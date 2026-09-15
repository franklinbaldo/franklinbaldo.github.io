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
RESUME_FLAG=0
if [[ -n "$RESUME_CKPT" ]]; then
  RESUME_FLAG=1
fi

python3 - "$BASE" "$TMP" "$RESUME_FLAG" <<'PY'
from pathlib import Path
import sys

src = Path(sys.argv[1]).read_text(encoding='utf-8')
resume = sys.argv[3] == '1'
text = src.replace('run_visual_efficiency_curriculum.py', 'run_physical_full_screen_attractor.py')
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
    '    "--projection-gain", "200",\n'
    '    "--plastic-reward-gain", "100000000",\n'
    '    "--learning-rate", "0.001",\n'
    '    "--exploration-sigma", "0.05",\n'
    '    "--eligibility-decay", "0.95",\n'
    '    "--baseline-rate", "0.02",\n',
)
text = text.replace(
    'summary = json.loads((run_out / "visual-efficiency-summary.json").read_text(encoding="utf-8"))',
    'run(\n'
    '    sys.executable,\n'
    '    visual_exp / "scripts/render_full_screen_images.py",\n'
    '    "--summary", run_out / "full-screen-summary.json",\n'
    '    "--frame", run_out / "best-full-screen-frame.npy",\n'
    '    "--screen-geometry", screen_geometry,\n'
    '    "--output-dir", run_out,\n'
    '    "--device", "cpu",\n'
    '    cwd=visual_exp,\n'
    ')\n\n'
    'summary = json.loads((run_out / "full-screen-summary.json").read_text(encoding="utf-8"))',
)
text = text.replace('"title": "MaleCNS Visual Efficiency",', '"title": "MaleCNS Physical Full Screen",')
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
    '    "best-retina-initial-pose.npy",\n'
    '    "best-retina-vs-uniform.npy",\n'
    '    "best-retina-initial-pose-physical.png",\n'
    '    "best-retina-initial-pose-contrast.png",\n'
    '    "best-retina-vs-uniform.png",\n'
    '    "image-artifacts.json",\n):',
)
text = text.replace(
    'for path in run_out.glob("winner-retina-budget-*.txt"):\n    shutil.copy2(path, public_cache / path.name)\n',
    '',
)
text = text.replace(
    '"experiment": "malecns-visual-efficiency-curriculum-v1",',
    '"experiment": "malecns-physical-full-screen-attractor-v2-png",',
)

# Put the large decoder checkpoint beside job.py in the staged Kaggle source.
stage_needle = "trap 'rm -rf \"$STAGE\" \"$DOWNLOAD\"' EXIT\n"
if stage_needle not in text:
    raise SystemExit('could not locate Kaggle stage trap')
text = text.replace(
    stage_needle,
    stage_needle + '[[ -z "${RESUME_CKPT:-}" ]] || cp "$RESUME_CKPT" "$STAGE/initial-full-screen-decoder.npz"\n',
    1,
)

if resume:
    needle = 'visual_exp = visual_repo / "experiments/malecns_visual_attractor"\n'
    if needle not in text:
        raise SystemExit('could not locate visual_exp assignment')
    injected = needle + (
        '_fullscreen_checkpoint = pathlib.Path(__file__).with_name("initial-full-screen-decoder.npz")\n'
        'if not _fullscreen_checkpoint.exists():\n'
        '    raise RuntimeError("staged full-screen checkpoint missing")\n'
        'print(f"Using staged full-screen decoder: {_fullscreen_checkpoint}", flush=True)\n'
    )
    text = text.replace(needle, injected, 1)
    arg_needle = '    "--output-dir", run_out,\n'
    if arg_needle not in text:
        raise SystemExit('could not install initial-decoder argument')
    text = text.replace(arg_needle, arg_needle + '    "--initial-decoder", _fullscreen_checkpoint,\n', 1)

for required in (
    'run_physical_full_screen_attractor.py',
    'render_full_screen_images.py',
    '"--screen-width-px", "64"',
    '"--screen-height-px", "36"',
    '"--feature-dim", "256"',
    'full-screen-summary.json',
    'full-screen-decoder.npz',
    'best-retina-initial-pose-physical.png',
    'initial-full-screen-decoder.npz',
):
    if required not in text:
        raise SystemExit(f'full-screen bridge rewrite missing {required}')
for forbidden in ('"--population"', '"--generations-per-budget"', '"--budgets"', '"--radius"', '"--latent-gain"', '"--mutation-sigma"'):
    if forbidden in text:
        raise SystemExit(f'full-screen bridge retained unsupported arg {forbidden}')
Path(sys.argv[2]).write_text(text, encoding='utf-8')
PY

export RESUME_CKPT
if [[ -n "$RESUME_CKPT" ]]; then
  echo "Resuming physical full-screen decoder from staged checkpoint: $RESUME_CKPT"
else
  echo "No prior full-screen decoder found; bootstrapping fresh 256x2304 decoder"
fi
bash "$TMP" --kernel-id "$KERNEL_ID" "$@"
