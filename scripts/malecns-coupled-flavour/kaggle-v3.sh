#!/usr/bin/env bash
set -euo pipefail

# Reuse the proven Kaggle bridge/watchdog unchanged, but point the scientific
# entrypoint at the per-(encoder, scale) adapter v3. Keep v1/v2 bridge history
# intact for provenance, and use a distinct Kaggle kernel slug/title.
base="$(dirname "$0")/kaggle.sh"
tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT
sed \
  -e 's#smoke_coupled_flavour_translation_gpu[.]py#smoke_coupled_flavour_translation_gpu_v3.py#g' \
  -e 's#MaleCNS Coupled Flavour Translation Smoke#MaleCNS Coupled Flavour Adapter Smoke#g' \
  "$base" > "$tmp"
exec bash "$tmp" "$@"
