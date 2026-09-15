#!/usr/bin/env bash
set -euo pipefail

# Reuse the proven Kaggle transport/retrieval shell while selecting the v3
# scientific runner: one physical 16:9 screen aperture plus a hard exact-energy
# mismatch gate.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT
sed \
  -e 's/run_visual_efficiency_curriculum[.]py/run_visual_efficiency_curriculum_v3.py/g' \
  -e 's/malecns-visual-efficiency-curriculum-v1/malecns-visual-efficiency-curriculum-v3/g' \
  "$SCRIPT_DIR/kaggle.sh" > "$TMP"
bash "$TMP" "$@"
