#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE="$SCRIPT_DIR/kaggle.sh"
TMP="$(mktemp)"
RESUME_DIR="$(mktemp -d)"
trap 'rm -f "$TMP"; rm -rf "$RESUME_DIR"' EXIT

KERNEL_ID="${KAGGLE_MALECNS_EFFICIENCY_KERNEL_ID:-${KAGGLE_USERNAME}/malecns-visual-efficiency}"
RESUME_CKPT=""
if kaggle kernels output "$KERNEL_ID" -p "$RESUME_DIR" -o --file-pattern '.*public-cache/best-efficiency-transducer[.]npz' >/dev/null 2>&1; then
  RESUME_CKPT="$(find "$RESUME_DIR" -type f -name 'best-efficiency-transducer.npz' -print -quit)"
fi
[[ -n "$RESUME_CKPT" ]] || { echo "online plastic run requires a prior transducer checkpoint" >&2; exit 3; }
CKPT_B64="$(base64 -w0 "$RESUME_CKPT")"

python3 - "$BASE" "$TMP" "$CKPT_B64" <<'PY'
from pathlib import Path
import sys

src = Path(sys.argv[1]).read_text(encoding='utf-8')
checkpoint_b64 = sys.argv[3]
text = src.replace(
    'run_visual_efficiency_curriculum.py',
    'run_online_plastic_screen_learning.py',
)
text = text.replace('"--steps", "300",', '"--steps", "600",\n    "--episodes-per-budget", "4",')
text = text.replace('    "--population", "7",\n', '')
text = text.replace('    "--generations-per-budget", "2",\n', '')
text = text.replace('"--budgets", "0.12,0.06,0.03",', '"--budgets", "0.004,0.002,0.001",')
text = text.replace('    "--mutation-sigma", "0.18",\n', '')
text = text.replace(
    '    "--latent-gain", "20000",\n',
    '    "--latent-gain", "20000",\n'
    '    "--plastic-reward-gain", "100000000",\n'
    '    "--learning-rate", "0.02",\n'
    '    "--exploration-sigma", "0.08",\n'
    '    "--eligibility-decay", "0.95",\n'
    '    "--baseline-rate", "0.02",\n'
)
text = text.replace(
    'summary = json.loads((run_out / "visual-efficiency-summary.json").read_text(encoding="utf-8"))',
    'summary = json.loads((run_out / "plastic-learning-summary.json").read_text(encoding="utf-8"))',
)
text = text.replace('    "progress.jsonl",', '    "plastic-progress.jsonl",')
text = text.replace('    "visual-efficiency-summary.json",', '    "plastic-learning-summary.json",')
text = text.replace(
    '    "plastic-learning-summary.json",\n):',
    '    "plastic-learning-summary.json",\n    "plastic-adapter.npz",\n    "best-efficiency-transducer.npz",\n):',
)
text = text.replace(
    '"experiment": "malecns-visual-efficiency-curriculum-v1",',
    '"experiment": "malecns-online-reward-plastic-screen-v1",',
)

needle = 'visual_exp = visual_repo / "experiments/malecns_visual_attractor"\n'
if needle not in text:
    raise SystemExit('could not locate visual_exp assignment')
injected = needle + (
    'import base64\n'
    f'_plastic_resume = base64.b64decode({checkpoint_b64!r})\n'
    '_plastic_checkpoint = visual_exp / "scripts" / "initial-transducer.npz"\n'
    '_plastic_checkpoint.write_bytes(_plastic_resume)\n'
    'print("Injected checkpoint for online plastic learner", flush=True)\n'
)
text = text.replace(needle, injected, 1)
arg_needle = '    "--output-dir", run_out,\n'
if arg_needle not in text:
    raise SystemExit('could not install initial-transducer argument')
text = text.replace(
    arg_needle,
    arg_needle + '    "--initial-transducer", _plastic_checkpoint,\n',
    1,
)

for required in (
    'run_online_plastic_screen_learning.py',
    '"--episodes-per-budget", "4"',
    '"--budgets", "0.004,0.002,0.001"',
    '"--initial-transducer", _plastic_checkpoint',
    'plastic-learning-summary.json',
    'plastic-adapter.npz',
):
    if required not in text:
        raise SystemExit(f'online-plastic bridge rewrite missing {required}')
for forbidden in ('"--population"', '"--generations-per-budget"', '"--mutation-sigma"'):
    if forbidden in text:
        raise SystemExit(f'online-plastic bridge retained unsupported arg {forbidden}')
Path(sys.argv[2]).write_text(text, encoding='utf-8')
PY

echo "Starting online reward-plastic learner from: $RESUME_CKPT"
bash "$TMP" "$@"
