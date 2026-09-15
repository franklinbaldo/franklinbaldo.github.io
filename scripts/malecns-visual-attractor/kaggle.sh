#!/usr/bin/env bash
set -euo pipefail

SUMMARY=""
ACCELERATOR="${KAGGLE_ACCELERATOR:-NvidiaTeslaT4}"
KERNEL_ID="${KAGGLE_MALECNS_SCREEN_KERNEL_ID:-}"
VISUAL_REF="${VISUAL_REF:-ca157208329c7f09c6aaa3c3fb510bfc62b351c1}"
RUNTIME_REF="${RUNTIME_REF:-437083ae30f24f6f424ce405182d90b275b62621}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --summary) SUMMARY="$2"; shift 2 ;;
    --accelerator) ACCELERATOR="$2"; shift 2 ;;
    --kernel-id) KERNEL_ID="$2"; shift 2 ;;
    --visual-ref) VISUAL_REF="$2"; shift 2 ;;
    --runtime-ref) RUNTIME_REF="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

[[ -n "$SUMMARY" ]] || { echo "--summary is required" >&2; exit 2; }
[[ -n "${KAGGLE_USERNAME:-}" ]] || { echo "KAGGLE_USERNAME is required" >&2; exit 2; }
if [[ -z "$KERNEL_ID" ]]; then
  KERNEL_ID="${KAGGLE_USERNAME}/malecns-stationary-screen-reward"
fi
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
import urllib.request


def run(*args, cwd=None):
    print("+", " ".join(map(str, args)), flush=True)
    subprocess.check_call([str(x) for x in args], cwd=cwd)


visual_ref = os.environ["VISUAL_REF"]
runtime_ref = os.environ["RUNTIME_REF"]
kernel_id = os.environ["KERNEL_ID"]
work = pathlib.Path("/kaggle/working")
scratch = pathlib.Path("/kaggle/temp/malecns-stationary-screen-reward")
scratch.mkdir(parents=True, exist_ok=True)
visual_repo = scratch / "papers-visual"
runtime_repo = scratch / "papers-runtime"
cache = scratch / "malecns-source-cache"
runtime_out = work / "runtime"
run_out = work / "screen-reward"
public_cache = work / "public-cache"
for path in (runtime_out, run_out, public_cache):
    path.mkdir(parents=True, exist_ok=True)

run("git", "clone", "--filter=blob:none", "https://github.com/franklinbaldo/papers.git", visual_repo)
run("git", "checkout", visual_ref, cwd=visual_repo)
run("git", "clone", "--filter=blob:none", "https://github.com/franklinbaldo/papers.git", runtime_repo)
run("git", "checkout", runtime_ref, cwd=runtime_repo)

visual_exp = visual_repo / "experiments/malecns_visual_attractor"
runtime_exp = runtime_repo / "experiments/malecns_wifi"
run(sys.executable, "-m", "pip", "install", "--disable-pip-version-check", "-e", str(runtime_exp))
run(sys.executable, "-m", "pip", "install", "--disable-pip-version-check", "-e", f"{visual_exp}[gpu]")

graph_dir = runtime_out / "graph"
run(
    sys.executable,
    runtime_exp / "scripts/compile_connectome.py",
    "--output", graph_dir,
    "--cache", cache,
    cwd=runtime_exp,
)
graph = graph_dir / "graph.npz"

optic_url = (
    "https://raw.githubusercontent.com/flyconnectome/2025malecns/"
    "67767d2233657983993ff6c2be48e836a935863c/"
    "supplemental_data/optic-column-type-assignments-v1.0.xlsx"
)
optic = runtime_out / "optic-column-type-assignments-v1.0.xlsx"
urllib.request.urlretrieve(optic_url, optic)
annotations = cache / "male-cns-v1.0" / "body-annotations-male-cns-v1.0-minconf-0.5.feather"
interface = runtime_out / "visual-interface.npz"
interface_manifest = runtime_out / "visual-interface.json"
run(
    sys.executable,
    visual_exp / "scripts/build_interface.py",
    "--graph", graph,
    "--annotations", annotations,
    "--optic-columns", optic,
    "--output", interface,
    "--manifest", interface_manifest,
    cwd=visual_exp,
)

screen_geometry = runtime_out / "screen-geometry.npz"
screen_geometry_manifest = runtime_out / "screen-geometry.json"
run(
    sys.executable,
    visual_exp / "scripts/build_screen_geometry.py",
    "--interface", interface,
    "--optic-columns", optic,
    "--output", screen_geometry,
    "--manifest", screen_geometry_manifest,
    cwd=visual_exp,
)

run(
    sys.executable,
    visual_exp / "scripts/run_stationary_screen_reward_loop.py",
    "--graph", graph,
    "--interface", interface,
    "--screen-geometry", screen_geometry,
    "--output-dir", run_out,
    "--device", "cuda",
    "--flies", "8",
    "--steps", "400",
    "--population", "9",
    "--generations", "3",
    "--radius", "0.75",
    "--seed", "20260914",
    "--spectral-scale", "3776.27",
    "--gain", "1.0",
    "--leak", "0.2",
    "--visual-scale", "0.5",
    "--reward-scale", "0.08",
    "--reward-feedback-gain", "1000.0",
    "--mutation-sigma", "0.18",
    "--telemetry-every", "100",
    cwd=visual_exp,
)

summary = json.loads((run_out / "screen-reward-summary.json").read_text(encoding="utf-8"))
summary["visual_ref"] = visual_ref
summary["runtime_ref"] = runtime_ref
summary["kernel"] = kernel_id
summary["kaggle_url"] = f"https://www.kaggle.com/code/{kernel_id}"
summary["public"] = True
summary["graph_manifest"] = json.loads((graph_dir / "manifest.json").read_text(encoding="utf-8"))
summary["interface_manifest"] = json.loads(interface_manifest.read_text(encoding="utf-8"))
summary["screen_geometry_manifest"] = json.loads(screen_geometry_manifest.read_text(encoding="utf-8"))
(public_cache / "github-summary.json").write_text(
    json.dumps(summary, indent=2, sort_keys=True) + "\n",
    encoding="utf-8",
)

for name in (
    "progress.jsonl",
    "winner-retina.txt",
    "winner-top-receptors.json",
    "screen-reward-summary.json",
):
    shutil.copy2(run_out / name, public_cache / name)
shutil.copy2(interface_manifest, public_cache / "visual-interface.json")
shutil.copy2(screen_geometry_manifest, public_cache / "screen-geometry.json")
(public_cache / "provenance.json").write_text(
    json.dumps(
        {
            "visual_ref": visual_ref,
            "runtime_ref": runtime_ref,
            "kernel": kernel_id,
            "kaggle_url": f"https://www.kaggle.com/code/{kernel_id}",
            "public": True,
        },
        indent=2,
        sort_keys=True,
    ) + "\n",
    encoding="utf-8",
)
PY

python3 - "$STAGE/job.py" "$VISUAL_REF" "$RUNTIME_REF" "$KERNEL_ID" <<'PY'
from pathlib import Path
import sys
path = Path(sys.argv[1])
text = path.read_text(encoding="utf-8")
prefix = (
    "import os\n"
    f"os.environ['VISUAL_REF'] = {sys.argv[2]!r}\n"
    f"os.environ['RUNTIME_REF'] = {sys.argv[3]!r}\n"
    f"os.environ['KERNEL_ID'] = {sys.argv[4]!r}\n"
)
path.write_text(prefix + text, encoding="utf-8")
PY

cat > "$STAGE/kernel-metadata.json" <<JSON
{
  "id": "$KERNEL_ID",
  "title": "MaleCNS Stationary Screen Reward Loop",
  "code_file": "job.py",
  "language": "python",
  "kernel_type": "script",
  "is_private": false,
  "enable_gpu": true,
  "enable_internet": true,
  "machine_shape": "$ACCELERATOR",
  "dataset_sources": [],
  "competition_sources": [],
  "kernel_sources": [],
  "model_sources": []
}
JSON

kaggle kernels push -p "$STAGE" --accelerator "$ACCELERATOR" -t "${KAGGLE_MALECNS_VISUAL_TIMEOUT:-21600}"

# Stream the public kernel log, including retina grids and reward telemetry, into
# GitHub Actions while a separate loop watches the terminal worker status.
(kaggle kernels logs "$KERNEL_ID" --follow --interval 10 || true) &
LOG_PID=$!

deadline=$(( $(date +%s) + ${KAGGLE_MALECNS_VISUAL_WAIT_SECONDS:-21600} ))
while :; do
  STATUS="$(kaggle kernels status "$KERNEL_ID" 2>&1 || true)"
  echo "$STATUS"
  if grep -Eqi 'KernelWorkerStatus[.](COMPLETE|SUCCESS)' <<<"$STATUS"; then
    break
  fi
  if grep -Eqi 'KernelWorkerStatus[.](ERROR|CANCEL|FAILED)' <<<"$STATUS"; then
    wait "$LOG_PID" || true
    echo "Kaggle kernel itself reported failure" >&2
    exit 1
  fi
  if (( $(date +%s) >= deadline )); then
    wait "$LOG_PID" || true
    echo "Kaggle kernel did not reach COMPLETE before deadline" >&2
    exit 1
  fi
  sleep 30
done
wait "$LOG_PID" || true

delay=15
downloaded=0
for attempt in $(seq 1 "${KAGGLE_OUTPUT_ATTEMPTS:-10}"); do
  rm -rf "${DOWNLOAD:?}"/*
  if kaggle kernels output "$KERNEL_ID" -p "$DOWNLOAD" -o --file-pattern '.*public-cache/.*'; then
    downloaded=1
    break
  fi
  sleep "$delay"
  delay=$(( delay < 120 ? delay * 2 : 120 ))
done
[[ "$downloaded" == 1 ]] || { echo "public cache remained unavailable" >&2; exit 1; }
RESULT="$(find "$DOWNLOAD" -type f -name 'github-summary.json' -print -quit)"
[[ -n "$RESULT" ]] || { echo "Kaggle public cache did not contain github-summary.json" >&2; exit 1; }
mkdir -p "$(dirname "$SUMMARY")"
cp "$RESULT" "$SUMMARY"
echo "Kaggle summary: $SUMMARY"
echo "Kaggle URL: https://www.kaggle.com/code/$KERNEL_ID"
