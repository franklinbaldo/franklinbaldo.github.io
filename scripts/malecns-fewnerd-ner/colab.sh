#!/usr/bin/env bash
set -euo pipefail

OUTPUT_DIR=""
PAPERS_REF="${PAPERS_REF:-953d7566548167a86b66d31047db75aceac30420}"
GPU="${COLAB_GPU:-T4}"
RELEASE_BASE="${MALECNS_CONFIRMATORY_RELEASE_BASE:-https://github.com/franklinbaldo/papers/releases/download/malecns-confirmatory-inputs-v1}"
TRAIN_LIMIT="${FEWNERD_TRAIN_LIMIT:-2}"
DEV_LIMIT="${FEWNERD_DEV_LIMIT:-2}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --output-dir) OUTPUT_DIR="$2"; shift 2 ;;
    --papers-ref) PAPERS_REF="$2"; shift 2 ;;
    --gpu) GPU="$2"; shift 2 ;;
    --train-limit) TRAIN_LIMIT="$2"; shift 2 ;;
    --dev-limit) DEV_LIMIT="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

[[ -n "$OUTPUT_DIR" ]] || { echo "--output-dir is required" >&2; exit 2; }
AUTH="${COLAB_AUTH_PROVIDER:-oauth2}"
BASE_SESSION="malecns-fewnerd-${GITHUB_RUN_ID:-$$}-${GITHUB_RUN_ATTEMPT:-1}"; BASE_SESSION="${BASE_SESSION,,}"
CURRENT_SESSION=""
TMP="$(mktemp -d)"
cleanup() {
  [[ -z "$CURRENT_SESSION" ]] || colab "--auth=$AUTH" stop -s "$CURRENT_SESSION" >/dev/null 2>&1 || true
  rm -rf "$TMP"
}
trap cleanup EXIT
mkdir -p "$OUTPUT_DIR"

cat > "$TMP/worker.py" <<'PY'
import json, os, pathlib, shutil, subprocess, sys, time, urllib.request

def run(*args, cwd=None, env=None):
    print("+", " ".join(map(str,args)), flush=True)
    subprocess.check_call([str(x) for x in args], cwd=cwd, env=env)

papers_ref=os.environ["PAPERS_REF"]
release_base=os.environ["RELEASE_BASE"]
train_limit=int(os.environ["TRAIN_LIMIT"])
dev_limit=int(os.environ["DEV_LIMIT"])
root=pathlib.Path("/content/malecns-fewnerd")
root.mkdir(parents=True, exist_ok=True)
papers=root/"papers"; inputs=root/"inputs"; out=root/"out"
inputs.mkdir(exist_ok=True); out.mkdir(exist_ok=True)
run("git","clone","--filter=blob:none","https://github.com/franklinbaldo/papers.git",papers)
run("git","checkout",papers_ref,cwd=papers)
exp=papers/"experiments/malecns_wifi"
run(sys.executable,"-m","pip","install","--disable-pip-version-check","uv")
run("uv","pip","install","--system","-e",f"{exp}[train]","transformers>=4.45,<5","datasets>=3,<5")
graph=inputs/"graph.npz"
urllib.request.urlretrieve(f"{release_base}/graph.npz",graph)
env=os.environ.copy(); env["PYTHONPATH"]=str(exp/"src")+os.pathsep+str(exp/"scripts")+os.pathsep+env.get("PYTHONPATH","")
train_cache=inputs/"fewnerd-train.npz"; dev_cache=inputs/"fewnerd-validation.npz"
cache_script=exp/"scripts/fewnerd_semantic_cache.py"
run(sys.executable,cache_script,"--split","train","--limit",str(train_limit),"--device","cuda","--batch-size","8","--dtype","float16","--output",train_cache,cwd=exp,env=env)
run(sys.executable,cache_script,"--split","validation","--limit",str(dev_limit),"--device","cuda","--batch-size","8","--dtype","float16","--output",dev_cache,cwd=exp,env=env)
report=out/"fewnerd-wholebrain-smoke.json"
cmd=[sys.executable,exp/"scripts/fewnerd_malecns_ner_smoke.py","--graph",graph,"--train-cache",train_cache,"--dev-cache",dev_cache,"--output",report,"--train-limit",str(train_limit),"--dev-limit",str(dev_limit),"--epochs","1","--readout-width","128"]
print("+", " ".join(map(str,cmd)), flush=True)
t0=time.perf_counter()
proc=subprocess.run([str(x) for x in cmd],cwd=exp,env=env,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
elapsed=time.perf_counter()-t0
(out/"runner.log").write_text(proc.stdout or "",encoding="utf-8")
print(proc.stdout or "", flush=True)
for source in (train_cache.with_suffix('.manifest.json'), dev_cache.with_suffix('.manifest.json')):
    shutil.copy2(source,out/source.name)
if proc.returncode != 0:
    (out/"failure.json").write_text(json.dumps({"event":"fewnerd_runner_failed","returncode":proc.returncode,"seconds":elapsed,"papers_ref":papers_ref},indent=2)+"\n",encoding="utf-8")
    shutil.make_archive("/content/malecns-fewnerd-result","zip",out)
    raise SystemExit(proc.returncode)
summary=json.loads(report.read_text(encoding="utf-8"))
summary["papers_ref"]=papers_ref; summary["executor"]="colab"; summary["runner_wall_seconds"]=elapsed
(out/"github-summary.json").write_text(json.dumps(summary,indent=2,sort_keys=True)+"\n",encoding="utf-8")
shutil.make_archive("/content/malecns-fewnerd-result","zip",out)
print(json.dumps({"event":"fewnerd_colab_complete","seconds":elapsed}),flush=True)
PY

python3 - "$TMP/launcher.py" "$PAPERS_REF" "$RELEASE_BASE" "$TRAIN_LIMIT" "$DEV_LIMIT" <<'PY'
from pathlib import Path
import sys
p=Path(sys.argv[1]); papers_ref=sys.argv[2]; release_base=sys.argv[3]; train=sys.argv[4]; dev=sys.argv[5]
p.write_text(
    "import os, runpy\n"
    f"os.environ['PAPERS_REF']={papers_ref!r}\n"
    f"os.environ['RELEASE_BASE']={release_base!r}\n"
    f"os.environ['TRAIN_LIMIT']={train!r}\n"
    f"os.environ['DEV_LIMIT']={dev!r}\n"
    "runpy.run_path('/content/worker.py', run_name='__main__')\n",encoding='utf-8')
PY

run_attempt() {
  local attempt="$1"; CURRENT_SESSION="${BASE_SESSION}-a${attempt}"; rm -f "$TMP/result.zip"
  echo "[colab] Few-NERD attempt ${attempt}/2 using '$CURRENT_SESSION'"
  colab "--auth=$AUTH" new -s "$CURRENT_SESSION" --gpu "$GPU"
  colab "--auth=$AUTH" upload -s "$CURRENT_SESSION" "$TMP/worker.py" /content/worker.py
  colab "--auth=$AUTH" upload -s "$CURRENT_SESSION" "$TMP/launcher.py" /content/launcher.py
  set +e
  colab "--auth=$AUTH" exec -s "$CURRENT_SESSION" --timeout "${COLAB_EXEC_TIMEOUT:-7200}" -f "$TMP/launcher.py"
  local status=$?
  set -e
  colab "--auth=$AUTH" download -s "$CURRENT_SESSION" /content/malecns-fewnerd-result.zip "$TMP/result.zip" || true
  colab "--auth=$AUTH" stop -s "$CURRENT_SESSION" >/dev/null 2>&1 || true; CURRENT_SESSION=""
  if [[ -f "$TMP/result.zip" ]]; then rm -rf "$OUTPUT_DIR"/*; unzip -q "$TMP/result.zip" -d "$OUTPUT_DIR"; fi
  return "$status"
}

status=1
for attempt in 1 2; do
  if run_attempt "$attempt"; then status=0; break; fi
  status=$?
  [[ ! -f "$OUTPUT_DIR/failure.json" ]] || break
  [[ "$attempt" -ge 2 ]] || echo "[colab] transport failed without scientific failure; retrying fresh session"
done
if [[ $status -ne 0 ]]; then
  [[ ! -f "$OUTPUT_DIR/runner.log" ]] || cat "$OUTPUT_DIR/runner.log"
  exit "$status"
fi
[[ -f "$OUTPUT_DIR/github-summary.json" ]] || { echo "missing Few-NERD Colab summary" >&2; exit 1; }
