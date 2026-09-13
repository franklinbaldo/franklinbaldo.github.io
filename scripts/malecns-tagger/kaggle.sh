#!/usr/bin/env bash
set -euo pipefail

OUTPUT=""
NODES="512"
INPUT_NODES="64"
EPOCHS="3"
MAX_TRAIN_DOCS="0"
MAX_VAL_DOCS="0"
ACCELERATOR="${KAGGLE_ACCELERATOR:-NvidiaTeslaT4}"
KERNEL_ID="${KAGGLE_MALECNS_KERNEL_ID:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --output) OUTPUT="$2"; shift 2 ;;
    --nodes) NODES="$2"; shift 2 ;;
    --input-nodes) INPUT_NODES="$2"; shift 2 ;;
    --epochs) EPOCHS="$2"; shift 2 ;;
    --max-train-docs) MAX_TRAIN_DOCS="$2"; shift 2 ;;
    --max-val-docs) MAX_VAL_DOCS="$2"; shift 2 ;;
    --accelerator) ACCELERATOR="$2"; shift 2 ;;
    --kernel-id) KERNEL_ID="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

[[ -n "$OUTPUT" ]] || { echo "--output is required" >&2; exit 2; }
if [[ -z "$KERNEL_ID" && -n "${KAGGLE_USERNAME:-}" ]]; then
  # The title below resolves to this slug. Keeping both aligned avoids Kaggle
  # creating one kernel while the runner polls a different id.
  KERNEL_ID="${KAGGLE_USERNAME}/malecns-byte-tagger-experiment"
fi
[[ "$KERNEL_ID" == */* && "$KERNEL_ID" != /* ]] || {
  echo "KAGGLE_MALECNS_KERNEL_ID or KAGGLE_USERNAME is required" >&2
  exit 2
}
command -v kaggle >/dev/null || { echo "kaggle CLI not found" >&2; exit 2; }

STAGE="$(mktemp -d)"
DOWNLOAD="$(mktemp -d)"
trap 'rm -rf "$STAGE" "$DOWNLOAD"' EXIT

# Kaggle status is coarse; fetch the kernel log on failure so CI preserves the
# actual Python traceback instead of only reporting a generic failed job.
dump_kernel_log() {
  local dir log
  dir="$(mktemp -d)"
  if kaggle kernels output "$KERNEL_ID" -p "$dir" -o -q --file-pattern '^$' >/dev/null 2>&1; then
    log="$(find "$dir" -maxdepth 1 -type f -name '*.log' -print -quit)"
    if [[ -n "$log" ]]; then
      echo "----- kaggle kernel log -----" >&2
      cat "$log" >&2 || true
      [[ -s "$log" ]] || echo "(kernel log is empty)" >&2
      echo "----- end kaggle kernel log -----" >&2
    fi
  fi
  rm -rf "$dir"
}

python3 - \
  scripts/malecns-tagger/experiment.py \
  scripts/malecns-tagger/randomized_control.py \
  "$NODES" "$INPUT_NODES" "$EPOCHS" "$MAX_TRAIN_DOCS" "$MAX_VAL_DOCS" \
  > "$STAGE/job.py" <<'PY'
import base64
from pathlib import Path
import sys

experiment_path, control_path, nodes, input_nodes, epochs, max_train_docs, max_val_docs = sys.argv[1:]
experiment_b64 = base64.b64encode(Path(experiment_path).read_bytes()).decode("ascii")
control_b64 = base64.b64encode(Path(control_path).read_bytes()).decode("ascii")

print("import base64, importlib.util, pathlib, shutil, subprocess, sys")
print("def ensure(module, package):")
print("    if importlib.util.find_spec(module) is None:")
print("        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '--disable-pip-version-check', package])")
print("ensure('numpy', 'numpy>=2.0')")
print("ensure('pyarrow', 'pyarrow>=19.0')")
print("ensure('torch', 'torch>=2.6')")
print(f"pathlib.Path('/kaggle/working/experiment.py').write_bytes(base64.b64decode({experiment_b64!r}))")
print(f"pathlib.Path('/kaggle/working/randomized_control.py').write_bytes(base64.b64decode({control_b64!r}))")
experiment_argv = [
    "/kaggle/working/experiment.py", "run",
    "--graph", "malecns",
    "--nodes", nodes,
    "--input-nodes", input_nodes,
    "--epochs", epochs,
    "--max-train-docs", max_train_docs,
    "--max-val-docs", max_val_docs,
    "--work-dir", "/kaggle/working/cache",
    "--output-dir", "/kaggle/working/result",
]
control_argv = [
    "/kaggle/working/randomized_control.py",
    "--work-dir", "/kaggle/working/cache",
    "--output-dir", "/kaggle/working/result",
]
print(f"subprocess.check_call([sys.executable] + {experiment_argv!r})")
print(f"subprocess.check_call([sys.executable] + {control_argv!r})")
print("shutil.make_archive('/kaggle/working/malecns-tagger-result', 'zip', '/kaggle/working/result')")
PY

cat > "$STAGE/kernel-metadata.json" <<JSON
{
  "id": "$KERNEL_ID",
  "title": "MaleCNS byte tagger experiment",
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

kaggle kernels push -p "$STAGE" --accelerator "$ACCELERATOR" -t "${KAGGLE_MALECNS_TIMEOUT:-10800}"

for _ in $(seq 1 "${KAGGLE_STATUS_POLLS:-400}"); do
  STATUS="$(kaggle kernels status "$KERNEL_ID" 2>&1 || true)"
  echo "$STATUS"
  if grep -Eqi 'complete|success' <<<"$STATUS"; then
    break
  fi
  if grep -Eqi 'error|failed|cancel' <<<"$STATUS"; then
    echo "Kaggle MaleCNS job failed" >&2
    dump_kernel_log
    exit 1
  fi
  if grep -Eqi 'not found|404|does not exist' <<<"$STATUS"; then
    echo "Kaggle kernel id did not resolve: $KERNEL_ID" >&2
    exit 1
  fi
  sleep "${KAGGLE_STATUS_INTERVAL:-30}"
done

STATUS="$(kaggle kernels status "$KERNEL_ID" 2>&1 || true)"
if ! grep -Eqi 'complete|success' <<<"$STATUS"; then
  echo "Kaggle MaleCNS job did not complete: $STATUS" >&2
  dump_kernel_log
  exit 1
fi

# Use a character class for the literal dot. The previous `\\.` pattern was
# passed to Kaggle as a literal backslash and therefore missed a valid archive.
kaggle kernels output "$KERNEL_ID" -p "$DOWNLOAD" -o --file-pattern '.*malecns-tagger-result[.]zip$'
RESULT="$(find "$DOWNLOAD" -type f -name 'malecns-tagger-result.zip' -print -quit)"
[[ -n "$RESULT" ]] || { echo "Kaggle output did not contain malecns-tagger-result.zip" >&2; dump_kernel_log; exit 1; }
mkdir -p "$(dirname "$OUTPUT")"
cp "$RESULT" "$OUTPUT"
echo "kaggle result: $OUTPUT"
