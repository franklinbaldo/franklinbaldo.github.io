#!/usr/bin/env bash
set -euo pipefail

OUTPUT=""
ACCELERATOR="${KAGGLE_ACCELERATOR:-NvidiaTeslaT4}"
KERNEL_ID="${KAGGLE_MALECNS_CONFIRMATORY_KERNEL_ID:-}"
PAPERS_REF="${PAPERS_REF:-a1fb6ef647f1cc4985dc3caedd8a2e4e3f28ccc8}"
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

# Pin both repositories before doing any computation. The state-cache key itself
# still fingerprints the actual graph/features; these refs are provenance, not trust.
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

# 1) Rebuild the connectome with the exact compiler at PAPERS_REF. MaleCNS
# source files are public and the compiler records their hashes in the manifest.
graph_dir = runtime / "graph"
run(
    sys.executable,
    experiment / "scripts/compile_connectome.py",
    "--output",
    graph_dir,
    "--cache",
    work / "malecns-source-cache",
    cwd=experiment,
)
graph = graph_dir / "graph.npz"

# 2) Rebuild the 1,924-d MiniLM feature block used by the current confirmatory
# run: 384 absolute + two 385-d relations and their deltas = 1,924.
# The held-out semantic corpus is the 17-document CausaGanha segmenter test split.
feature_report = runtime / "minilm-confirmatory.json"
tags = [
    "resultado",
    "ref_processual",
    "cabecalho_inicio",
    "relatorio_inicio",
    "dispositivo_abertura",
    "relatorio_fim",
    "capitulo_merito_inicio",
    "encerramento_inicio",
    "fim",
]
run(
    sys.executable,
    experiment / "scripts/real_encoder_gate.py",
    "--corpus",
    causaganha / "data/segmenter_splits/test.jsonl",
    "--model",
    "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
    "--device",
    "cuda",
    "--pooling",
    "mean",
    "--fine-size",
    "64",
    "--scales",
    "256",
    "512",
    "--tags",
    *tags,
    "--output",
    feature_report,
    cwd=experiment,
)
features = feature_report.with_suffix(".features.npz")

# 3) Warm exactly the cache consumed by run_confirmatory.py. The warmer refuses
# to write anything until a real CPU-vs-CUDA parity check on the full operator passes.
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

# Keep the download limited to reusable state cache + provenance. Graph/features
# are reproducible and their content fingerprints are already in the GPU manifest.
archive_root = work / "malecns-confirmatory-gpu-cache"
archive_root.mkdir(exist_ok=True)
shutil.copytree(cache, archive_root / "state-cache", dirs_exist_ok=True)
shutil.copy2(runtime / "gpu-cache-manifest.json", archive_root / "gpu-cache-manifest.json")
shutil.copy2(feature_report, archive_root / "feature-report.json")
manifest = {
    "papers_ref": papers_ref,
    "causaganha_ref": causaganha_ref,
    "graph_manifest": json.loads((graph_dir / "manifest.json").read_text()),
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
  "title": "MaleCNS confirmatory GPU cache warmer",
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

export PAPERS_REF CAUSAGANHA_REF EXPECTED_FEATURES_HASH EXPECTED_GRAPH_HASH
# Environment variables are not automatically visible inside a Kaggle kernel.
# Bake only non-secret refs/fingerprints into job.py; Kaggle credentials remain on
# the GitHub runner and are never embedded in the job.
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

kaggle kernels output "$KERNEL_ID" -p "$DOWNLOAD" -o --file-pattern '.*malecns-confirmatory-gpu-cache[.]zip$'
RESULT="$(find "$DOWNLOAD" -type f -name 'malecns-confirmatory-gpu-cache.zip' -print -quit)"
[[ -n "$RESULT" ]] || { echo "Kaggle output did not contain cache zip" >&2; exit 1; }
mkdir -p "$(dirname "$OUTPUT")"
cp "$RESULT" "$OUTPUT"
echo "kaggle result: $OUTPUT"
