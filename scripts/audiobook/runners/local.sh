#!/usr/bin/env bash
set -euo pipefail

PLAN=""
OUTPUT=""
BACKEND="fake"
MODEL="deterministic-tone-v1"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --plan) PLAN="$2"; shift 2 ;;
    --output) OUTPUT="$2"; shift 2 ;;
    --backend) BACKEND="$2"; shift 2 ;;
    --model) MODEL="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

[[ -n "$PLAN" ]] || { echo "--plan is required" >&2; exit 2; }
[[ -n "$OUTPUT" ]] || { echo "--output is required" >&2; exit 2; }

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$(dirname "$OUTPUT")"
python3 scripts/audiobook/worker.py \
  --plan "$PLAN" \
  --output-dir "$TMP/output" \
  --backend "$BACKEND" \
  --model "$MODEL" \
  --result-archive "$OUTPUT"

echo "local result: $OUTPUT"
