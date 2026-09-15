#!/usr/bin/env bash
# Staged MultiEURLEX-21 PT pipeline on Colab:
#   A) frozen MiniLM/E5 semantic cache (parquet per encoder, optional HF publish)
#   B) MaleCNS canonical vs fast throughput benchmark with equivalence gate,
#      then document embeddings for malecns-fast and the label-free controls
#   C) official MTEB evaluator on each cached variant
set -euo pipefail

OUTPUT_DIR=""
PAPERS_REF="${PAPERS_REF:?PAPERS_REF is required}"
GPU="${COLAB_GPU:-T4}"
MODE="${MALECNS_STAGES_MODE:-full}"
RELEASE_BASE="${MALECNS_CONFIRMATORY_RELEASE_BASE:-https://github.com/franklinbaldo/papers/releases/download/malecns-confirmatory-inputs-v1}"
HUB_REPO="${MALECNS_HUB_REPO:-franklinbaldo/multieurlex21-pt-semantic-cache}"
HF_TOKEN="${HF_TOKEN:-}"
WANDB_API_KEY="${WANDB_API_KEY:-}"
WANDB_ENTITY="${WANDB_ENTITY:-}"
WANDB_PROJECT="${WANDB_PROJECT:-malecns-multieurlex21}"
WANDB_RUN_GROUP="${WANDB_RUN_GROUP:-gh-${GITHUB_RUN_ID:-$$}}"

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
BASE_SESSION="malecns-stages-${GITHUB_RUN_ID:-$$}-${GITHUB_RUN_ATTEMPT:-1}"; BASE_SESSION="${BASE_SESSION,,}"
CURRENT_SESSION=""
TMP="$(mktemp -d)"
cleanup() {
  if [[ -n "$CURRENT_SESSION" ]]; then
    colab "--auth=$AUTH" stop -s "$CURRENT_SESSION" >/dev/null 2>&1 || true
  fi
  rm -rf "$TMP"
}
trap cleanup EXIT
mkdir -p "$OUTPUT_DIR"

cat > "$TMP/worker.py" <<'PY'
import json, os, pathlib, shutil, subprocess, sys, time, urllib.request

def run(*args, cwd=None, env=None, log=None):
    print("+", " ".join(map(str, args)), flush=True)
    proc = subprocess.run([str(x) for x in args], cwd=cwd, env=env, text=True,
                          stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    if log is not None:
        pathlib.Path(log).write_text(proc.stdout or "", encoding="utf-8")
    tail = (proc.stdout or "")[-4000:]
    print(tail, flush=True)
    if proc.returncode != 0:
        raise SystemExit(f"step failed ({proc.returncode}): {' '.join(map(str, args))}")
    return proc.stdout or ""

papers_ref = os.environ["PAPERS_REF"]
release_base = os.environ["RELEASE_BASE"]
mode = os.environ.get("MALECNS_STAGES_MODE", "full")
hub_repo = os.environ.get("MALECNS_HUB_REPO", "")
hf_token = os.environ.get("HF_TOKEN", "")
root = pathlib.Path("/content/malecns-stages"); root.mkdir(parents=True, exist_ok=True)
papers = root / "papers"; inputs = root / "inputs"; out = root / "out"
inputs.mkdir(exist_ok=True); out.mkdir(exist_ok=True)
run("git", "clone", "--filter=blob:none", "https://github.com/franklinbaldo/papers.git", papers)
run("git", "checkout", papers_ref, cwd=papers)
exp = papers / "experiments/malecns_wifi"
run(sys.executable, "-m", "pip", "install", "--disable-pip-version-check", "uv")
run("uv", "pip", "install", "--system", "-e", f"{exp}[train,mteb]", "psutil")
if os.environ.get("WANDB_API_KEY"):
    print(json.dumps({"event": "telemetry", "wandb_project": os.environ.get("WANDB_PROJECT"),
                      "wandb_group": os.environ.get("WANDB_RUN_GROUP")}), flush=True)
graph = inputs / "graph.npz"
urllib.request.urlretrieve(f"{release_base}/graph.npz", graph)
env = os.environ.copy()
env["PYTHONPATH"] = str(exp / "src") + os.pathsep + str(exp / "scripts") + os.pathsep + env.get("PYTHONPATH", "")
py = sys.executable
t_all = time.perf_counter()
timings = {}

# ---- stage A -------------------------------------------------------------
cache = out / "semantic-cache"
stage_a = [py, exp / "scripts/build_multieurlex_semantic_cache.py", "--output-dir", cache,
           "--device", "cuda", "--batch-size", "128"]
if mode == "smoke":
    stage_a += ["--limit-per-split", "64", "--splits", "train", "test"]
t0 = time.perf_counter()
run(*stage_a, cwd=exp, env=env, log=out / "stage-a.log")
timings["stage_a_seconds"] = time.perf_counter() - t0
manifest = json.loads((cache / "manifest.json").read_text(encoding="utf-8"))
published = None
if mode == "full" and hub_repo and hf_token:
    t0 = time.perf_counter()
    push_env = dict(env, HF_TOKEN=hf_token)
    text = run(py, "-c",
               "import sys,pathlib; from malecns_wifi.multieurlex_cache import push_to_hub; "
               f"print(push_to_hub(pathlib.Path({str(cache)!r}), repo_id={hub_repo!r}))",
               cwd=exp, env=push_env, log=out / "stage-a-publish.log")
    published = {"repo": hub_repo, "commit": text.strip().splitlines()[-1] if text.strip() else None,
                 "seconds": time.perf_counter() - t0}
elif mode == "full":
    print("HF_TOKEN not provided: semantic cache kept as workflow artifact only", flush=True)

# ---- stage B: throughput benchmark --------------------------------------
t0 = time.perf_counter()
run(py, exp / "scripts/benchmark_document_throughput.py", "--semantic-cache", cache, "--graph", graph,
    "--output", out / "throughput-benchmark.json", "--device", "cuda",
    "--batch-sizes", "16", "32", "64", "128", "256", "512", "--index-dtypes", "int64", "int32",
    cwd=exp, env=env, log=out / "stage-b-benchmark.log")
timings["stage_b_benchmark_seconds"] = time.perf_counter() - t0
bench = json.loads((out / "throughput-benchmark.json").read_text(encoding="utf-8"))
fast_runs = [r for r in bench["runs"] if r["backend"] == "fast" and r["variant"] == "malecns" and r.get("equivalence", {}).get("gate_passed")]
if not fast_runs:
    raise SystemExit("no fast configuration passed the equivalence gate")
best = max(fast_runs, key=lambda r: r["stats"]["docs_per_second"])
print(json.dumps({"event": "best_fast_config", "name": best["name"], "docs_per_second": best["stats"]["docs_per_second"],
                  "speedup": best.get("speedup")}), flush=True)

# ---- stage B: document embeddings per variant ---------------------------
variants = {
    "malecns-fast": ["--variant", "malecns", "--backend", "fast", "--index-dtype", best["index_dtype"],
                     "--batch-size", str(best["batch_size"])],
    "malecns-canonical": ["--variant", "malecns", "--backend", "canonical", "--batch-size", "16"],
    "sensory-only": ["--variant", "sensory-only", "--backend", "fast", "--batch-size", str(best["batch_size"])],
    "fused-mean-proj": ["--variant", "fused-mean-proj"],
    "fused-mean": ["--variant", "fused-mean"],
}
docs = out / "documents"; docs.mkdir(exist_ok=True)
order = ["malecns-canonical", "malecns-fast", "sensory-only", "fused-mean-proj", "fused-mean"]
for name in order:
    extra = variants[name]
    args = [py, exp / "scripts/encode_multieurlex_documents.py", "--semantic-cache", cache, "--graph", graph,
            "--device", "cuda", "--output", docs / f"{name}.npz", *extra]
    if name == "malecns-fast":
        args += ["--reference", docs / "malecns-canonical.npz"]
    t0 = time.perf_counter()
    run(*args, cwd=exp, env=env, log=out / f"stage-b-{name}.log")
    timings[f"stage_b_{name}_seconds"] = time.perf_counter() - t0

# ---- stage C: official evaluator on cached embeddings --------------------
scores = {}
for name in order:
    report = out / f"mteb-{name}.json"
    args = [py, exp / "scripts/run_multieurlex21_pt_mteb.py", "--document-embeddings", docs / f"{name}.npz",
            "--output", report, "--device", "cuda"]
    if mode == "smoke":
        args += ["--smoke", "--smoke-train-cap", "64", "--smoke-test-cap", "64"]
    t0 = time.perf_counter()
    run(*args, cwd=exp, env=env, log=out / f"stage-c-{name}.log")
    timings[f"stage_c_{name}_seconds"] = time.perf_counter() - t0
    payload = json.loads(report.read_text(encoding="utf-8"))
    scores[name] = payload["mteb"]["scores"]["pt"]

fast_manifest = json.loads((docs / "malecns-fast.manifest.json").read_text(encoding="utf-8"))
summary = {
    "event": "multieurlex_stages_complete",
    "mode": mode,
    "papers_ref": papers_ref,
    "executor": "colab",
    "wall_seconds": time.perf_counter() - t_all,
    "timings": timings,
    "semantic_cache": {k: manifest.get(k) for k in ("fingerprint", "documents", "chunks", "bytes", "seconds", "encoders", "dataset")},
    "published": published,
    "best_fast": {"name": best["name"], "docs_per_second": best["stats"]["docs_per_second"], "speedup": best.get("speedup"),
                  "equivalence": best.get("equivalence")},
    "canonical": {"docs_per_second": bench["runs"][0]["stats"]["docs_per_second"], "seconds": bench["runs"][0]["stats"]["forward_seconds"]},
    "stage_b_equivalence": fast_manifest.get("equivalence"),
    "scores": {name: {k: v for k, v in s.items() if k != "scores_per_experiment"} for name, s in scores.items()},
    "claim_status": ("pipeline smoke only" if mode == "smoke" else
                     "official MTEB evaluator on cached label-free embeddings; controls are internal ablations, not leaderboard rows"),
}
(out / "github-summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False, sort_keys=True) + "\n", encoding="utf-8")
# keep the artifact small: the parquet cache is either published or re-buildable; ship manifest + logs + embeddings
if mode == "full":
    for p in cache.glob("*.parquet"):
        if p.stat().st_size > 400_000_000:
            p.unlink()
shutil.make_archive("/content/malecns-stages-result", "zip", out)
print(json.dumps(summary, ensure_ascii=False), flush=True)
PY

python3 - "$TMP/launcher.py" "$PAPERS_REF" "$RELEASE_BASE" "$MODE" "$HUB_REPO" "$HF_TOKEN" \
  "$WANDB_API_KEY" "$WANDB_ENTITY" "$WANDB_PROJECT" "$WANDB_RUN_GROUP" <<'PY'
from pathlib import Path
import sys
p = Path(sys.argv[1])
papers_ref, release_base, mode, hub_repo, hf_token, wandb_key, wandb_entity, wandb_project, wandb_group = sys.argv[2:11]
lines = [
    "import os, runpy",
    f"os.environ['PAPERS_REF']={papers_ref!r}",
    f"os.environ['RELEASE_BASE']={release_base!r}",
    f"os.environ['MALECNS_STAGES_MODE']={mode!r}",
    f"os.environ['MALECNS_HUB_REPO']={hub_repo!r}",
    f"os.environ['HF_TOKEN']={hf_token!r}",
    f"os.environ['WANDB_PROJECT']={wandb_project!r}",
    f"os.environ['WANDB_RUN_GROUP']={wandb_group!r}",
    "os.environ['WANDB_SILENT']='true'",
]
if wandb_key:
    lines.append(f"os.environ['WANDB_API_KEY']={wandb_key!r}")
if wandb_entity:
    lines.append(f"os.environ['WANDB_ENTITY']={wandb_entity!r}")
lines.append("runpy.run_path('/content/worker.py', run_name='__main__')")
p.write_text("\n".join(lines) + "\n", encoding='utf-8')
PY

run_attempt() {
  local attempt="$1"
  CURRENT_SESSION="${BASE_SESSION}-a${attempt}"
  rm -f "$TMP/result.zip"
  echo "[colab] MultiEURLEX stages attempt ${attempt}/2 using session '$CURRENT_SESSION'"
  if [[ -n "$GPU" ]]; then
    colab "--auth=$AUTH" new -s "$CURRENT_SESSION" --gpu "$GPU"
  else
    colab "--auth=$AUTH" new -s "$CURRENT_SESSION"
  fi
  colab "--auth=$AUTH" upload -s "$CURRENT_SESSION" "$TMP/worker.py" /content/worker.py
  colab "--auth=$AUTH" upload -s "$CURRENT_SESSION" "$TMP/launcher.py" /content/launcher.py

  set +e
  colab "--auth=$AUTH" exec -s "$CURRENT_SESSION" --timeout "${COLAB_EXEC_TIMEOUT:-7200}" -f "$TMP/launcher.py"
  local status=$?
  set -e

  colab "--auth=$AUTH" download -s "$CURRENT_SESSION" /content/malecns-stages-result.zip "$TMP/result.zip" || true
  colab "--auth=$AUTH" stop -s "$CURRENT_SESSION" >/dev/null 2>&1 || true
  CURRENT_SESSION=""

  if [[ -f "$TMP/result.zip" ]]; then
    rm -rf "$OUTPUT_DIR"/*
    unzip -q "$TMP/result.zip" -d "$OUTPUT_DIR"
  fi
  return "$status"
}

status=1
for attempt in 1 2; do
  if run_attempt "$attempt"; then
    status=0
    break
  fi
  status=$?
  if [[ -f "$OUTPUT_DIR/github-summary.json" ]] || ls "$OUTPUT_DIR"/*.log >/dev/null 2>&1; then
    echo "[colab] Runner produced logs; not retrying as a connection failure."
    break
  fi
  if [[ "$attempt" -lt 2 ]]; then
    echo "[colab] Execution channel failed without a runner artifact; restarting in a fresh Colab session."
  fi
done

if [[ $status -ne 0 ]]; then
  for f in "$OUTPUT_DIR"/*.log; do [[ -f "$f" ]] && { echo "--- $(basename "$f") ---"; tail -n 80 "$f"; }; done
  exit "$status"
fi
[[ -f "$OUTPUT_DIR/github-summary.json" ]] || { echo "missing Colab summary" >&2; exit 1; }
echo "Colab MultiEURLEX stages result: $OUTPUT_DIR"
