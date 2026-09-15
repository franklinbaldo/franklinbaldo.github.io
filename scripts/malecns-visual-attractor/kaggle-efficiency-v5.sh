#!/usr/bin/env bash
set -euo pipefail

# Reuse the public Kaggle transport while selecting v5: common aperture,
# common attainable exact energy, an explicit retinal intensity floor, and
# genuinely sub-capacity TV energy budgets. Rewrite fail-closed so an upstream
# transport edit cannot silently restore the old runner or budgets.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT
python3 - "$SCRIPT_DIR/kaggle.sh" "$TMP" <<'PY'
from pathlib import Path
import sys

source = Path(sys.argv[1]).read_text(encoding="utf-8")
script_old = 'run_visual_efficiency_curriculum.py'
budget_old = '"--budgets", "0.12,0.06,0.03",'
experiment_old = 'malecns-visual-efficiency-curriculum-v1'

for needle in (script_old, budget_old, experiment_old):
    if needle not in source:
        raise SystemExit(f"v5 bridge invariant missing from kaggle.sh: {needle}")

source = source.replace(script_old, 'run_visual_efficiency_curriculum_v5.py')
source = source.replace(budget_old, '"--budgets", "0.008,0.004,0.002",')
source = source.replace(experiment_old, 'malecns-visual-efficiency-curriculum-v5')

if 'run_visual_efficiency_curriculum_v5.py' not in source:
    raise SystemExit('v5 runner rewrite failed')
if '"--budgets", "0.008,0.004,0.002",' not in source:
    raise SystemExit('v5 budget rewrite failed')

Path(sys.argv[2]).write_text(source, encoding="utf-8")
PY
bash "$TMP" "$@"
