#!/usr/bin/env bash
set -euo pipefail

OUTPUT=""
ACCELERATOR="${KAGGLE_ACCELERATOR:-NvidiaTeslaT4}"
KERNEL_ID="${KAGGLE_MALECNS_CONFIRMATORY_KERNEL_ID:-}"
PAPERS_REF="${PAPERS_REF:-d532920bbe3c3171d0651776a6409df79a049944}"
CAUSAGANHA_REF="${CAUSAGANHA_REF:-7c3d6557bb692932553622ae6e00493ba04e534f}"
EXPECTED_FEATURES_HASH="${EXPECTED_FEATURES_HASH:-}"
EXPECTED_GRAPH_HASH="${EXPECTED_GRAPH_HASH:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --output) OUTPUT="$2"; shift 2 ;;
    --accelerator) ACCELERATOR="$2"; shift 2 ;;
    --kernel-id) KERNEL_ID="$2"; shift 2 ;;
    --papers-ref) PAPERS_REF="$2"; shift 2 ;;
    --causaganha-ref) CAUSAGANHA_REF="$2"; shift 2 ;;
    --expected-features-hash) EXPECTED_FEATURES_HASH="$2"; shift 2 ;;
    --expected-graph-hash) EXPECTED_GRAPH_HASH="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

[[ -n "$OUTPUT" ]] || { echo "--output is required" >&2; exit 2; }
if [[ -z "$KERNEL_ID" && -n "${KAGGLE_USERNAME:-}" ]]; then
  KERNEL_ID="${KAGGLE_USERNAME}/malecns-confirmatory-gpu-cache"
fi
[[ "$KERNEL_ID" == */* && "$KERNEL_ID" != /* ]] || {
  echo "KAGGLE_MALECNS_CONFIRMATORY_KERNEL_ID or KAGGLE_USERNAME is required" >&2
  exit 2
}
command -v kaggle >/dev/null || { echo "kaggle CLI not found" >&2; exit 2; }

STAGE="$(mktemp -d)"
DOWNLOAD="$(mktemp -d)"
trap 'rm -rf "$STAGE" "$DOWNLOAD"' EXIT

cat > "$STAGE/job.py" <<'PY'
import json
import os
import pathlib
import shutil
import subprocess
import sys


def run(*args, cwd=None):
    print("+", " ".join(map(str, args)), flush=True)
    subprocess.check_call([str(x) for x in args], cwd=cwd)


papers_ref = os.environ["PAPERS_REF"]
causaganha_ref = os.environ["CAUSAGANHA_REF"]
expected_features = os.environ.get("EXPECTED_FEATURES_HASH", "")
expected_graph = os.environ.get("EXPECTED_GRAPH_HASH", "")
work = pathlib.Path("/kaggle/working")
papers = work / "papers"
causaganha = work / "causaganha"
runtime = work / "runtime"
cache = work / "state-cache"
runtime.mkdir(exist_ok=True)
cache.mkdir(exist_ok=True)

run("git", "clone", "--filter=blob:none", "https://github.com/franklinbaldo/papers.git", papers)
run("git", "checkout", papers_ref, cwd=papers)
run("git", "clone", "--filter=blob:none", "https://github.com/franklinbaldo/causaganha.git", causaganha)
run("git", "checkout", causaganha_ref, cwd=causaganha)

experiment = papers / "experiments/malecns_wifi"
run(
    sys.executable,
    "-m",
    "pip",
    "install",
    "--disable-pip-version-check",
    "-e",
    f"{experiment}[train]",
    "transformers>=4.51",
    "sentencepiece",
)

# The inputs are downloaded, not rebuilt. Rebuilding them inside the kernel
# produced a different experiment, not merely different rounding: the kernel's
# corpus slice yielded 3 documents / 59 chunks against the CPU reference's
# 17 documents / 355 chunks, with one tag left at zero positives. The fingerprint
# gate caught it. Pinned bytes turn that gate into a transport check, which is a
# question it can actually answer, and the CPU run stays the sole reference.
inputs_release = os.environ.get("INPUTS_RELEASE", "malecns-confirmatory-inputs-v1")
base = f"https://github.com/franklinbaldo/papers/releases/download/{inputs_release}"
graph_dir = runtime / "graph"
graph_dir.mkdir(parents=True, exist_ok=True)
graph = graph_dir / "graph.npz"
features = runtime / "multitag-features.features.npz"
def fetch(url, dest, attempts=5):
    import time
    import urllib.request
    for attempt in range(1, attempts + 1):
        try:
            with urllib.request.urlopen(url, timeout=120) as response:
                dest.write_bytes(response.read())
            print(f"  {dest.name}: {dest.stat().st_size} bytes", flush=True)
            return
        except Exception as error:
            print(f"  {dest.name}: attempt {attempt} failed: {error}", flush=True)
            if attempt == attempts:
                raise
            time.sleep(5 * attempt)


for url, dest in (
    (f"{base}/graph.npz", graph),
    (f"{base}/manifest.json", graph_dir / "manifest.json"),
    (f"{base}/multitag-features.features.npz", features),
):
    fetch(url, dest)
feature_report = None

args = [
    sys.executable,
    experiment / "scripts/warm_confirmatory_cache_gpu.py",
    "--features",
    features,
    "--graph",
    graph,
    "--state-cache",
    cache,
    "--manifest",
    runtime / "gpu-cache-manifest.json",
    "--device",
    "cuda",
]
if expected_features:
    args += ["--expected-features-hash", expected_features]
if expected_graph:
    args += ["--expected-graph-hash", expected_graph]
run(*args, cwd=experiment)

archive_root = work / "malecns-confirmatory-gpu-cache"
archive_root.mkdir(exist_ok=True)
shutil.copytree(cache, archive_root / "state-cache", dirs_exist_ok=True)
shutil.copy2(runtime / "gpu-cache-manifest.json", archive_root / "gpu-cache-manifest.json")
if feature_report is not None and feature_report.exists():
    shutil.copy2(feature_report, archive_root / "feature-report.json")
manifest = {
    "papers_ref": papers_ref,
    "causaganha_ref": causaganha_ref,
    "graph_manifest": json.loads((graph_dir / "manifest.json").read_text()),
    "inputs_release": inputs_release,
    "inputs_source": "github release assets, not recomputed in-kernel",
}
(archive_root / "provenance.json").write_text(json.dumps(manifest, indent=2) + "\n")
shutil.make_archive(
    "/kaggle/working/malecns-confirmatory-gpu-cache",
    "zip",
    archive_root,
)
PY

cat > "$STAGE/kernel-metadata.json" <<JSON
{
  "id": "$KERNEL_ID",
  "title": "MaleCNS Confirmatory GPU Cache",
  "code_file": "job.py",
  "language": "python",
  "kernel_type": "script",
  "is_private": false,
  "enable_gpu": true,
  "enable_internet": true,
  "dataset_sources": [],
  "competition_sources": [],
  "kernel_sources": [],
  "model_sources": []
}
JSON

python3 - "$STAGE/job.py" "$PAPERS_REF" "$CAUSAGANHA_REF" "$EXPECTED_FEATURES_HASH" "$EXPECTED_GRAPH_HASH" <<'PY'
from pathlib import Path
import sys
path = Path(sys.argv[1])
text = path.read_text()
values = {
    "PAPERS_REF": sys.argv[2],
    "CAUSAGANHA_REF": sys.argv[3],
    "EXPECTED_FEATURES_HASH": sys.argv[4],
    "EXPECTED_GRAPH_HASH": sys.argv[5],
}
prefix = "import os\n"
for key, value in values.items():
    prefix += f"os.environ[{key!r}] = {value!r}\n"
path.write_text(prefix + text)
PY

kaggle kernels push -p "$STAGE" --accelerator "$ACCELERATOR" -t "${KAGGLE_MALECNS_TIMEOUT:-21600}"

for _ in $(seq 1 "${KAGGLE_STATUS_POLLS:-720}"); do
  STATUS="$(kaggle kernels status "$KERNEL_ID" 2>&1 || true)"
  echo "$STATUS"
  if grep -Eqi 'complete|success' <<<"$STATUS"; then
    break
  fi
  if grep -Eqi 'error|failed|cancel' <<<"$STATUS"; then
    echo "Kaggle confirmatory GPU cache job failed" >&2
    exit 1
  fi
  sleep "${KAGGLE_STATUS_INTERVAL:-30}"
done

STATUS="$(kaggle kernels status "$KERNEL_ID" 2>&1 || true)"
if ! grep -Eqi 'complete|success' <<<"$STATUS"; then
  echo "Kaggle job did not complete: $STATUS" >&2
  exit 1
fi

# Kaggle's output-list endpoint can briefly return 429 immediately after a kernel
# completes. Retrying download is safe: the completed kernel is immutable.
sleep 10
DOWNLOADED=0
for attempt in $(seq 1 8); do
  rm -rf "$DOWNLOAD"/*
  if kaggle kernels output "$KERNEL_ID" -p "$DOWNLOAD" -o \
      --file-pattern '.*malecns-confirmatory-gpu-cache[.]zip$'; then
    DOWNLOADED=1
    break
  fi
  echo "Kaggle output download attempt $attempt failed; retrying" >&2
  sleep $((attempt * 15))
done
[[ "$DOWNLOADED" == 1 ]] || { echo "Kaggle output remained unavailable after retries" >&2; exit 1; }

RESULT="$(find "$DOWNLOAD" -type f -name 'malecns-confirmatory-gpu-cache.zip' -print -quit)"
[[ -n "$RESULT" ]] || { echo "Kaggle output did not contain cache zip" >&2; exit 1; }
mkdir -p "$(dirname "$OUTPUT")"
cp "$RESULT" "$OUTPUT"
echo "kaggle result: $OUTPUT"
