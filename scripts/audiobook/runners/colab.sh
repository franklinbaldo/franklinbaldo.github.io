#!/usr/bin/env bash
set -euo pipefail

PLAN=""
OUTPUT=""
BACKEND="fake"
MODEL="deterministic-tone-v1"
GPU="${COLAB_GPU:-T4}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --plan) PLAN="$2"; shift 2 ;;
    --output) OUTPUT="$2"; shift 2 ;;
    --backend) BACKEND="$2"; shift 2 ;;
    --model) MODEL="$2"; shift 2 ;;
    --gpu) GPU="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

[[ -n "$PLAN" ]] || { echo "--plan is required" >&2; exit 2; }
[[ -n "$OUTPUT" ]] || { echo "--output is required" >&2; exit 2; }
command -v colab >/dev/null || { echo "colab CLI not found" >&2; exit 2; }

# The CLI supports two credential shapes: its own OAuth2 user token at
# ~/.config/colab-cli/token.json (the one `colab` mints and refreshes), and
# Application Default Credentials. Default to OAuth2 because ADC user
# credentials cannot be re-scoped and must be minted with the colaboratory
# scope explicitly.
AUTH="${COLAB_AUTH_PROVIDER:-oauth2}"

SESSION="audiobook-${GITHUB_RUN_ID:-$$}-${GITHUB_RUN_ATTEMPT:-1}"
SESSION="${SESSION,,}"
TMPDIR_LOCAL="$(mktemp -d)"
LAUNCHER="$TMPDIR_LOCAL/launcher.py"
BACKEND_JSON="$(python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$BACKEND")"
MODEL_JSON="$(python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$MODEL")"

cat > "$LAUNCHER" <<PY
import runpy
import sys
sys.argv = [
    "/content/worker.py",
    "--plan", "/content/plan.json",
    "--output-dir", "/content/audiobook-output",
    "--backend", $BACKEND_JSON,
    "--model", $MODEL_JSON,
    "--result-archive", "/content/audiobook-result.zip",
]
runpy.run_path("/content/worker.py", run_name="__main__")
PY

cleanup() {
  colab "--auth=$AUTH" stop -s "$SESSION" >/dev/null 2>&1 || true
  rm -rf "$TMPDIR_LOCAL"
}
trap cleanup EXIT

if [[ -n "$GPU" ]]; then
  colab "--auth=$AUTH" new -s "$SESSION" --gpu "$GPU"
else
  colab "--auth=$AUTH" new -s "$SESSION"
fi

colab "--auth=$AUTH" upload -s "$SESSION" scripts/audiobook/worker.py /content/worker.py
colab "--auth=$AUTH" upload -s "$SESSION" "$PLAN" /content/plan.json
colab "--auth=$AUTH" exec -s "$SESSION" --timeout "${COLAB_EXEC_TIMEOUT:-3600}" -f "$LAUNCHER"
mkdir -p "$(dirname "$OUTPUT")"
colab "--auth=$AUTH" download -s "$SESSION" /content/audiobook-result.zip "$OUTPUT"

echo "colab result: $OUTPUT"
