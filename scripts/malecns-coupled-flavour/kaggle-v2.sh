#!/usr/bin/env bash
set -euo pipefail

# Preserve the fail-fast/provenance bridge verbatim and only swap the scientific
# entrypoint.  Keeping v1 intact makes the original CUDA/CPU failure reproducible.
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT
sed 's/smoke_coupled_flavour_translation_gpu[.]py/smoke_coupled_flavour_translation_gpu_v2.py/g' \
  "$DIR/kaggle.sh" > "$TMP"
bash "$TMP" "$@"
