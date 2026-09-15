#!/usr/bin/env bash
# Staged Few-NERD (supervised) pipeline on Colab:
#   A) frozen byte-synchronised multiscale semantic cache, deduplicated by
#      window text (local intermediate only, never published)
#   B) MaleCNS positional reservoir -> per-byte readout embeddings
#   C) linear probe fit on train/validation, entity-level F1 on test
set -euo pipefail

OUTPUT_DIR=""
PAPERS_REF="${PAPERS_REF:?PAPERS_REF is required}"
GPU="${COLAB_GPU:-T4}"
MODE="${MALECNS_FEWNERD_MODE:-smoke}"
RELEASE_BASE="${MALECNS_CONFIRMATORY_RELEASE_BASE:-https://github.com/franklinbaldo/papers/releases/download/malecns-confirmatory-inputs-v1}"
LIMIT_PER_SPLIT="${MALECNS_FEWNERD_LIMIT:-4000}"
MAX_TOKENS="${MALECNS_FEWNERD_MAX_TOKENS:-64}"
WANDB_API_KEY="${WANDB_API_KEY:-}"
WANDB_ENTITY="${WANDB_ENTITY:-}"
WANDB_PROJECT="${WANDB_PROJECT:-malecns-fewnerd}"
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
BASE_SESSION="malecns-fewnerd-${GITHUB_RUN_ID:-$$}-${GITHUB_RUN_ATTEMPT:-1}"; BASE_SESSION="${BASE_SESSION,,}"
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
    print((proc.stdout or "")[-4000:], flush=True)
    if proc.returncode != 0:
        raise SystemExit(f"step failed ({proc.returncode}): {' '.join(map(str, args))}")
    return proc.stdout or ""

papers_ref = os.environ["PAPERS_REF"]
release_base = os.environ["RELEASE_BASE"]
mode = os.environ.get("MALECNS_FEWNERD_MODE", "smoke")
limit_per_split = os.environ.get("MALECNS_FEWNERD_LIMIT", "4000")
max_tokens = os.environ.get("MALECNS_FEWNERD_MAX_TOKENS", "64")
root = pathlib.Path("/content/malecns-fewnerd"); root.mkdir(parents=True, exist_ok=True)
papers = root / "papers"; inputs = root / "inputs"; out = root / "out"
inputs.mkdir(exist_ok=True); out.mkdir(exist_ok=True)
run("git", "clone", "--filter=blob:none", "https://github.com/franklinbaldo/papers.git", papers)
run("git", "checkout", papers_ref, cwd=papers)
exp = papers / "experiments/malecns_wifi"
run(sys.executable, "-m", "pip", "install", "--disable-pip-version-check", "uv")
run("uv", "pip", "install", "--system", "-e", f"{exp}[train,fewnerd]")
graph = inputs / "graph.npz"
urllib.request.urlretrieve(f"{release_base}/graph.npz", graph)
env = os.environ.copy()
env["PYTHONPATH"] = str(exp / "src") + os.pathsep + str(exp / "scripts") + os.pathsep + env.get("PYTHONPATH", "")
py = sys.executable
t_all = time.perf_counter()
timings = {}

cache = out / "byte-cache"
stage_a = [py, exp / "scripts/build_fewnerd_semantic_cache.py", "--output-dir", cache, "--device", "cuda",
           "--batch-size", "256", "--max-tokens", max_tokens]
if mode != "full":
    stage_a += ["--limit-per-split", limit_per_split, "--splits", "train", "validation", "test"]
t0 = time.perf_counter()
run(*stage_a, cwd=exp, env=env, log=out / "stage-a.log")
timings["stage_a_seconds"] = time.perf_counter() - t0
manifest = json.loads((cache / "manifest.json").read_text(encoding="utf-8"))

t0 = time.perf_counter()
tokens = out / "byte-embeddings.npz"
run(py, exp / "scripts/encode_fewnerd_tokens.py", "--token-cache", cache, "--graph", graph,
    "--output", tokens, "--device", "cuda", "--batch-size", "64",
    cwd=exp, env=env, log=out / "stage-b.log")
timings["stage_b_seconds"] = time.perf_counter() - t0
stage_b_manifest = json.loads(tokens.with_suffix(".manifest.json").read_text(encoding="utf-8"))

fine_names_path = out / "fine-names.json"
fine_names_path.write_text(json.dumps(manifest["labels"]["fine"]), encoding="utf-8")

t0 = time.perf_counter()
probe_out = out / "probe.json"
run(py, exp / "scripts/run_fewnerd_probe.py", "--document-embeddings", tokens, "--fine-names", fine_names_path,
    "--output", probe_out, "--variant", "malecns", cwd=exp, env=env, log=out / "stage-c.log")
timings["stage_c_seconds"] = time.perf_counter() - t0
probe = json.loads(probe_out.read_text(encoding="utf-8"))

summary = {
    "event": "fewnerd_stages_complete",
    "mode": mode,
    "papers_ref": papers_ref,
    "executor": "colab",
    "wall_seconds": time.perf_counter() - t_all,
    "timings": timings,
    "byte_cache": {k: manifest.get(k) for k in ("fingerprint", "sentences", "bytes", "total_bytes_on_disk", "seconds", "encoders", "dataset", "chunking", "dedup")},
    "reservoir": stage_b_manifest.get("stats"),
    "probe": {"C": probe["probe"]["C"], "val_accuracy": probe["probe"]["val_accuracy"],
              "test_token_accuracy": probe["test_token_accuracy"],
              "test_micro_f1": probe["test_span_metrics"]["micro_f1"],
              "test_macro_f1": probe["test_span_metrics"]["macro_f1"],
              "test_sentences": probe["test_sentences"]},
    "claim_status": "pipeline smoke only" if mode == "smoke" else
                    ("throughput/scale check, not benchmark evidence" if mode != "full" else
                     "official Few-NERD supervised benchmark evidence"),
}
(out / "github-summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False, sort_keys=True) + "\n", encoding="utf-8")
shutil.make_archive("/content/malecns-fewnerd-result", "zip", out)
print(json.dumps(summary, ensure_ascii=False), flush=True)
PY

python3 - "$TMP/launcher.py" "$PAPERS_REF" "$RELEASE_BASE" "$MODE" "$LIMIT_PER_SPLIT" "$MAX_TOKENS" \
  "$WANDB_API_KEY" "$WANDB_ENTITY" "$WANDB_PROJECT" "$WANDB_RUN_GROUP" <<'PY'
from pathlib import Path
import sys
p = Path(sys.argv[1])
papers_ref, release_base, mode, limit_per_split, max_tokens, wandb_key, wandb_entity, wandb_project, wandb_group = sys.argv[2:11]
lines = [
    "import os, runpy",
    f"os.environ['PAPERS_REF']={papers_ref!r}",
    f"os.environ['RELEASE_BASE']={release_base!r}",
    f"os.environ['MALECNS_FEWNERD_MODE']={mode!r}",
    f"os.environ['MALECNS_FEWNERD_LIMIT']={limit_per_split!r}",
    f"os.environ['MALECNS_FEWNERD_MAX_TOKENS']={max_tokens!r}",
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
  echo "[colab] Few-NERD attempt ${attempt}/2 using session '$CURRENT_SESSION'"
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

  colab "--auth=$AUTH" download -s "$CURRENT_SESSION" /content/malecns-fewnerd-result.zip "$TMP/result.zip" || true
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
echo "Colab Few-NERD result: $OUTPUT_DIR"
