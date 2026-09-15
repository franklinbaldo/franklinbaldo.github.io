#!/usr/bin/env bash
set -euo pipefail

OUTPUT_DIR=""
ACCELERATOR="${KAGGLE_ACCELERATOR:-NvidiaTeslaT4}"
KERNEL_ID="${KAGGLE_MALECNS_WORD_CURRICULUM_KERNEL_ID:-}"
PAPERS_REF="${PAPERS_REF:-4abc3263eb462c5ba0b4e5c40689ebbffc3f3dc1}"
CAUSAGANHA_REF="${CAUSAGANHA_REF:-7c3d6557bb692932553622ae6e00493ba04e534f}"
RELEASE_BASE="${MALECNS_CONFIRMATORY_RELEASE_BASE:-https://github.com/franklinbaldo/papers/releases/download/malecns-confirmatory-inputs-v1}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --output-dir) OUTPUT_DIR="$2"; shift 2 ;;
    --accelerator) ACCELERATOR="$2"; shift 2 ;;
    --kernel-id) KERNEL_ID="$2"; shift 2 ;;
    --papers-ref) PAPERS_REF="$2"; shift 2 ;;
    --causaganha-ref) CAUSAGANHA_REF="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

[[ -n "$OUTPUT_DIR" ]] || { echo "--output-dir is required" >&2; exit 2; }
[[ -n "${KAGGLE_USERNAME:-}" ]] || { echo "KAGGLE_USERNAME is required" >&2; exit 2; }
if [[ -z "$KERNEL_ID" ]]; then
  KERNEL_ID="${KAGGLE_USERNAME}/malecns-word-curriculum-smoke"
fi
command -v kaggle >/dev/null || { echo "kaggle CLI not found" >&2; exit 2; }

STAGE="$(mktemp -d)"
DOWNLOAD="$(mktemp -d)"
trap 'rm -rf "$STAGE" "$DOWNLOAD"' EXIT
mkdir -p "$OUTPUT_DIR"

cat > "$STAGE/job.py" <<'PY'
import json, os, pathlib, shutil, subprocess, sys, urllib.request

def run(*args, cwd=None, env=None):
    print("+", " ".join(map(str,args)), flush=True)
    subprocess.check_call([str(x) for x in args], cwd=cwd, env=env)

papers_ref=os.environ["PAPERS_REF"]
cg_ref=os.environ["CAUSAGANHA_REF"]
kernel_id=os.environ["KERNEL_ID"]
release_base=os.environ["RELEASE_BASE"]
work=pathlib.Path("/kaggle/working")
scratch=pathlib.Path("/kaggle/temp/malecns-word-curriculum")
scratch.mkdir(parents=True, exist_ok=True)
papers=scratch/"papers"
cg=scratch/"causaganha"
inputs=scratch/"inputs"; inputs.mkdir(exist_ok=True)
out=work/"word-curriculum"; out.mkdir(exist_ok=True)
public=work/"public-cache"; public.mkdir(exist_ok=True)

run("git","clone","--filter=blob:none","https://github.com/franklinbaldo/papers.git",papers)
run("git","checkout",papers_ref,cwd=papers)
run("git","clone","--filter=blob:none","https://github.com/franklinbaldo/causaganha.git",cg)
run("git","checkout",cg_ref,cwd=cg)
exp=papers/"experiments/malecns_wifi"
run(sys.executable,"-m","pip","install","--disable-pip-version-check","-e",f"{exp}[train]")
run(sys.executable,"-m","pip","install","--disable-pip-version-check","sentence-transformers>=5,<6")

graph=inputs/"graph.npz"
urllib.request.urlretrieve(f"{release_base}/graph.npz",graph)
train=cg/"data/segmenter_splits/train.jsonl"
val=cg/"data/segmenter_splits/val.jsonl"

env=os.environ.copy()
env["PYTHONPATH"]=str(exp/"src") + os.pathsep + env.get("PYTHONPATH","")
report=out/"word-curriculum.json"
run(
  sys.executable, exp/"scripts/smoke_word_curriculum_gpu.py",
  "--train", train, "--val", val, "--graph", graph,
  "--output", report, "--target", "recurso",
  "--train-docs", "3", "--val-docs", "2", "--crop-chars", "160",
  "--scales", "8", "32", "128", "--epochs", "3", "--readout-width", "256",
  cwd=exp, env=env,
)
summary=json.loads(report.read_text(encoding="utf-8"))
summary.update({"papers_ref":papers_ref,"causaganha_ref":cg_ref,"kernel":kernel_id,
                "kernel_url":f"https://www.kaggle.com/code/{kernel_id}"})
summary_path=work/"github-summary.json"
summary_path.write_text(json.dumps(summary,indent=2,sort_keys=True)+"\n",encoding="utf-8")
prov=work/"provenance.json"
prov.write_text(json.dumps({"papers_ref":papers_ref,"causaganha_ref":cg_ref,
                            "kernel":kernel_id,"kernel_url":summary["kernel_url"],
                            "target":"recurso"},indent=2,sort_keys=True)+"\n",encoding="utf-8")
for src,name in ((summary_path,"github-summary.json"),(report,"word-curriculum.json"),(prov,"provenance.json")):
    shutil.copy2(src,public/name)
print(json.dumps({"event":"public_cache_ready","files":sorted(p.name for p in public.iterdir())}),flush=True)
PY

python3 - "$STAGE/job.py" "$PAPERS_REF" "$CAUSAGANHA_REF" "$KERNEL_ID" "$RELEASE_BASE" <<'PY'
from pathlib import Path
import sys
p=Path(sys.argv[1]); text=p.read_text(encoding='utf-8')
prefix=("import os\n"+f"os.environ['PAPERS_REF']={sys.argv[2]!r}\n"+
        f"os.environ['CAUSAGANHA_REF']={sys.argv[3]!r}\n"+
        f"os.environ['KERNEL_ID']={sys.argv[4]!r}\n"+
        f"os.environ['RELEASE_BASE']={sys.argv[5]!r}\n")
p.write_text(prefix+text,encoding='utf-8')
PY

cat > "$STAGE/kernel-metadata.json" <<JSON
{
  "id": "$KERNEL_ID",
  "title": "MaleCNS Word Curriculum Smoke",
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

kaggle kernels push -p "$STAGE" --accelerator "$ACCELERATOR" -t "${KAGGLE_MALECNS_WORD_TIMEOUT:-21600}"
echo "Public Kaggle kernel: https://www.kaggle.com/code/$KERNEL_ID"
echo "Kaggle session-status polling is intentionally disabled: the v1 GetKernelSessionStatus endpoint currently returns HTTP 404."
echo "Completion will be detected from fresh public output instead."

deadline=$(( $(date +%s) + ${KAGGLE_MALECNS_WORD_WAIT_SECONDS:-21600} ))
downloaded=0
attempt=0
while (( $(date +%s) < deadline )); do
  attempt=$((attempt + 1))
  rm -rf "${DOWNLOAD:?}"/*
  if kaggle kernels output "$KERNEL_ID" -p "$DOWNLOAD" -o \
      --file-pattern '.*(github-summary[.]json|word-curriculum[.]json|provenance[.]json)$' >/tmp/kaggle-output.log 2>&1; then
    summary="$(find "$DOWNLOAD" -type f -name github-summary.json -print -quit)"
    if [[ -n "$summary" ]] && python3 - "$summary" "$PAPERS_REF" "$CAUSAGANHA_REF" <<'PY'
import json, sys
p=json.load(open(sys.argv[1], encoding='utf-8'))
if p.get('papers_ref') != sys.argv[2] or p.get('causaganha_ref') != sys.argv[3]:
    raise SystemExit(1)
print('Fresh Kaggle output matches requested refs.')
PY
    then
      downloaded=1
      break
    fi
    echo "Kaggle output exists but is from an older kernel version; continuing to poll."
  else
    if (( attempt == 1 || attempt % 10 == 0 )); then
      echo "Kaggle output not ready yet (attempt $attempt)."
      tail -n 3 /tmp/kaggle-output.log || true
    fi
  fi
  sleep "${KAGGLE_MALECNS_WORD_OUTPUT_INTERVAL:-30}"
done

if [[ "$downloaded" != 1 ]]; then
  echo "Fresh Kaggle output did not appear before deadline." >&2
  echo "Last non-following log snapshot (diagnostic only):" >&2
  kaggle kernels logs "$KERNEL_ID" 2>&1 | tail -n 120 >&2 || true
  exit 1
fi

for name in github-summary.json word-curriculum.json provenance.json; do
  src="$(find "$DOWNLOAD" -type f -name "$name" -print -quit)"
  [[ -n "$src" ]] || { echo "missing $name in Kaggle output" >&2; exit 1; }
  cp "$src" "$OUTPUT_DIR/$name"
done
