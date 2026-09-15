#!/usr/bin/env bash
set -euo pipefail

OUTPUT_DIR=""
ACCELERATOR="${KAGGLE_ACCELERATOR:-NvidiaTeslaT4}"
KERNEL_ID="${KAGGLE_MALECNS_CACHE_KERNEL_ID:-}"
PAPERS_REF="${PAPERS_REF:-42aa0e8e678fae35fea4eb5314b505bc03ecfa2b}"
RELEASE_BASE="${MALECNS_CONFIRMATORY_RELEASE_BASE:-https://github.com/franklinbaldo/papers/releases/download/malecns-confirmatory-inputs-v1}"

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
[[ -n "$KERNEL_ID" ]] || KERNEL_ID="${KAGGLE_USERNAME}/malecns-semantic-cache-test"
command -v kaggle >/dev/null || { echo "kaggle CLI not found" >&2; exit 2; }

STAGE="$(mktemp -d)"
DOWNLOAD="$(mktemp -d)"
trap 'rm -rf "$STAGE" "$DOWNLOAD"' EXIT
mkdir -p "$OUTPUT_DIR"

cat > "$STAGE/job.py" <<'PY'
import json, os, pathlib, shutil, subprocess, sys, time, urllib.request

def run(*args, cwd=None, env=None):
    print("+", " ".join(map(str, args)), flush=True)
    subprocess.check_call([str(x) for x in args], cwd=cwd, env=env)

papers_ref = os.environ["PAPERS_REF"]
kernel_id = os.environ["KERNEL_ID"]
release_base = os.environ["RELEASE_BASE"]
work = pathlib.Path("/kaggle/working")
scratch = pathlib.Path("/kaggle/temp/malecns-semantic-cache")
scratch.mkdir(parents=True, exist_ok=True)
papers = scratch / "papers"
inputs = scratch / "inputs"; inputs.mkdir(exist_ok=True)
out = work / "semantic-cache-test"; out.mkdir(exist_ok=True)
public = work / "public-cache"; public.mkdir(exist_ok=True)

run("git", "clone", "--filter=blob:none", "https://github.com/franklinbaldo/papers.git", papers)
run("git", "checkout", papers_ref, cwd=papers)
exp = papers / "experiments/malecns_wifi"
run(sys.executable, "-m", "pip", "install", "--disable-pip-version-check", "-e", f"{exp}[train]")
run(sys.executable, "-m", "pip", "install", "--disable-pip-version-check", "sentence-transformers>=5,<6")

graph = inputs / "graph.npz"
urllib.request.urlretrieve(f"{release_base}/graph.npz", graph)
env = os.environ.copy()
env["PYTHONPATH"] = str(exp / "src") + os.pathsep + str(exp / "scripts") + os.pathsep + env.get("PYTHONPATH", "")

cache = out / "semantic-cache.npz"
cache_start = time.perf_counter()
run(
    sys.executable,
    exp / "scripts/build_semantic_embedding_cache.py",
    "--output", cache,
    "--backend", "torch",
    "--device", "cuda",
    "--batch-size", "64",
    cwd=exp,
    env=env,
)
cache_wall = time.perf_counter() - cache_start
cache_manifest = json.loads(cache.with_suffix('.manifest.json').read_text(encoding='utf-8'))

report = out / "directed-peer-cached.json"
train_start = time.perf_counter()
run(
    sys.executable,
    exp / "scripts/smoke_directed_peer_gains_cached_batch_gpu.py",
    "--graph", graph,
    "--embedding-cache", cache,
    "--output", report,
    "--epochs", "3",
    "--lr", "0.0005",
    "--peer-lambda", "0.5",
    "--anchor-lambda", "0.05",
    "--readout-width", "128",
    cwd=exp,
    env=env,
)
train_wall = time.perf_counter() - train_start
summary = json.loads(report.read_text(encoding='utf-8'))
summary.update({
    "papers_ref": papers_ref,
    "kernel": kernel_id,
    "kernel_url": f"https://www.kaggle.com/code/{kernel_id}",
    "cache_build_seconds": cache_manifest.get("seconds"),
    "cache_build_wall_seconds": cache_wall,
    "cached_training_wall_seconds": train_wall,
    "cache_fingerprint": cache_manifest.get("fingerprint"),
    "cache_backend": cache_manifest.get("backend"),
    "cache_device": cache_manifest.get("device"),
})
summary_path = work / "github-summary.json"
summary_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False, sort_keys=True) + "\n", encoding="utf-8")
prov = work / "provenance.json"
prov.write_text(json.dumps({
    "papers_ref": papers_ref,
    "kernel": kernel_id,
    "kernel_url": summary["kernel_url"],
    "cache_fingerprint": summary["cache_fingerprint"],
    "cache_backend": summary["cache_backend"],
    "cache_device": summary["cache_device"],
    "encoder_forward_during_training": False,
}, indent=2, ensure_ascii=False, sort_keys=True) + "\n", encoding="utf-8")
for src, name in (
    (summary_path, "github-summary.json"),
    (report, "directed-peer-cached.json"),
    (cache.with_suffix('.manifest.json'), "semantic-cache.manifest.json"),
    (prov, "provenance.json"),
):
    shutil.copy2(src, public / name)
print(json.dumps({"event":"semantic_cache_kaggle_test_complete","cache_build_seconds":summary["cache_build_seconds"],"cached_training_wall_seconds":train_wall}), flush=True)
PY

python3 - "$STAGE/job.py" "$PAPERS_REF" "$KERNEL_ID" "$RELEASE_BASE" <<'PY'
from pathlib import Path
import sys
p=Path(sys.argv[1]); text=p.read_text(encoding='utf-8')
prefix=("import os\n"+f"os.environ['PAPERS_REF']={sys.argv[2]!r}\n"+f"os.environ['KERNEL_ID']={sys.argv[3]!r}\n"+f"os.environ['RELEASE_BASE']={sys.argv[4]!r}\n")
p.write_text(prefix+text, encoding='utf-8')
PY

cat > "$STAGE/kernel-metadata.json" <<JSON
{
  "id": "$KERNEL_ID",
  "title": "MaleCNS Semantic Cache Test",
  "code_file": "job.py",
  "language": "python",
  "kernel_type": "script",
  "is_private": false,
  "enable_gpu": true,
  "enable_internet": true,
  "machine_shape": "$ACCELERATOR",
  "dataset_sources": [], "competition_sources": [], "kernel_sources": [], "model_sources": []
}
JSON

attempt=1
while :; do
  log="$(mktemp)"
  if kaggle kernels push -p "$STAGE" --accelerator "$ACCELERATOR" -t "${KAGGLE_MALECNS_CACHE_TIMEOUT:-1800}" >"$log" 2>&1; then
    cat "$log"; rm -f "$log"; break
  else
    status=$?
  fi
  cat "$log" >&2
  if grep -q '429 Client Error: Too Many Requests' "$log" && (( attempt <= 3 )); then
    case "$attempt" in 1) delay=120;; 2) delay=240;; *) delay=480;; esac
    echo "Kaggle SaveKernel throttled (429); retry $attempt/3 after ${delay}s." >&2
    rm -f "$log"; sleep "$delay"; attempt=$((attempt+1)); continue
  fi
  rm -f "$log"; exit "$status"
done

echo "Public Kaggle kernel: https://www.kaggle.com/code/$KERNEL_ID"
deadline=$(( $(date +%s) + ${KAGGLE_MALECNS_CACHE_WAIT_SECONDS:-2400} ))
delay=10
last_log_hash=""
while :; do
  rm -rf "${DOWNLOAD:?}"/*
  if kaggle kernels output "$KERNEL_ID" -p "$DOWNLOAD" -o --file-pattern '.*(github-summary[.]json|directed-peer-cached[.]json|semantic-cache[.]manifest[.]json|provenance[.]json)$' >/tmp/kaggle-cache-output.log 2>&1; then
    summary="$(find "$DOWNLOAD" -type f -name github-summary.json -print -quit)"
    if [[ -n "$summary" ]] && python3 - "$summary" "$PAPERS_REF" <<'PY'
import json,sys
p=json.load(open(sys.argv[1],encoding='utf-8'))
raise SystemExit(0 if p.get('papers_ref')==sys.argv[2] else 1)
PY
    then break; fi
  fi
  KLOG="$(kaggle kernels logs "$KERNEL_ID" 2>&1 || true)"
  if [[ -n "$KLOG" ]]; then
    hash="$(printf '%s' "$KLOG" | sha256sum | cut -d' ' -f1)"
    if [[ "$hash" != "$last_log_hash" ]]; then printf '%s\n' "$KLOG" | tail -n 80; last_log_hash="$hash"; fi
    if grep -Eqi 'Traceback \(most recent call last\)|Version [0-9]+ failed to run|run - failure|KernelWorkerStatus[.](ERROR|CANCEL|FAILED)' <<<"$KLOG"; then
      echo "Kaggle semantic-cache test failed." >&2; exit 1
    fi
  fi
  if (( $(date +%s) >= deadline )); then
    echo "Kaggle semantic-cache test timed out without fresh output." >&2; exit 1
  fi
  sleep "$delay"; delay=$(( delay < 30 ? delay * 2 : 30 ))
done

for name in github-summary.json directed-peer-cached.json semantic-cache.manifest.json provenance.json; do
  src="$(find "$DOWNLOAD" -type f -name "$name" -print -quit)"
  [[ -n "$src" ]] || { echo "missing $name" >&2; exit 1; }
  cp "$src" "$OUTPUT_DIR/$name"
done
