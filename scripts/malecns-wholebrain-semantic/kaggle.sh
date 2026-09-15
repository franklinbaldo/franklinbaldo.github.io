#!/usr/bin/env bash
set -euo pipefail

OUTPUT_DIR=""
ACCELERATOR="${KAGGLE_ACCELERATOR:-NvidiaTeslaT4}"
KERNEL_ID="${KAGGLE_MALECNS_WHOLEBRAIN_KERNEL_ID:-}"
PAPERS_REF="${PAPERS_REF:-1d8412d3af1e28b379b1242f6e71978b1a7ee284}"
RELEASE_BASE="${MALECNS_CONFIRMATORY_RELEASE_BASE:-https://github.com/franklinbaldo/papers/releases/download/malecns-confirmatory-inputs-v1}"
EXPECTED_FEATURES_HASH="${EXPECTED_FEATURES_HASH:-ab494d7e0b615c9633e7}"
EXPECTED_GRAPH_HASH="${EXPECTED_GRAPH_HASH:-214106d04307618db054cb977a691d48d431b771}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --output-dir) OUTPUT_DIR="$2"; shift 2 ;;
    --accelerator) ACCELERATOR="$2"; shift 2 ;;
    --kernel-id) KERNEL_ID="$2"; shift 2 ;;
    --papers-ref) PAPERS_REF="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

[[ -n "$OUTPUT_DIR" ]] || { echo "--output-dir is required" >&2; exit 2; }
[[ -n "${KAGGLE_USERNAME:-}" ]] || { echo "KAGGLE_USERNAME is required" >&2; exit 2; }
if [[ -z "$KERNEL_ID" ]]; then
  KERNEL_ID="${KAGGLE_USERNAME}/malecns-wholebrain-semantic-smoke"
fi
[[ "$KERNEL_ID" == */* && "$KERNEL_ID" != /* ]] || { echo "invalid Kaggle kernel id: $KERNEL_ID" >&2; exit 2; }
command -v kaggle >/dev/null || { echo "kaggle CLI not found" >&2; exit 2; }

STAGE="$(mktemp -d)"
DOWNLOAD="$(mktemp -d)"
trap 'rm -rf "$STAGE" "$DOWNLOAD"' EXIT
mkdir -p "$OUTPUT_DIR"

cat > "$STAGE/job.py" <<'PY'
import hashlib
import json
import os
import pathlib
import shutil
import subprocess
import sys
import urllib.request

import numpy as np


def run(*args, cwd=None):
    print("+", " ".join(map(str, args)), flush=True)
    subprocess.check_call([str(x) for x in args], cwd=cwd)


def fingerprint(array):
    values = np.ascontiguousarray(np.asarray(array, dtype=np.float32))
    digest = hashlib.blake2b(values.tobytes(), digest_size=10)
    digest.update(str(values.shape).encode())
    return digest.hexdigest()


papers_ref = os.environ["PAPERS_REF"]
kernel_id = os.environ["KERNEL_ID"]
release_base = os.environ["RELEASE_BASE"]
expected_features = os.environ["EXPECTED_FEATURES_HASH"]
expected_graph = os.environ["EXPECTED_GRAPH_HASH"]
work = pathlib.Path("/kaggle/working")
scratch = pathlib.Path("/kaggle/temp/malecns-wholebrain-semantic")
scratch.mkdir(parents=True, exist_ok=True)
repo = scratch / "papers"
inputs = scratch / "inputs"
inputs.mkdir(exist_ok=True)
out = work / "wholebrain-smoke"
public_cache = work / "public-cache"
out.mkdir(exist_ok=True)
public_cache.mkdir(exist_ok=True)

run("git", "clone", "--filter=blob:none", "https://github.com/franklinbaldo/papers.git", repo)
run("git", "checkout", papers_ref, cwd=repo)
exp = repo / "experiments/malecns_wifi"
run(sys.executable, "-m", "pip", "install", "--disable-pip-version-check", "-e", f"{exp}[train]")

graph = inputs / "graph.npz"
features = inputs / "features.npz"
urllib.request.urlretrieve(f"{release_base}/graph.npz", graph)
urllib.request.urlretrieve(f"{release_base}/multitag-features.features.npz", features)

stored = np.load(features, allow_pickle=False)
block = np.hstack([stored["absolute"], stored["sensation"]])
features_hash = fingerprint(block)
from malecns_wifi import load_graph
matrix = load_graph(graph)
graph_hash = fingerprint(matrix.data) + fingerprint(matrix.indices.astype(np.float32))
print(json.dumps({
    "event": "input_gate",
    "features_hash": features_hash,
    "graph_hash": graph_hash,
    "chunks": int(len(block)),
}), flush=True)
if features_hash != expected_features:
    raise SystemExit(f"feature fingerprint mismatch: {features_hash} != {expected_features}")
if graph_hash != expected_graph:
    raise SystemExit(f"graph fingerprint mismatch: {graph_hash} != {expected_graph}")
if len(block) != 355:
    raise SystemExit(f"expected 355 chunks, got {len(block)}")

report = out / "gpu-smoke.json"
run(
    sys.executable,
    exp / "scripts/smoke_wholebrain_gpu.py",
    "--features", features,
    "--graph", graph,
    "--output", report,
    "--seed", "0",
    "--depths", "4", "16",
    "--readout-width", "1314",
    cwd=exp,
)

payload = json.loads(report.read_text(encoding="utf-8"))
payload.update({
    "papers_ref": papers_ref,
    "features_hash": features_hash,
    "graph_hash": graph_hash,
    "kernel": kernel_id,
    "kernel_url": f"https://www.kaggle.com/code/{kernel_id}",
    "kernel_visibility": "public",
})
summary = work / "github-summary.json"
summary.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
provenance = work / "provenance.json"
provenance.write_text(json.dumps({
    "papers_ref": papers_ref,
    "features_hash": features_hash,
    "graph_hash": graph_hash,
    "release_base": release_base,
    "kernel": kernel_id,
    "kernel_url": payload["kernel_url"],
    "claim_status": payload["claim_status"],
}, indent=2, sort_keys=True) + "\n", encoding="utf-8")

for src, name in (
    (summary, "github-summary.json"),
    (report, "gpu-smoke.json"),
    (provenance, "provenance.json"),
):
    shutil.copy2(src, public_cache / name)
print(json.dumps({"event": "public_cache_ready", "files": sorted(p.name for p in public_cache.iterdir())}), flush=True)
PY

python3 - "$STAGE/job.py" "$PAPERS_REF" "$KERNEL_ID" "$RELEASE_BASE" "$EXPECTED_FEATURES_HASH" "$EXPECTED_GRAPH_HASH" <<'PY'
from pathlib import Path
import sys
path = Path(sys.argv[1])
text = path.read_text(encoding="utf-8")
prefix = (
    "import os\n"
    f"os.environ['PAPERS_REF'] = {sys.argv[2]!r}\n"
    f"os.environ['KERNEL_ID'] = {sys.argv[3]!r}\n"
    f"os.environ['RELEASE_BASE'] = {sys.argv[4]!r}\n"
    f"os.environ['EXPECTED_FEATURES_HASH'] = {sys.argv[5]!r}\n"
    f"os.environ['EXPECTED_GRAPH_HASH'] = {sys.argv[6]!r}\n"
)
path.write_text(prefix + text, encoding="utf-8")
PY

cat > "$STAGE/kernel-metadata.json" <<JSON
{
  "id": "$KERNEL_ID",
  "title": "MaleCNS Whole-Brain Semantic GPU Smoke",
  "code_file": "job.py",
  "language": "python",
  "kernel_type": "script",
  "is_private": false,
  "enable_gpu": true,
  "enable_internet": true,
  "machine_shape": "$ACCELERATOR",
  "dataset_sources": [],
  "competition_sources": [],
  "kernel_sources": [],
  "model_sources": []
}
JSON

kaggle kernels push -p "$STAGE" --accelerator "$ACCELERATOR" -t "${KAGGLE_MALECNS_WHOLEBRAIN_TIMEOUT:-21600}"
echo "Public Kaggle kernel: https://www.kaggle.com/code/$KERNEL_ID"

kaggle kernels logs "$KERNEL_ID" --follow --interval "${KAGGLE_WHOLEBRAIN_LOG_INTERVAL:-10}" || true

deadline=$(( $(date +%s) + ${KAGGLE_MALECNS_WHOLEBRAIN_WAIT_SECONDS:-21600} ))
while :; do
  STATUS="$(kaggle kernels status "$KERNEL_ID" 2>&1 || true)"
  echo "$STATUS"
  if grep -Eqi 'KernelWorkerStatus[.](COMPLETE|SUCCESS)' <<<"$STATUS"; then
    break
  fi
  if grep -Eqi 'KernelWorkerStatus[.](ERROR|CANCEL|FAILED)' <<<"$STATUS"; then
    echo "Kaggle kernel itself reported failure" >&2
    exit 1
  fi
  if (( $(date +%s) >= deadline )); then
    echo "Kaggle kernel did not reach COMPLETE before deadline" >&2
    exit 1
  fi
  sleep 20
done

delay=10
downloaded=0
for attempt in $(seq 1 10); do
  rm -rf "${DOWNLOAD:?}"/*
  if kaggle kernels output "$KERNEL_ID" -p "$DOWNLOAD" -o \
      --file-pattern '.*(github-summary[.]json|gpu-smoke[.]json|provenance[.]json)$'; then
    downloaded=1
    break
  fi
  echo "output attempt $attempt failed; retrying after ${delay}s" >&2
  sleep "$delay"
  delay=$(( delay < 80 ? delay * 2 : 80 ))
done
[[ "$downloaded" == 1 ]] || { echo "small public cache remained unavailable" >&2; exit 1; }

for name in github-summary.json gpu-smoke.json provenance.json; do
  src="$(find "$DOWNLOAD" -type f -name "$name" -print -quit)"
  [[ -n "$src" ]] || { echo "missing $name in Kaggle output" >&2; exit 1; }
  cp "$src" "$OUTPUT_DIR/$name"
done
