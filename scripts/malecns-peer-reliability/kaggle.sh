#!/usr/bin/env bash
set -euo pipefail

# Reuse the proven fail-fast bridge, but point it at the reliability-grid runner
# and a title that deterministically resolves to the requested Kaggle slug.
base="$(dirname "$0")/../malecns-coupled-flavour/kaggle.sh"
tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT
sed \
  -e 's#smoke_coupled_flavour_translation_gpu[.]py#smoke_peer_reliability_grid_gpu.py#g' \
  -e 's#MaleCNS Coupled Flavour Translation Smoke#MaleCNS Peer Reliability Grid#g' \
  "$base" > "$tmp"
exec bash "$tmp" "$@"
