#!/usr/bin/env bash
set -euo pipefail

PLAN=""
OUTPUT=""
BACKEND="fake"
MODEL="deterministic-tone-v1"
ACCELERATOR="${KAGGLE_ACCELERATOR:-NvidiaTeslaT4}"
KERNEL_ID="${KAGGLE_KERNEL_ID:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --plan) PLAN="$2"; shift 2 ;;
    --output) OUTPUT="$2"; shift 2 ;;
    --backend) BACKEND="$2"; shift 2 ;;
    --model) MODEL="$2"; shift 2 ;;
    --accelerator) ACCELERATOR="$2"; shift 2 ;;
    --kernel-id) KERNEL_ID="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

[[ -n "$PLAN" ]] || { echo "--plan is required" >&2; exit 2; }
[[ -n "$OUTPUT" ]] || { echo "--output is required" >&2; exit 2; }
if [[ -z "$KERNEL_ID" && -n "${KAGGLE_USERNAME:-}" ]]; then
  KERNEL_ID="${KAGGLE_USERNAME}/audiobook-factory-tts"
fi
[[ "$KERNEL_ID" == */* && "$KERNEL_ID" != /* ]] || {
  echo "KAGGLE_KERNEL_ID or KAGGLE_USERNAME is required" >&2
  exit 2
}
command -v kaggle >/dev/null || { echo "kaggle CLI not found" >&2; exit 2; }

# Prefer uv so the script's PEP 723 header decides the interpreter; fall back to
# the ambient python3 where uv is not installed.
if command -v uv >/dev/null; then
  run_script() { uv run --script "$@"; }
else
  run_script() { python3 "$@"; }
fi

# Kaggle reports only a coarse status; the real traceback lives in the kernel
# log. Without this the CI job fails with an opaque "Kaggle job failed".
dump_kernel_log() {
  local dir log
  dir="$(mktemp -d)"
  # The log is fetched regardless of --file-pattern; the pattern matches no
  # filename so we do not also pull the kernel's whole working directory, which
  # holds the multi-gigabyte model cache.
  if kaggle kernels output "$KERNEL_ID" -p "$dir" -o -q --file-pattern '^$' >/dev/null 2>&1; then
    log="$(find "$dir" -maxdepth 1 -type f -name '*.log' -print -quit)"
    if [[ -n "$log" ]]; then
      echo "----- kaggle kernel log -----" >&2
      run_script scripts/audiobook/kaggle-log.py "$log" >&2 || true
      [[ -s "$log" ]] || echo "(kernel log is empty; a cancelled kernel often exposes none)" >&2
      echo "----- end kaggle kernel log -----" >&2
    fi
  fi
  rm -rf "$dir"
}

STAGE="$(mktemp -d)"
DOWNLOAD="$(mktemp -d)"
trap 'rm -rf "$STAGE" "$DOWNLOAD"' EXIT

python3 - "$PLAN" "$BACKEND" "$MODEL" > "$STAGE/job.py" <<'PY'
import base64
import json
from pathlib import Path
import sys

plan_path, backend, model = sys.argv[1:]
worker = Path("scripts/audiobook/worker.py").read_bytes()
plan = Path(plan_path).read_bytes()
worker_b64 = base64.b64encode(worker).decode("ascii")
plan_b64 = base64.b64encode(plan).decode("ascii")

print("import base64, pathlib, runpy, sys")
print(f"pathlib.Path('/kaggle/working/worker.py').write_bytes(base64.b64decode({worker_b64!r}))")
print(f"pathlib.Path('/kaggle/working/plan.json').write_bytes(base64.b64decode({plan_b64!r}))")
argv = [
    "/kaggle/working/worker.py",
    "--plan", "/kaggle/working/plan.json",
    "--output-dir", "/kaggle/working/audiobook-output",
    "--backend", backend,
    "--model", model,
    "--result-archive", "/kaggle/working/audiobook-result.zip",
]
print(f"sys.argv = {argv!r}")
print("runpy.run_path('/kaggle/working/worker.py', run_name='__main__')")
PY

cat > "$STAGE/kernel-metadata.json" <<JSON
{
  "id": "$KERNEL_ID",
  "title": "Audiobook Factory TTS",
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

# -t is the kernel's own wall-clock budget, not a client-side push timeout: at
# 600s Kaggle killed the job mid-synthesis, after it had already spent ~2.5min
# installing the pinned torch stack and downloading the weights. Give the whole
# job room; Kaggle still caps GPU kernels at its own global maximum.
kaggle kernels push -p "$STAGE" --accelerator "$ACCELERATOR" -t "${KAGGLE_KERNEL_TIMEOUT:-${KAGGLE_PUSH_TIMEOUT:-10800}}"

for _ in $(seq 1 "${KAGGLE_STATUS_POLLS:-400}"); do
  STATUS="$(kaggle kernels status "$KERNEL_ID" 2>&1)"
  echo "$STATUS"
  if grep -Eqi 'complete|success' <<<"$STATUS"; then
    break
  fi
  if grep -Eqi 'error|failed|cancel' <<<"$STATUS"; then
    echo "Kaggle job failed" >&2
    dump_kernel_log
    exit 1
  fi
  sleep "${KAGGLE_STATUS_INTERVAL:-30}"
done

STATUS="$(kaggle kernels status "$KERNEL_ID" 2>&1)"
if ! grep -Eqi 'complete|success' <<<"$STATUS"; then
  echo "Kaggle job did not complete within polling window: $STATUS" >&2
  dump_kernel_log
  exit 1
fi

kaggle kernels output "$KERNEL_ID" -p "$DOWNLOAD" -o --file-pattern '.*audiobook-result\.zip$'
RESULT="$(find "$DOWNLOAD" -type f -name 'audiobook-result.zip' -print -quit)"
[[ -n "$RESULT" ]] || { echo "Kaggle output did not contain audiobook-result.zip" >&2; exit 1; }
mkdir -p "$(dirname "$OUTPUT")"
cp "$RESULT" "$OUTPUT"

echo "kaggle result: $OUTPUT"
