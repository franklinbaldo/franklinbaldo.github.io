#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE="$SCRIPT_DIR/kaggle.sh"
TMP="$(mktemp)"
RESUME_DIR="$(mktemp -d)"
trap 'rm -f "$TMP"; rm -rf "$RESUME_DIR"' EXIT

KERNEL_ID="${KAGGLE_MALECNS_EFFICIENCY_KERNEL_ID:-${KAGGLE_USERNAME}/malecns-visual-efficiency}"
RESUME_CKPT=""
if kaggle kernels output "$KERNEL_ID" -p "$RESUME_DIR" -o --file-pattern '.*visual-efficiency/best-efficiency-transducer[.]npz' >/dev/null 2>&1; then
  RESUME_CKPT="$(find "$RESUME_DIR" -type f -name 'best-efficiency-transducer.npz' -print -quit)"
fi

python3 - "$BASE" "$TMP" <<'PY'
from pathlib import Path
import sys
src = Path(sys.argv[1]).read_text(encoding='utf-8')
text = src.replace(
    'run_visual_efficiency_curriculum.py',
    'run_visual_efficiency_curriculum_v6.py',
)
text = text.replace(
    '"--budgets", "0.12,0.06,0.03",',
    '"--budgets", "0.008,0.004,0.002",',
)
text = text.replace(
    '"experiment": "malecns-visual-efficiency-curriculum-v1",',
    '"experiment": "malecns-visual-efficiency-curriculum-v6-six-blob",',
)
needle = "trap 'rm -rf \"$STAGE\" \"$DOWNLOAD\"' EXIT\n"
insert = needle + '[[ -z "${RESUME_CKPT:-}" ]] || cp "$RESUME_CKPT" "$STAGE/initial-transducer.npz"\n'
if needle not in text:
    raise SystemExit('could not install v6 resume checkpoint staging')
text = text.replace(needle, insert, 1)
copy_needle = '    "visual-efficiency-summary.json",\n):'
copy_repl = '    "visual-efficiency-summary.json",\n    "best-efficiency-transducer.npz",\n):'
if copy_needle not in text:
    raise SystemExit('could not expose learned transducer in public cache')
text = text.replace(copy_needle, copy_repl, 1)
for required in (
    'run_visual_efficiency_curriculum_v6.py',
    '"--budgets", "0.008,0.004,0.002",',
    'initial-transducer.npz',
    'best-efficiency-transducer.npz',
):
    if required not in text:
        raise SystemExit(f'v6 bridge rewrite missing {required}')
Path(sys.argv[2]).write_text(text, encoding='utf-8')
PY

export RESUME_CKPT
if [[ -n "$RESUME_CKPT" ]]; then
  echo "Resuming learned transducer from prior Kaggle output: $RESUME_CKPT"
else
  echo "No prior transducer checkpoint found; V6 will start fresh"
fi
bash "$TMP" "$@"
