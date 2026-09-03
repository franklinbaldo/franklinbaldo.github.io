#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/franklinbaldo/causaganha.git"
REF="main"
DATA_DIR="data/segmenter_splits"
EPOCHS="1"
BATCH_SIZE="1"
SEED="771"
REPORT_OUTPUT=""
ACCELERATOR="${KAGGLE_ACCELERATOR:-NvidiaTeslaT4}"
KERNEL_ID="${KAGGLE_KERNEL_ID:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo-url) REPO_URL="$2"; shift 2 ;;
    --ref) REF="$2"; shift 2 ;;
    --data-dir) DATA_DIR="$2"; shift 2 ;;
    --epochs) EPOCHS="$2"; shift 2 ;;
    --batch-size) BATCH_SIZE="$2"; shift 2 ;;
    --seed) SEED="$2"; shift 2 ;;
    --report-output) REPORT_OUTPUT="$2"; shift 2 ;;
    --accelerator) ACCELERATOR="$2"; shift 2 ;;
    --kernel-id) KERNEL_ID="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

[[ -n "$REPORT_OUTPUT" ]] || { echo "--report-output is required" >&2; exit 2; }
if [[ -z "$KERNEL_ID" && -n "${KAGGLE_USERNAME:-}" ]]; then
  # Keep id and title slug in lock-step. Kaggle derives this slug from
  # "CausaGanha OPF Segmenter GPU" and may return non-zero after creating a
  # different slug when they disagree.
  KERNEL_ID="${KAGGLE_USERNAME}/causaganha-opf-segmenter-gpu"
fi
[[ "$KERNEL_ID" == */* && "$KERNEL_ID" != /* ]] || {
  echo "KAGGLE_KERNEL_ID or KAGGLE_USERNAME is required" >&2
  exit 2
}
command -v kaggle >/dev/null || { echo "kaggle CLI not found" >&2; exit 2; }

STAGE="$(mktemp -d)"
DOWNLOAD="$(mktemp -d)"
trap 'rm -rf "$STAGE" "$DOWNLOAD"' EXIT

python3 - "$REPO_URL" "$REF" "$DATA_DIR" "$EPOCHS" "$BATCH_SIZE" "$SEED" > "$STAGE/job.py" <<'PY'
import base64
from pathlib import Path
import sys

repo_url, ref, data_dir, epochs, batch_size, seed = sys.argv[1:]
worker = Path("scripts/ml/causaganha-segmenter-worker.py").read_bytes()
worker_b64 = base64.b64encode(worker).decode("ascii")

print("import base64, pathlib, runpy, sys")
print(f"pathlib.Path('/kaggle/working/worker.py').write_bytes(base64.b64decode({worker_b64!r}))")
argv = [
    "/kaggle/working/worker.py",
    "--repo-url", repo_url,
    "--ref", ref,
    "--data-dir", data_dir,
    "--epochs", epochs,
    "--batch-size", batch_size,
    "--seed", seed,
    "--output-root", "/kaggle/working/segmenter-output",
    "--report-archive", "/kaggle/working/segmenter-report.zip",
    "--model-archive", "/kaggle/working/segmenter-model.tar.gz",
]
print(f"sys.argv = {argv!r}")
print("runpy.run_path('/kaggle/working/worker.py', run_name='__main__')")
PY

cat > "$STAGE/kernel-metadata.json" <<JSON
{
  "id": "$KERNEL_ID",
  "title": "CausaGanha OPF Segmenter GPU",
  "code_file": "job.py",
  "language": "python",
  "kernel_type": "script",
  "is_private": true,
  "enable_gpu": true,
  "enable_internet": true,
  "dataset_sources": [],
  "competition_sources": [],
  "kernel_sources": [],
  "model_sources": []
}
JSON

download_report() {
  rm -rf "$DOWNLOAD"/*
  kaggle kernels output "$KERNEL_ID" -p "$DOWNLOAD" -o --file-pattern '.*segmenter-report\.zip$' >/dev/null 2>&1 || return 1
  local result
  result="$(find "$DOWNLOAD" -type f -name 'segmenter-report.zip' -print -quit)"
  [[ -n "$result" ]] || return 1
  mkdir -p "$(dirname "$REPORT_OUTPUT")"
  cp "$result" "$REPORT_OUTPUT"
}

dump_kernel_log() {
  local dir log
  dir="$(mktemp -d)"
  if kaggle kernels output "$KERNEL_ID" -p "$dir" -o -q --file-pattern '^$' >/dev/null 2>&1; then
    log="$(find "$dir" -maxdepth 1 -type f -name '*.log' -print -quit)"
    if [[ -n "$log" ]]; then
      echo "----- kaggle kernel log -----" >&2
      cat "$log" >&2 || true
      echo "----- end kaggle kernel log -----" >&2
    fi
  fi
  rm -rf "$dir"
}

# The kernel-side wall-clock budget must include dependency installation,
# model download and all requested epochs. Kaggle still enforces its own quota.
set +e
PUSH_OUTPUT="$(kaggle kernels push -p "$STAGE" --accelerator "$ACCELERATOR" -t "${KAGGLE_KERNEL_TIMEOUT:-10800}" 2>&1)"
PUSH_RC=$?
set -e
printf '%s\n' "$PUSH_OUTPUT"
if [[ $PUSH_RC -ne 0 ]] && ! grep -Eqi 'successfully pushed' <<<"$PUSH_OUTPUT"; then
  echo "Kaggle kernel push failed (exit $PUSH_RC)" >&2
  exit "$PUSH_RC"
fi

for _ in $(seq 1 "${KAGGLE_STATUS_POLLS:-400}"); do
  STATUS="$(kaggle kernels status "$KERNEL_ID" 2>&1)"
  echo "$STATUS"
  if grep -Eqi 'complete|success' <<<"$STATUS"; then
    break
  fi
  if grep -Eqi 'error|failed|cancel' <<<"$STATUS"; then
    download_report || true
    dump_kernel_log
    echo "Kaggle segmenter job failed" >&2
    exit 1
  fi
  sleep "${KAGGLE_STATUS_INTERVAL:-30}"
done

STATUS="$(kaggle kernels status "$KERNEL_ID" 2>&1)"
if ! grep -Eqi 'complete|success' <<<"$STATUS"; then
  download_report || true
  dump_kernel_log
  echo "Kaggle segmenter job did not complete within polling window: $STATUS" >&2
  exit 1
fi

download_report || { echo "Kaggle output did not contain segmenter-report.zip" >&2; exit 1; }

echo "kaggle kernel: $KERNEL_ID"
echo "kaggle report: $REPORT_OUTPUT"
echo "model archive remains preserved in the Kaggle kernel output as segmenter-model.tar.gz"
