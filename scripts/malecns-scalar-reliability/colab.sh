#!/usr/bin/env bash
set -euo pipefail

OUTPUT_DIR=""
PAPERS_REF="${PAPERS_REF:-ace3be8db982f93942106da2e2b478422728a552}"
GPU="${COLAB_GPU:-T4}"
RELEASE_BASE="${MALECNS_CONFIRMATORY_RELEASE_BASE:-https://github.com/franklinbaldo/papers/releases/download/malecns-confirmatory-inputs-v1}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --output-dir) OUTPUT_DIR="$2"; shift 2 ;;
    --papers-ref) PAPERS_REF="$2"; shift 2 ;;
    --gpu) GPU="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

[[ -n "$OUTPUT_DIR" ]] || { echo "--output-dir is required" >&2; exit 2; }
command -v colab >/dev/null || { echo "colab CLI not found" >&2; exit 2; }
AUTH="${COLAB_AUTH_PROVIDER:-oauth2}"
SESSION="malecns-scalar-${GITHUB_RUN_ID:-$$}-${GITHUB_RUN_ATTEMPT:-1}"; SESSION="${SESSION,,}"
TMP="$(mktemp -d)"
trap 'colab "--auth=$AUTH" stop -s "$SESSION" >/dev/null 2>&1 || true; rm -rf "$TMP"' EXIT
mkdir -p "$OUTPUT_DIR"

cat > "$TMP/worker.py" <<'PY'
import json, os, pathlib, shutil, subprocess, sys, time, urllib.request

def run(*args, cwd=None, env=None):
    print("+", " ".join(map(str,args)), flush=True)
    subprocess.check_call([str(x) for x in args], cwd=cwd, env=env)

papers_ref=os.environ["PAPERS_REF"]
release_base=os.environ["RELEASE_BASE"]
root=pathlib.Path("/content/malecns-scalar")
root.mkdir(parents=True, exist_ok=True)
papers=root/"papers"
inputs=root/"inputs"; inputs.mkdir(exist_ok=True)
out=root/"out"; out.mkdir(exist_ok=True)
run("git","clone","--filter=blob:none","https://github.com/franklinbaldo/papers.git",papers)
run("git","checkout",papers_ref,cwd=papers)
exp=papers/"experiments/malecns_wifi"
run(sys.executable,"-m","pip","install","--disable-pip-version-check","-e",f"{exp}[train]")
run(sys.executable,"-m","pip","install","--disable-pip-version-check","sentence-transformers>=5,<6")
graph=inputs/"graph.npz"
urllib.request.urlretrieve(f"{release_base}/graph.npz",graph)
env=os.environ.copy(); env["PYTHONPATH"]=str(exp/"src")+os.pathsep+str(exp/"scripts")+os.pathsep+env.get("PYTHONPATH","")
cache=out/"semantic-cache.npz"
t0=time.perf_counter()
run(sys.executable,exp/"scripts/build_semantic_embedding_cache.py","--output",cache,"--backend","torch","--device","cuda","--batch-size","64",cwd=exp,env=env)
cache_seconds=time.perf_counter()-t0
report=out/"scalar-reliability-extension.json"
t1=time.perf_counter()
run(sys.executable,exp/"scripts/smoke_scalar_reliability_extension_cached_batch_gpu.py","--graph",graph,"--embedding-cache",cache,"--output",report,"--epochs","3","--lr","0.0005","--anchor-lambda","0.05","--readout-width","128",cwd=exp,env=env)
train_seconds=time.perf_counter()-t1
summary=json.loads(report.read_text(encoding="utf-8"))
summary["papers_ref"]=papers_ref
summary["executor"]="colab"
summary["cache_build_seconds"]=cache_seconds
summary["cached_training_seconds"]=train_seconds
summary["total_seconds"]=cache_seconds+train_seconds
(out/"github-summary.json").write_text(json.dumps(summary,indent=2,ensure_ascii=False,sort_keys=True)+"\n",encoding="utf-8")
shutil.make_archive("/content/malecns-scalar-result","zip",out)
print(json.dumps({"event":"scalar_reliability_colab_complete","cache_build_seconds":cache_seconds,"cached_training_seconds":train_seconds}),flush=True)
PY

python3 - "$TMP/launcher.py" "$PAPERS_REF" "$RELEASE_BASE" <<'PY'
from pathlib import Path
import sys
p=Path(sys.argv[1])
papers_ref=sys.argv[2]
release_base=sys.argv[3]
p.write_text(
    "import os, runpy\n"
    f"os.environ['PAPERS_REF']={papers_ref!r}\n"
    f"os.environ['RELEASE_BASE']={release_base!r}\n"
    "runpy.run_path('/content/worker.py', run_name='__main__')\n",
    encoding='utf-8',
)
PY

if [[ -n "$GPU" ]]; then
  colab "--auth=$AUTH" new -s "$SESSION" --gpu "$GPU"
else
  colab "--auth=$AUTH" new -s "$SESSION"
fi
colab "--auth=$AUTH" upload -s "$SESSION" "$TMP/worker.py" /content/worker.py
colab "--auth=$AUTH" upload -s "$SESSION" "$TMP/launcher.py" /content/launcher.py
colab "--auth=$AUTH" exec -s "$SESSION" --timeout "${COLAB_EXEC_TIMEOUT:-3600}" -f "$TMP/launcher.py"
colab "--auth=$AUTH" download -s "$SESSION" /content/malecns-scalar-result.zip "$TMP/result.zip"
unzip -q "$TMP/result.zip" -d "$OUTPUT_DIR"
[[ -f "$OUTPUT_DIR/github-summary.json" ]] || { echo "missing Colab summary" >&2; exit 1; }
echo "Colab scalar-reliability result: $OUTPUT_DIR"
