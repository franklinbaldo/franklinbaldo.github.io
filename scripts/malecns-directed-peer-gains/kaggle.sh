#!/usr/bin/env bash
set -euo pipefail

# Reuse the proven fail-fast coupled-flavour bridge, changing only the
# scientific entrypoint/title. The batch accepts the base bridge's frozen
# --peer-lambda 0.5 argument and validates it against the preregistration.
base="$(dirname "$0")/../malecns-coupled-flavour/kaggle.sh"
tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT
sed \
  -e 's#smoke_coupled_flavour_translation_gpu[.]py#smoke_directed_peer_gains_batch_gpu.py#g' \
  -e 's#MaleCNS Coupled Flavour Translation Smoke#MaleCNS Directed Peer Gains#g' \
  "$base" > "$tmp"
exec bash "$tmp" "$@"
