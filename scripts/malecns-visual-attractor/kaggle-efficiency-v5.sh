#!/usr/bin/env bash
set -euo pipefail

# Reuse the public Kaggle transport while selecting v5: common aperture,
# common attainable exact energy, an explicit retinal intensity floor, and
# genuinely sub-capacity TV energy budgets.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT
sed \
  -e 's/run_visual_efficiency_curriculum[.]py/run_visual_efficiency_curriculum_v5.py/g' \
  -e 's/--budgets "0[.]12,0[.]06,0[.]03"/--budgets "0.008,0.004,0.002"/g' \
  -e 's/malecns-visual-efficiency-curriculum-v1/malecns-visual-efficiency-curriculum-v5/g' \
  "$SCRIPT_DIR/kaggle.sh" > "$TMP"
bash "$TMP" "$@"
