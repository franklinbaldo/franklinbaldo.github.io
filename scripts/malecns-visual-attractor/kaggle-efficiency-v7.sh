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

CKPT_B64=""
if [[ -n "$RESUME_CKPT" ]]; then
  CKPT_B64="$(base64 -w0 "$RESUME_CKPT")"
fi

python3 - "$BASE" "$TMP" "$CKPT_B64" <<'PY'
from pathlib import Path
import sys

src = Path(sys.argv[1]).read_text(encoding='utf-8')
checkpoint_b64 = sys.argv[3]
text = src.replace(
    'run_visual_efficiency_curriculum.py',
    'run_visual_efficiency_curriculum_v7.py',
)
text = text.replace(
    '"--budgets", "0.12,0.06,0.03",',
    '"--budgets", "0.004,0.002,0.001",',
)
text = text.replace(
    '"--generations-per-budget", "2",',
    '"--generations-per-budget", "6",',
)
text = text.replace(
    '"experiment": "malecns-visual-efficiency-curriculum-v1",',
    '"experiment": "malecns-visual-efficiency-curriculum-v7-resumed-low-light",',
)

# Inject the binary checkpoint into the kernel program itself. Extra files placed
# beside job.py were not reliably visible as /kaggle/src files, which caused v6
# to report learning_mode=fresh even though the bridge had downloaded a checkpoint.
needle = 'visual_exp = visual_repo / "experiments/malecns_visual_attractor"\n'
if needle not in text:
    raise SystemExit('could not locate visual_exp assignment for checkpoint injection')
if checkpoint_b64:
    injected = needle + (
        'import base64\n'
        f'_resume_bytes = base64.b64decode({checkpoint_b64!r})\n'
        '(visual_exp / "scripts" / "initial-transducer.npz").write_bytes(_resume_bytes)\n'
        'print("Injected prior transducer checkpoint into visual runner", flush=True)\n'
    )
    text = text.replace(needle, injected, 1)

copy_needle = '    "visual-efficiency-summary.json",\n):'
copy_repl = '    "visual-efficiency-summary.json",\n    "best-efficiency-transducer.npz",\n):'
if copy_needle not in text:
    raise SystemExit('could not expose learned transducer in public cache')
text = text.replace(copy_needle, copy_repl, 1)

for required in (
    'run_visual_efficiency_curriculum_v7.py',
    '"--budgets", "0.004,0.002,0.001",',
    '"--generations-per-budget", "6",',
    'best-efficiency-transducer.npz',
):
    if required not in text:
        raise SystemExit(f'v7 bridge rewrite missing {required}')
if checkpoint_b64 and 'initial-transducer.npz' not in text:
    raise SystemExit('v7 checkpoint was available but not injected')
Path(sys.argv[2]).write_text(text, encoding='utf-8')
PY

if [[ -n "$RESUME_CKPT" ]]; then
  echo "Embedding learned transducer from prior Kaggle output: $RESUME_CKPT"
else
  echo "No prior transducer checkpoint found; refusing primary V7 continuation" >&2
  exit 3
fi
bash "$TMP" "$@"
