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
  KERNEL_ID="${KAGGLE_USERNAME}/malecns-byte-tagger"
fi
[[ "$KERNEL_ID" == */* && "$KERNEL_ID" != /* ]] || {
  echo "KAGGLE_MALECNS_KERNEL_ID or KAGGLE_USERNAME is required" >&2
  exit 2
}
command -v kaggle >/dev/null || { echo "kaggle CLI not found" >&2; exit 2; }

STAGE="$(mktemp -d)"
DOWNLOAD="$(mktemp -d)"
trap 'rm -rf "$STAGE" "$DOWNLOAD"' EXIT

python3 - \
  scripts/malecns-tagger/experiment.py \
  "$NODES" "$INPUT_NODES" "$EPOCHS" "$MAX_TRAIN_DOCS" "$MAX_VAL_DOCS" \
  > "$STAGE/job.py" <<'PY'
import base64
from pathlib import Path
import sys

script_path, nodes, input_nodes, epochs, max_train_docs, max_val_docs = sys.argv[1:]
script_b64 = base64.b64encode(Path(script_path).read_bytes()).decode("ascii")

print("import base64, importlib.util, pathlib, shutil, subprocess, sys")
print("def ensure(module, package):")
print("    if importlib.util.find_spec(module) is None:")
print("        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '--disable-pip-version-check', package])")
print("ensure('numpy', 'numpy>=2.0')")
print("ensure('pyarrow', 'pyarrow>=19.0')")
print("ensure('torch', 'torch>=2.6')")
print(f"pathlib.Path('/kaggle/working/experiment.py').write_bytes(base64.b64decode({script_b64!r}))")
argv = [
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
print(f"subprocess.check_call([sys.executable] + {argv[1:]!r})")
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
  STATUS="$(kaggle kernels status "$KERNEL_ID" 2>&1)"
  echo "$STATUS"
  if grep -Eqi 'complete|success' <<<"$STATUS"; then
    break
  fi
  if grep -Eqi 'error|failed|cancel' <<<"$STATUS"; then
    echo "Kaggle MaleCNS job failed" >&2
    exit 1
  fi
  sleep "${KAGGLE_STATUS_INTERVAL:-30}"
done

STATUS="$(kaggle kernels status "$KERNEL_ID" 2>&1)"
if ! grep -Eqi 'complete|success' <<<"$STATUS"; then
  echo "Kaggle MaleCNS job did not complete: $STATUS" >&2
  exit 1
fi

kaggle kernels output "$KERNEL_ID" -p "$DOWNLOAD" -o --file-pattern '.*malecns-tagger-result\\.zip$'
RESULT="$(find "$DOWNLOAD" -type f -name 'malecns-tagger-result.zip' -print -quit)"
[[ -n "$RESULT" ]] || { echo "Kaggle output did not contain malecns-tagger-result.zip" >&2; exit 1; }
mkdir -p "$(dirname "$OUTPUT")"
cp "$RESULT" "$OUTPUT"
echo "kaggle result: $OUTPUT"
