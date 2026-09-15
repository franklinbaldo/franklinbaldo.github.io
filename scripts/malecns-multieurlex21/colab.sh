#!/usr/bin/env bash
set -euo pipefail

OUTPUT_DIR=""
PAPERS_REF="${PAPERS_REF:-27db9c7095d8523f4a7bf5b1bc6d91263f6a72f8}"
GPU="${COLAB_GPU:-T4}"
MODE="${MALECNS_MTEB_MODE:-smoke}"
RELEASE_BASE="${MALECNS_CONFIRMATORY_RELEASE_BASE:-https://github.com/franklinbaldo/papers/releases/download/malecns-confirmatory-inputs-v1}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --output-dir) OUTPUT_DIR="$2"; shift 2 ;;
    --papers-ref) PAPERS_REF="$2"; shift 2 ;;
    --gpu) GPU="$2"; shift 2 ;;
    --mode) MODE="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

[[ -n "$OUTPUT_DIR" ]] || { echo "--output-dir is required" >&2; exit 2; }
command -v colab >/dev/null || { echo "colab CLI not found" >&2; exit 2; }
AUTH="${COLAB_AUTH_PROVIDER:-oauth2}"
SESSION="malecns-eurlex-${GITHUB_RUN_ID:-$$}-${GITHUB_RUN_ATTEMPT:-1}"; SESSION="${SESSION,,}"
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
mode=os.environ.get("MALECNS_MTEB_MODE","smoke")
root=pathlib.Path("/content/malecns-eurlex")
root.mkdir(parents=True, exist_ok=True)
papers=root/"papers"
inputs=root/"inputs"; inputs.mkdir(exist_ok=True)
out=root/"out"; out.mkdir(exist_ok=True)
run("git","clone","--filter=blob:none","https://github.com/franklinbaldo/papers.git",papers)
run("git","checkout",papers_ref,cwd=papers)
exp=papers/"experiments/malecns_wifi"
run(sys.executable,"-m","pip","install","--disable-pip-version-check","uv")
run("uv","pip","install","--system","-e",f"{exp}[train]","mteb==2.20.11","sentence-transformers>=5,<6")
graph=inputs/"graph.npz"
urllib.request.urlretrieve(f"{release_base}/graph.npz",graph)
env=os.environ.copy(); env["PYTHONPATH"]=str(exp/"src")+os.pathsep+str(exp/"scripts")+os.pathsep+env.get("PYTHONPATH","")
report=out/("multieurlex21-pt-smoke.json" if mode=="smoke" else "multieurlex21-pt-mteb.json")
cmd=[sys.executable,exp/"scripts/run_multieurlex21_pt_mteb.py","--graph",graph,"--output",report,"--batch-size","16","--readout-width","256","--max-chunks","4","--chunk-chars","3000"]
if mode=="smoke": cmd += ["--smoke","--smoke-train-cap","5000","--smoke-test-cap","96"]
print("+", " ".join(map(str,cmd)), flush=True)
t0=time.perf_counter()
proc=subprocess.run([str(x) for x in cmd],cwd=exp,env=env,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
elapsed=time.perf_counter()-t0
(out/"runner.log").write_text(proc.stdout or "",encoding="utf-8")
print(proc.stdout or "", flush=True)
if proc.returncode != 0:
    failure={"event":"multieurlex_runner_failed","returncode":proc.returncode,"seconds":elapsed,"papers_ref":papers_ref,"mode":mode}
    (out/"failure.json").write_text(json.dumps(failure,indent=2)+"\n",encoding="utf-8")
    shutil.make_archive("/content/malecns-eurlex-result","zip",out)
    raise SystemExit(proc.returncode)
summary=json.loads(report.read_text(encoding="utf-8"))
summary["papers_ref"]=papers_ref
summary["executor"]="colab"
summary["wall_seconds"]=elapsed
(out/"github-summary.json").write_text(json.dumps(summary,indent=2,ensure_ascii=False,sort_keys=True)+"\n",encoding="utf-8")
shutil.make_archive("/content/malecns-eurlex-result","zip",out)
print(json.dumps({"event":"multieurlex_colab_complete","mode":mode,"seconds":elapsed}),flush=True)
PY

python3 - "$TMP/launcher.py" "$PAPERS_REF" "$RELEASE_BASE" "$MODE" <<'PY'
from pathlib import Path
import sys
p=Path(sys.argv[1]); papers_ref=sys.argv[2]; release_base=sys.argv[3]; mode=sys.argv[4]
p.write_text(
    "import os, runpy\n"
    f"os.environ['PAPERS_REF']={papers_ref!r}\n"
    f"os.environ['RELEASE_BASE']={release_base!r}\n"
    f"os.environ['MALECNS_MTEB_MODE']={mode!r}\n"
    "runpy.run_path('/content/worker.py', run_name='__main__')\n",
    encoding='utf-8',
)
PY

if [[ -n "$GPU" ]]; then colab "--auth=$AUTH" new -s "$SESSION" --gpu "$GPU"; else colab "--auth=$AUTH" new -s "$SESSION"; fi
colab "--auth=$AUTH" upload -s "$SESSION" "$TMP/worker.py" /content/worker.py
colab "--auth=$AUTH" upload -s "$SESSION" "$TMP/launcher.py" /content/launcher.py
set +e
colab "--auth=$AUTH" exec -s "$SESSION" --timeout "${COLAB_EXEC_TIMEOUT:-7200}" -f "$TMP/launcher.py"
status=$?
set -e
colab "--auth=$AUTH" download -s "$SESSION" /content/malecns-eurlex-result.zip "$TMP/result.zip" || true
if [[ -f "$TMP/result.zip" ]]; then unzip -q "$TMP/result.zip" -d "$OUTPUT_DIR"; fi
if [[ $status -ne 0 ]]; then
  [[ -f "$OUTPUT_DIR/runner.log" ]] && { echo '--- MultiEURLEX runner.log ---'; cat "$OUTPUT_DIR/runner.log"; }
  exit "$status"
fi
[[ -f "$OUTPUT_DIR/github-summary.json" ]] || { echo "missing Colab summary" >&2; exit 1; }
echo "Colab MultiEURLEX result: $OUTPUT_DIR"
