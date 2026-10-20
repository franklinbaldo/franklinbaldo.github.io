#!/usr/bin/env bash
set -euo pipefail

OUTPUT=""
NODES="512"
INPUT_NODES="64"
SEEDS="20260912,20260913,20260914,20260915,20260916"
MAX_EPOCHS="30"
MIN_EPOCHS="5"
PATIENCE="5"
ACCELERATOR="${KAGGLE_ACCELERATOR:-NvidiaTeslaT4}"
KERNEL_ID="${KAGGLE_MALECNS_V2_KERNEL_ID:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --output) OUTPUT="$2"; shift 2 ;;
    --nodes) NODES="$2"; shift 2 ;;
    --input-nodes) INPUT_NODES="$2"; shift 2 ;;
    --seeds) SEEDS="$2"; shift 2 ;;
    --max-epochs) MAX_EPOCHS="$2"; shift 2 ;;
    --min-epochs) MIN_EPOCHS="$2"; shift 2 ;;
    --patience) PATIENCE="$2"; shift 2 ;;
    --accelerator) ACCELERATOR="$2"; shift 2 ;;
    --kernel-id) KERNEL_ID="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

[[ -n "$OUTPUT" ]] || { echo "--output is required" >&2; exit 2; }
if [[ -z "$KERNEL_ID" && -n "${KAGGLE_USERNAME:-}" ]]; then
  KERNEL_ID="${KAGGLE_USERNAME}/malecns-byte-tagger-v2"
fi
[[ "$KERNEL_ID" == */* && "$KERNEL_ID" != /* ]] || {
  echo "KAGGLE_MALECNS_V2_KERNEL_ID or KAGGLE_USERNAME is required" >&2
  exit 2
}
command -v kaggle >/dev/null || { echo "kaggle CLI not found" >&2; exit 2; }

STAGE="$(mktemp -d)"
DOWNLOAD="$(mktemp -d)"
trap 'rm -rf "$STAGE" "$DOWNLOAD"' EXIT

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

python3 - \
  scripts/malecns-tagger/experiment.py \
  scripts/malecns-tagger/randomized_control.py \
  scripts/malecns-tagger/v2.py \
  "$NODES" "$INPUT_NODES" "$SEEDS" "$MAX_EPOCHS" "$MIN_EPOCHS" "$PATIENCE" \
  > "$STAGE/job.py" <<'PY'
import base64
from pathlib import Path
import sys

experiment_path, control_path, v2_path, nodes, input_nodes, seeds, max_epochs, min_epochs, patience = sys.argv[1:]
files = {
    "experiment.py": experiment_path,
    "randomized_control.py": control_path,
    "v2.py": v2_path,
}
encoded = {name: base64.b64encode(Path(path).read_bytes()).decode("ascii") for name, path in files.items()}

print("import base64, importlib.util, pathlib, shutil, subprocess, sys")
print("def ensure(module, package):")
print("    if importlib.util.find_spec(module) is None:")
print("        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '--disable-pip-version-check', package])")
print("ensure('numpy', 'numpy>=2.0')")
print("ensure('pyarrow', 'pyarrow>=19.0')")
print("ensure('torch', 'torch>=2.6')")
for name, payload in encoded.items():
    print(f"pathlib.Path('/kaggle/working/{name}').write_bytes(base64.b64decode({payload!r}))")
argv = [
    "/kaggle/working/v2.py",
    "--nodes", nodes,
    "--input-nodes", input_nodes,
    "--seeds", seeds,
    "--max-epochs", max_epochs,
    "--min-epochs", min_epochs,
    "--patience", patience,
    "--work-dir", "/kaggle/working/cache",
    "--output-dir", "/kaggle/working/result",
]
print(f"subprocess.check_call([sys.executable] + {argv!r})")
print("shutil.make_archive('/kaggle/working/malecns-tagger-v2-result', 'zip', '/kaggle/working/result')")
PY

cat > "$STAGE/kernel-metadata.json" <<JSON
{
  "id": "$KERNEL_ID",
  "title": "MaleCNS byte tagger v2",
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

kaggle kernels push -p "$STAGE" --accelerator "$ACCELERATOR" -t "${KAGGLE_MALECNS_V2_TIMEOUT:-10800}"

for _ in $(seq 1 "${KAGGLE_STATUS_POLLS:-400}"); do
  STATUS="$(kaggle kernels status "$KERNEL_ID" 2>&1 || true)"
  echo "$STATUS"
  if grep -Eqi 'complete|success' <<<"$STATUS"; then break; fi
  if grep -Eqi 'error|failed|cancel' <<<"$STATUS"; then
    echo "Kaggle MaleCNS v2 job failed" >&2; dump_kernel_log; exit 1
  fi
  if grep -Eqi 'not found|404|does not exist' <<<"$STATUS"; then
    echo "Kaggle kernel id did not resolve: $KERNEL_ID" >&2; exit 1
  fi
  sleep "${KAGGLE_STATUS_INTERVAL:-30}"
done

STATUS="$(kaggle kernels status "$KERNEL_ID" 2>&1 || true)"
if ! grep -Eqi 'complete|success' <<<"$STATUS"; then
  echo "Kaggle MaleCNS v2 job did not complete: $STATUS" >&2; dump_kernel_log; exit 1
fi

kaggle kernels output "$KERNEL_ID" -p "$DOWNLOAD" -o --file-pattern '.*malecns-tagger-v2-result[.]zip$'
RESULT="$(find "$DOWNLOAD" -type f -name 'malecns-tagger-v2-result.zip' -print -quit)"
[[ -n "$RESULT" ]] || { echo "Kaggle output missing malecns-tagger-v2-result.zip" >&2; dump_kernel_log; exit 1; }
mkdir -p "$(dirname "$OUTPUT")"
cp "$RESULT" "$OUTPUT"
echo "kaggle result: $OUTPUT"
