#!/usr/bin/env bash
set -euo pipefail

ACCELERATOR="${KAGGLE_ACCELERATOR:-NvidiaTeslaT4}"
KERNEL_ID="${KAGGLE_EXP1B_PUBLIC_KERNEL_ID:-}"
PAPERS_REF="${PAPERS_REF:-feature/algorithmic-connectome-paper}"
NTFY_TOPIC="${NTFY_TOPIC:-franklinbaldo-malecns-exp1b-470-20260916-a1}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --accelerator) ACCELERATOR="$2"; shift 2 ;;
    --kernel-id) KERNEL_ID="$2"; shift 2 ;;
    --papers-ref) PAPERS_REF="$2"; shift 2 ;;
    --ntfy-topic) NTFY_TOPIC="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

if [[ -z "$KERNEL_ID" && -n "${KAGGLE_USERNAME:-}" ]]; then
  KERNEL_ID="${KAGGLE_USERNAME}/malecns-exp1b-public-session"
fi
[[ "$KERNEL_ID" == */* && "$KERNEL_ID" != /* ]] || {
  echo "KAGGLE_EXP1B_PUBLIC_KERNEL_ID or KAGGLE_USERNAME is required" >&2
  exit 2
}
command -v kaggle >/dev/null || { echo "kaggle CLI not found" >&2; exit 2; }

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

cat > "$STAGE/job.py" <<PY
import json, os, pathlib, shutil, subprocess, sys, threading, time, urllib.request

PAPERS_REF = ${PAPERS_REF@Q}
NTFY_TOPIC = ${NTFY_TOPIC@Q}
NTFY_URL = f"https://ntfy.sh/{NTFY_TOPIC}"
root = pathlib.Path('/kaggle/working')
repo = root / 'papers'
started = time.time()


def notify(event, **payload):
    body = json.dumps({
        'event': event,
        'ts': time.time(),
        'elapsed_s': round(time.time() - started, 1),
        **payload,
    }, sort_keys=True).encode()
    req = urllib.request.Request(NTFY_URL, data=body, method='POST', headers={
        'Title': f'MaleCNS Exp1B: {event}',
        'Tags': 'microscope,computer',
        'Content-Type': 'application/json',
    })
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            r.read()
    except Exception as exc:
        print('ntfy failed:', repr(exc), flush=True)


def heartbeat():
    while True:
        time.sleep(60)
        notify('heartbeat')

threading.Thread(target=heartbeat, daemon=True).start()
notify('session_started', kaggle_kernel=${KERNEL_ID@Q}, papers_ref=PAPERS_REF,
       ntfy_url=f'https://ntfy.sh/{NTFY_TOPIC}')

run = None
try:
    if repo.exists():
        shutil.rmtree(repo)
    notify('clone_started')
    subprocess.check_call(['git', 'clone', '--depth', '1', '--branch', PAPERS_REF,
                           'https://github.com/franklinbaldo/papers.git', str(repo)])
    exp = repo / 'experiments' / 'malecns_wifi'
    notify('install_started')
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', '--disable-pip-version-check', '-q', '-e', str(exp)])
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', '--disable-pip-version-check', '-q',
                           'huggingface_hub>=0.27', 'wandb>=0.19.10'])

    try:
        import wandb
        run = wandb.init(project='malecns-exp1b-recurrent-controls',
                         name='kaggle-exp1b-public-session',
                         anonymous='allow',
                         config={'papers_ref': PAPERS_REF, 'kaggle': True, 'exp': '1B'})
        notify('wandb_started', wandb_url=getattr(run, 'url', None), wandb_id=getattr(run, 'id', None))
    except Exception as exc:
        notify('wandb_unavailable', error=repr(exc))
        print('wandb unavailable; continuing with ntfy telemetry:', repr(exc), flush=True)
        run = None

    from huggingface_hub import hf_hub_download, snapshot_download
    import numpy as np

    artifacts = exp / 'artifacts' / 'runtime-v1'
    artifacts.mkdir(parents=True, exist_ok=True)
    target = artifacts / 'multieurlex-1000-features.npz'
    source = None
    notify('features_download_started')
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
            raise RuntimeError('no compatible MultiEURLEX feature bundle found')
    shutil.copy2(source, target)
    notify('features_ready', bytes=target.stat().st_size)

    out = root / 'multieurlex-exp1b-results.json'
    env = os.environ.copy()
    if run is not None:
        env['WANDB_PROJECT'] = 'malecns-exp1b-recurrent-controls'
        env['WANDB_RUN_ID'] = run.id
        env['WANDB_RESUME'] = 'allow'
    else:
        env.pop('WANDB_RUN_ID', None)
        env.pop('WANDB_RESUME', None)
        env.setdefault('WANDB_MODE', 'disabled')

    cmd = [sys.executable, str(exp / 'scripts' / 'run_multieurlex_exp1b_recurrent_controls.py'),
           '--features', str(target), '--output', str(out), '--seeds', '0', '1', '2']
    notify('experiment_started', command=' '.join(cmd))
    proc = subprocess.Popen(cmd, cwd=exp, env=env, stdout=subprocess.PIPE,
                            stderr=subprocess.STDOUT, text=True, bufsize=1)
    for line in proc.stdout:
        print(line, end='', flush=True)
        if 'macro' in line.lower() or 'seed' in line.lower() or 'gain' in line.lower():
            notify('progress', line=line.strip()[:500])
    code = proc.wait()
    if code != 0:
        raise subprocess.CalledProcessError(code, cmd)
    result = json.loads(out.read_text())
    if run is not None:
        run.log({'completed': 1})
        run.summary['result'] = result
    notify('experiment_finished', result=result,
           wandb_url=(getattr(run, 'url', None) if run is not None else None))
    if run is not None:
        run.finish()
except Exception as exc:
    notify('session_failed', error=repr(exc))
    if run is not None:
        try:
            run.finish(exit_code=1)
        except Exception:
            pass
    raise
PY

cat > "$STAGE/kernel-metadata.json" <<JSON
{
  "id": "$KERNEL_ID",
  "title": "MaleCNS MultiEURLEX Exp 1B public session",
  "code_file": "job.py",
  "language": "python",
  "kernel_type": "script",
  "is_private": false,
  "enable_gpu": true,
  "enable_internet": true,
  "dataset_sources": [],
  "competition_sources": [],
  "kernel_sources": [],
  "model_sources": []
}
JSON

kaggle kernels push -p "$STAGE" --accelerator "$ACCELERATOR"

echo "KAGGLE_KERNEL_ID=$KERNEL_ID"
echo "KAGGLE_URL=https://www.kaggle.com/code/$KERNEL_ID"
echo "NTFY_URL=https://ntfy.sh/$NTFY_TOPIC"
echo "NTFY_JSON=https://ntfy.sh/$NTFY_TOPIC/json?poll=1"
