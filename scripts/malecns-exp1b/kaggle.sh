#!/usr/bin/env bash
set -euo pipefail

OUTPUT=""
ACCELERATOR="${KAGGLE_ACCELERATOR:-NvidiaTeslaT4}"
KERNEL_ID="${KAGGLE_EXP1B_KERNEL_ID:-}"
PAPERS_REF="${PAPERS_REF:-feature/algorithmic-connectome-paper}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --output) OUTPUT="$2"; shift 2 ;;
    --accelerator) ACCELERATOR="$2"; shift 2 ;;
    --kernel-id) KERNEL_ID="$2"; shift 2 ;;
    --papers-ref) PAPERS_REF="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

[[ -n "$OUTPUT" ]] || { echo "--output is required" >&2; exit 2; }
if [[ -z "$KERNEL_ID" && -n "${KAGGLE_USERNAME:-}" ]]; then
  KERNEL_ID="${KAGGLE_USERNAME}/malecns-exp1b-recurrent-controls"
fi
[[ "$KERNEL_ID" == */* && "$KERNEL_ID" != /* ]] || {
  echo "KAGGLE_EXP1B_KERNEL_ID or KAGGLE_USERNAME is required" >&2
  exit 2
}
command -v kaggle >/dev/null || { echo "kaggle CLI not found" >&2; exit 2; }

STAGE="$(mktemp -d)"
DOWNLOAD="$(mktemp -d)"
trap 'rm -rf "$STAGE" "$DOWNLOAD"' EXIT

cat > "$STAGE/job.py" <<PY
import json, os, pathlib, shutil, subprocess, sys

PAPERS_REF = ${PAPERS_REF@Q}
root = pathlib.Path('/kaggle/working')
repo = root / 'papers'
if repo.exists():
    shutil.rmtree(repo)
subprocess.check_call(['git', 'clone', '--depth', '1', '--branch', PAPERS_REF,
                       'https://github.com/franklinbaldo/papers.git', str(repo)])
exp = repo / 'experiments' / 'malecns_wifi'
subprocess.check_call([sys.executable, '-m', 'pip', 'install', '--disable-pip-version-check', '-q', '-e', str(exp)])
subprocess.check_call([sys.executable, '-m', 'pip', 'install', '--disable-pip-version-check', '-q',
                       'huggingface_hub>=0.27', 'wandb>=0.19.10'])

from huggingface_hub import hf_hub_download, snapshot_download
import numpy as np

artifacts = exp / 'artifacts' / 'runtime-v1'
artifacts.mkdir(parents=True, exist_ok=True)
target = artifacts / 'multieurlex-1000-features.npz'
source = None
try:
    source = pathlib.Path(hf_hub_download(
        repo_id='franklinbaldo/multieurlex21-pt-semantic-cache',
        repo_type='dataset', filename='multieurlex-1000-features.npz'))
except Exception as exc:
    print('direct HF feature download failed:', repr(exc), flush=True)
    snap = pathlib.Path(snapshot_download(
        repo_id='franklinbaldo/multieurlex21-pt-semantic-cache', repo_type='dataset'))
    required = {'absolute', 'tag_masks', 'groups', 'tag_embeddings'}
    for candidate in sorted(snap.rglob('*.npz')):
        try:
            with np.load(candidate, allow_pickle=False) as data:
                if required.issubset(data.files):
                    source = candidate
                    break
        except Exception:
            pass
    if source is None:
        print('HF snapshot files:', flush=True)
        for item in sorted(snap.rglob('*')):
            if item.is_file():
                print(item.relative_to(snap), flush=True)
        raise RuntimeError('no compatible MultiEURLEX feature bundle found')
shutil.copy2(source, target)
print('feature bundle:', target, target.stat().st_size, flush=True)

out = root / 'multieurlex-exp1b-results.json'
env = os.environ.copy()
env.setdefault('WANDB_PROJECT', 'malecns-exp1b-recurrent-controls')
env.setdefault('WANDB_NAME', 'kaggle-exp1b-recurrent-controls')
cmd = [sys.executable, str(exp / 'scripts' / 'run_multieurlex_exp1b_recurrent_controls.py'),
       '--features', str(target), '--output', str(out), '--seeds', '0', '1', '2']
print('RUN', ' '.join(cmd), flush=True)
subprocess.check_call(cmd, cwd=exp, env=env)
assert out.exists()
shutil.make_archive(str(root / 'malecns-exp1b-result'), 'zip', root_dir=root,
                    base_dir=out.name)
print('RESULT', out.read_text()[:4000], flush=True)
PY

cat > "$STAGE/kernel-metadata.json" <<JSON
{
  "id": "$KERNEL_ID",
  "title": "MaleCNS MultiEURLEX Exp 1B recurrent controls",
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

kaggle kernels push -p "$STAGE" --accelerator "$ACCELERATOR" -t "${KAGGLE_EXP1B_TIMEOUT:-10800}"

for _ in $(seq 1 "${KAGGLE_STATUS_POLLS:-400}"); do
  STATUS="$(kaggle kernels status "$KERNEL_ID" 2>&1 || true)"
  echo "$STATUS"
  if grep -Eqi 'complete|success' <<<"$STATUS"; then
    break
  fi
  if grep -Eqi 'error|failed|cancel' <<<"$STATUS"; then
    echo "Kaggle Exp1B job failed" >&2
    kaggle kernels output "$KERNEL_ID" -p "$DOWNLOAD" -o -q --file-pattern '^$' || true
    find "$DOWNLOAD" -type f -name '*.log' -maxdepth 2 -print -exec cat {} \; >&2 || true
    exit 1
  fi
  sleep "${KAGGLE_STATUS_INTERVAL:-30}"
done

STATUS="$(kaggle kernels status "$KERNEL_ID" 2>&1 || true)"
if ! grep -Eqi 'complete|success' <<<"$STATUS"; then
  echo "Kaggle Exp1B job did not complete: $STATUS" >&2
  exit 1
fi

kaggle kernels output "$KERNEL_ID" -p "$DOWNLOAD" -o --file-pattern '.*malecns-exp1b-result[.]zip$'
RESULT="$(find "$DOWNLOAD" -type f -name 'malecns-exp1b-result.zip' -print -quit)"
[[ -n "$RESULT" ]] || { echo "Kaggle output missing malecns-exp1b-result.zip" >&2; exit 1; }
mkdir -p "$(dirname "$OUTPUT")"
cp "$RESULT" "$OUTPUT"
echo "kaggle result: $OUTPUT"
