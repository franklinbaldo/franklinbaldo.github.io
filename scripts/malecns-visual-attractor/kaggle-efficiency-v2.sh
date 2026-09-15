#!/usr/bin/env bash
set -euo pipefail

# Keep the proven Kaggle transport/retrieval shell intact while selecting the
# v2 scientific runner that exactly matches delivered energy between arms.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT
sed \
  -e 's/run_visual_efficiency_curriculum[.]py/run_visual_efficiency_curriculum_v2.py/g' \
  -e 's/malecns-visual-efficiency-curriculum-v1/malecns-visual-efficiency-curriculum-v2/g' \
  "$SCRIPT_DIR/kaggle.sh" > "$TMP"
bash "$TMP" "$@"
