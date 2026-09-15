#!/usr/bin/env bash
set -euo pipefail

OUTPUT_DIR=""
ACCELERATOR="${KAGGLE_ACCELERATOR:-NvidiaTeslaT4}"
KERNEL_ID="${KAGGLE_MALECNS_CONCEPT_FLAVOUR_KERNEL_ID:-}"
PAPERS_REF="${PAPERS_REF:-33d0f0fb409bf45f21ec04e1d8f796a43de51310}"
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
if [[ -z "$KERNEL_ID" ]]; then
  KERNEL_ID="${KAGGLE_USERNAME}/malecns-concept-flavour-smoke"
fi
command -v kaggle >/dev/null || { echo "kaggle CLI not found" >&2; exit 2; }

STAGE="$(mktemp -d)"
DOWNLOAD="$(mktemp -d)"
trap 'rm -rf "$STAGE" "$DOWNLOAD"' EXIT
mkdir -p "$OUTPUT_DIR"

cat > "$STAGE/job.py" <<'PY'
import json, os, pathlib, shutil, subprocess, sys, urllib.request

def run(*args, cwd=None, env=None):
    print("+", " ".join(map(str, args)), flush=True)
    subprocess.check_call([str(x) for x in args], cwd=cwd, env=env)

papers_ref = os.environ["PAPERS_REF"]
kernel_id = os.environ["KERNEL_ID"]
release_base = os.environ["RELEASE_BASE"]
work = pathlib.Path("/kaggle/working")
scratch = pathlib.Path("/kaggle/temp/malecns-concept-flavour")
scratch.mkdir(parents=True, exist_ok=True)
papers = scratch / "papers"
inputs = scratch / "inputs"; inputs.mkdir(exist_ok=True)
out = work / "concept-flavour"; out.mkdir(exist_ok=True)
public = work / "public-cache"; public.mkdir(exist_ok=True)

run("git", "clone", "--filter=blob:none", "https://github.com/franklinbaldo/papers.git", papers)
run("git", "checkout", papers_ref, cwd=papers)
exp = papers / "experiments/malecns_wifi"
run(sys.executable, "-m", "pip", "install", "--disable-pip-version-check", "-e", f"{exp}[train]")
run(sys.executable, "-m", "pip", "install", "--disable-pip-version-check", "sentence-transformers>=5,<6")

graph = inputs / "graph.npz"
urllib.request.urlretrieve(f"{release_base}/graph.npz", graph)

env = os.environ.copy()
env["PYTHONPATH"] = str(exp / "src") + os.pathsep + env.get("PYTHONPATH", "")
report = out / "concept-flavour.json"
run(
    sys.executable,
    exp / "scripts/smoke_concept_flavour_gpu.py",
    "--graph", graph,
    "--output", report,
    "--scales", "8", "32", "128",
    "--epochs", "6",
    "--lr", "0.0005",
    "--anchor-lambda", "0.05",
    "--readout-width", "256",
    cwd=exp,
    env=env,
)
summary = json.loads(report.read_text(encoding="utf-8"))
summary.update({
    "papers_ref": papers_ref,
    "kernel": kernel_id,
    "kernel_url": f"https://www.kaggle.com/code/{kernel_id}",
})
summary_path = work / "github-summary.json"
summary_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False, sort_keys=True) + "\n", encoding="utf-8")
prov = work / "provenance.json"
prov.write_text(json.dumps({
    "papers_ref": papers_ref,
    "kernel": kernel_id,
    "kernel_url": summary["kernel_url"],
    "heldout_concepts": summary["heldout_concepts"],
}, indent=2, ensure_ascii=False, sort_keys=True) + "\n", encoding="utf-8")
for src, name in (
    (summary_path, "github-summary.json"),
    (report, "concept-flavour.json"),
    (prov, "provenance.json"),
):
    shutil.copy2(src, public / name)
print(json.dumps({"event": "public_cache_ready", "files": sorted(p.name for p in public.iterdir())}), flush=True)
PY

python3 - "$STAGE/job.py" "$PAPERS_REF" "$KERNEL_ID" "$RELEASE_BASE" <<'PY'
from pathlib import Path
import sys
p = Path(sys.argv[1])
text = p.read_text(encoding="utf-8")
prefix = (
    "import os\n"
    f"os.environ['PAPERS_REF']={sys.argv[2]!r}\n"
    f"os.environ['KERNEL_ID']={sys.argv[3]!r}\n"
    f"os.environ['RELEASE_BASE']={sys.argv[4]!r}\n"
)
p.write_text(prefix + text, encoding="utf-8")
PY

cat > "$STAGE/kernel-metadata.json" <<JSON
{
  "id": "$KERNEL_ID",
  "title": "MaleCNS Calibrated Concept Flavour Smoke",
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

kaggle kernels push -p "$STAGE" --accelerator "$ACCELERATOR" -t "${KAGGLE_MALECNS_CONCEPT_TIMEOUT:-21600}"
echo "Public Kaggle kernel: https://www.kaggle.com/code/$KERNEL_ID"

# Do not call `kaggle kernels status`: Kaggle's GetKernelSessionStatus endpoint
# currently returns 404.  Fresh, provenance-checked output is the completion signal.
deadline=$(( $(date +%s) + ${KAGGLE_MALECNS_CONCEPT_WAIT_SECONDS:-21600} ))
delay=10
while :; do
  rm -rf "${DOWNLOAD:?}"/*
  if kaggle kernels output "$KERNEL_ID" -p "$DOWNLOAD" -o --file-pattern '.*(github-summary[.]json|concept-flavour[.]json|provenance[.]json)$' >/tmp/kaggle-concept-output.log 2>&1; then
    summary="$(find "$DOWNLOAD" -type f -name github-summary.json -print -quit)"
    if [[ -n "$summary" ]] && python3 - "$summary" "$PAPERS_REF" <<'PY'
import json, sys
payload = json.load(open(sys.argv[1], encoding="utf-8"))
raise SystemExit(0 if payload.get("papers_ref") == sys.argv[2] else 1)
PY
    then
      cat /tmp/kaggle-concept-output.log || true
      break
    fi
  fi
  if (( $(date +%s) >= deadline )); then
    cat /tmp/kaggle-concept-output.log >&2 || true
    echo "fresh Kaggle output did not become available before deadline" >&2
    exit 1
  fi
  sleep "$delay"
  delay=$(( delay < 80 ? delay * 2 : 80 ))
done

for name in github-summary.json concept-flavour.json provenance.json; do
  src="$(find "$DOWNLOAD" -type f -name "$name" -print -quit)"
  [[ -n "$src" ]] || { echo "missing $name in Kaggle output" >&2; exit 1; }
  cp "$src" "$OUTPUT_DIR/$name"
done
