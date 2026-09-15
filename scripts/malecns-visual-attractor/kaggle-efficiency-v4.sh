#!/usr/bin/env bash
set -euo pipefail

# Reuse the proven public Kaggle transport while selecting v4: every nonblank
# arm is reduced to a per-frame common attainable energy target before neural
# injection. The scientific runner aborts if the mismatch gate is violated.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT
sed \
  -e 's/run_visual_efficiency_curriculum[.]py/run_visual_efficiency_curriculum_v4.py/g' \
  -e 's/malecns-visual-efficiency-curriculum-v1/malecns-visual-efficiency-curriculum-v4/g' \
  "$SCRIPT_DIR/kaggle.sh" > "$TMP"
bash "$TMP" "$@"
