#!/usr/bin/env bash
set -euo pipefail

# Reuse the proven coupled-flavour bridge/watchdog directly. Avoid wrapping the
# peer-grid wrapper itself, because that wrapper resolves paths relative to $0
# and would break after being materialized into /tmp.
base="$(dirname "$0")/../malecns-coupled-flavour/kaggle.sh"
tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT
sed \
  -e 's#smoke_coupled_flavour_translation_gpu[.]py#smoke_peer_reliability_replicate_batch_gpu.py#g' \
  -e 's#MaleCNS Coupled Flavour Translation Smoke#MaleCNS Peer Reliability Replication#g' \
  "$base" > "$tmp"
exec bash "$tmp" "$@"
