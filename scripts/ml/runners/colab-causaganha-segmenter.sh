#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/franklinbaldo/causaganha.git"
REF="main"
DATA_DIR="data/segmenter_splits"
EPOCHS="1"
BATCH_SIZE="1"
SEED="771"
REPORT_OUTPUT=""
MODEL_OUTPUT=""
GPU="${COLAB_GPU:-T4}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo-url) REPO_URL="$2"; shift 2 ;;
    --ref) REF="$2"; shift 2 ;;
    --data-dir) DATA_DIR="$2"; shift 2 ;;
    --epochs) EPOCHS="$2"; shift 2 ;;
    --batch-size) BATCH_SIZE="$2"; shift 2 ;;
    --seed) SEED="$2"; shift 2 ;;
    --report-output) REPORT_OUTPUT="$2"; shift 2 ;;
    --model-output) MODEL_OUTPUT="$2"; shift 2 ;;
    --gpu) GPU="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

[[ -n "$REPORT_OUTPUT" ]] || { echo "--report-output is required" >&2; exit 2; }
[[ -n "$MODEL_OUTPUT" ]] || { echo "--model-output is required" >&2; exit 2; }
command -v colab >/dev/null || { echo "colab CLI not found" >&2; exit 2; }

AUTH="${COLAB_AUTH_PROVIDER:-oauth2}"
SESSION="causaganha-segmenter-${GITHUB_RUN_ID:-$$}-${GITHUB_RUN_ATTEMPT:-1}"
SESSION="${SESSION,,}"
TMPDIR_LOCAL="$(mktemp -d)"
LAUNCHER="$TMPDIR_LOCAL/launcher.py"

python3 - "$REPO_URL" "$REF" "$DATA_DIR" "$EPOCHS" "$BATCH_SIZE" "$SEED" > "$LAUNCHER" <<'PY'
import sys
repo_url, ref, data_dir, epochs, batch_size, seed = sys.argv[1:]
print("import runpy, sys")
print("sys.argv = " + repr([
    "/content/worker.py",
    "--repo-url", repo_url,
    "--ref", ref,
    "--data-dir", data_dir,
    "--epochs", epochs,
    "--batch-size", batch_size,
    "--seed", seed,
    "--output-root", "/content/segmenter-output",
    "--report-archive", "/content/segmenter-report.zip",
    "--model-archive", "/content/segmenter-model.tar.gz",
]))
print("runpy.run_path('/content/worker.py', run_name='__main__')")
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

colab "--auth=$AUTH" upload -s "$SESSION" scripts/ml/causaganha-segmenter-worker.py /content/worker.py
colab "--auth=$AUTH" exec -s "$SESSION" --timeout "${COLAB_EXEC_TIMEOUT:-10800}" -f "$LAUNCHER"
mkdir -p "$(dirname "$REPORT_OUTPUT")" "$(dirname "$MODEL_OUTPUT")"
colab "--auth=$AUTH" download -s "$SESSION" /content/segmenter-report.zip "$REPORT_OUTPUT"
colab "--auth=$AUTH" download -s "$SESSION" /content/segmenter-model.tar.gz "$MODEL_OUTPUT"

echo "colab report: $REPORT_OUTPUT"
echo "colab model: $MODEL_OUTPUT"
