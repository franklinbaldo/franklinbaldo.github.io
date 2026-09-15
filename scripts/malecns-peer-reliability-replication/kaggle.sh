#!/usr/bin/env bash
set -euo pipefail

# Reuse the proven reliability-grid bridge/watchdog, but point it at the
# preregistered two-new-seed replication batch.
base="$(dirname "$0")/../malecns-peer-reliability/kaggle.sh"
tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT
sed \
  -e 's#smoke_peer_reliability_grid_gpu[.]py#smoke_peer_reliability_replicate_batch_gpu.py#g' \
  -e 's#MaleCNS Peer Reliability Grid#MaleCNS Peer Reliability Replication#g' \
  "$base" > "$tmp"
exec bash "$tmp" "$@"
