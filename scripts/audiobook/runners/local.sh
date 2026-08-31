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

# Prefer uv so the script's PEP 723 header decides the interpreter; fall back to
# the ambient python3 where uv is not installed.
if command -v uv >/dev/null; then
  run_script() { uv run --script "$@"; }
else
  run_script() { python3 "$@"; }
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$(dirname "$OUTPUT")"
run_script scripts/audiobook/worker.py \
  --plan "$PLAN" \
  --output-dir "$TMP/output" \
  --backend "$BACKEND" \
  --model "$MODEL" \
  --result-archive "$OUTPUT"

echo "local result: $OUTPUT"
