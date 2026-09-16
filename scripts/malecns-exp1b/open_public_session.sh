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
  KERNEL_ID="${KAGGLE_USERNAME}/malecns-multieurlex-exp-1b-public-session"
fi
[[ "$KERNEL_ID" == */* && "$KERNEL_ID" != /* ]] || {
  echo "KAGGLE_EXP1B_PUBLIC_KERNEL_ID or KAGGLE_USERNAME is required" >&2
  exit 2
}
command -v kaggle >/dev/null || { echo "kaggle CLI not found" >&2; exit 2; }

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

cat > "$STAGE/job.py" <<PY
import json, pathlib, shutil, subprocess, sys, threading, time, traceback, urllib.request

PAPERS_REF = ${PAPERS_REF@Q}
NTFY_TOPIC = ${NTFY_TOPIC@Q}
NTFY_URL = f"https://ntfy.sh/{NTFY_TOPIC}"
output_root = pathlib.Path('/kaggle/working')
scratch = pathlib.Path('/tmp/malecns-exp1b')
repo = scratch / 'papers'
started = time.time()
phase = 'boot'
status_path = output_root / 'exp1b-session-status.json'
failure_path = output_root / 'exp1b-session-failure.json'


def persist(path, payload):
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + '\n')


def status(event, **payload):
    persist(status_path, {
        'event': event,
        'phase': phase,
        'ts': time.time(),
        'elapsed_s': round(time.time() - started, 1),
        'python': sys.version,
        'papers_ref': PAPERS_REF,
        **payload,
    })


def _post_ntfy(body):
    req = urllib.request.Request(NTFY_URL, data=body, method='POST', headers={
        'Title': 'MaleCNS Exp1B telemetry',
        'Tags': 'microscope,computer',
        'Content-Type': 'application/json',
    })
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            response.read()
    except Exception as exc:
        print('ntfy failed:', repr(exc), flush=True)


def notify(event, **payload):
    status(event, **payload)
    body = json.dumps({
        'event': event,
        'phase': phase,
        'ts': time.time(),
        'elapsed_s': round(time.time() - started, 1),
        **payload,
    }, sort_keys=True).encode()
    threading.Thread(target=_post_ntfy, args=(body,), daemon=True).start()


def heartbeat():
    while True:
        time.sleep(60)
        notify('heartbeat')

output_root.mkdir(parents=True, exist_ok=True)
threading.Thread(target=heartbeat, daemon=True).start()
notify('session_started', kaggle_kernel=${KERNEL_ID@Q},
       ntfy_url=f'https://ntfy.sh/{NTFY_TOPIC}')

try:
    phase = 'scratch_setup'
    status('scratch_setup_started')
    if scratch.exists():
        shutil.rmtree(scratch)
    scratch.mkdir(parents=True, exist_ok=True)

    phase = 'clone'
    notify('clone_started')
    subprocess.check_call(['git', 'clone', '--depth', '1', '--branch', PAPERS_REF,
                           'https://github.com/franklinbaldo/papers.git', str(repo)])
    exp = repo / 'experiments' / 'malecns_wifi'

    phase = 'install_experiment'
    notify('install_started')
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', '--disable-pip-version-check', '-q', '-e', str(exp)])

    phase = 'install_huggingface_hub'
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', '--disable-pip-version-check', '-q',
                           'huggingface_hub>=0.27'])

    phase = 'import_dependencies'
    from huggingface_hub import hf_hub_download, snapshot_download
    import numpy as np

    artifacts = scratch / 'artifacts'
    artifacts.mkdir(parents=True, exist_ok=True)
    target = artifacts / 'multieurlex-1000-features.npz'
    source = None
    built_target = False

    phase = 'features_download'
    notify('features_download_started')
    try:
        source = pathlib.Path(hf_hub_download(
            repo_id='franklinbaldo/multieurlex21-pt-semantic-cache',
            repo_type='dataset', filename='multieurlex-1000-features.npz'))
    except Exception as exc:
        print('direct HF feature download failed:', repr(exc), flush=True)
        phase = 'features_snapshot_download'
        snap = pathlib.Path(snapshot_download(
            repo_id='franklinbaldo/multieurlex21-pt-semantic-cache', repo_type='dataset'))
        required = {'absolute', 'tag_masks', 'groups', 'tag_embeddings'}
        files = sorted(p for p in snap.rglob('*') if p.is_file())
        inventory = [str(p.relative_to(snap)) for p in files]
        print('HF snapshot files:', inventory, flush=True)
        phase = 'features_snapshot_inventory'
        notify('features_snapshot_inventory', files=inventory)

        for candidate in (p for p in files if p.suffix == '.npz'):
            try:
                with np.load(candidate, allow_pickle=False) as data:
                    if required.issubset(data.files):
                        source = candidate
                        break
            except Exception:
                pass

        if source is None:
            by_stem = {p.stem: p for p in files if p.suffix == '.npy'}
            if required.issubset(by_stem):
                arrays = {name: np.load(by_stem[name], allow_pickle=False) for name in sorted(required)}
                np.savez(target, **arrays)
                source = target
                built_target = True
                notify(
                    'features_bundle_reconstructed',
                    source_files={name: str(by_stem[name].relative_to(snap)) for name in sorted(required)},
                )

        if source is None:
            raise RuntimeError(f'no compatible MultiEURLEX feature bundle found; snapshot files={inventory}')

    phase = 'features_validate'
    if not built_target:
        shutil.copy2(source, target)
    with np.load(target, allow_pickle=False) as check:
        required = {'absolute', 'tag_masks', 'groups', 'tag_embeddings'}
        missing = sorted(required.difference(check.files))
        if missing:
            raise RuntimeError(f'reconstructed feature bundle missing keys: {missing}')
    notify('features_ready', bytes=target.stat().st_size)

    phase = 'experiment'
    out = output_root / 'multieurlex-exp1b-results.json'
    cmd = [sys.executable, str(exp / 'scripts' / 'run_multieurlex_exp1b_recurrent_controls.py'),
           '--features', str(target), '--output', str(out), '--seeds', '0', '1', '2']
    notify('experiment_started', command=' '.join(cmd))
    proc = subprocess.Popen(cmd, cwd=exp, stdout=subprocess.PIPE,
                            stderr=subprocess.STDOUT, text=True, bufsize=1)
    for line in proc.stdout:
        print(line, end='', flush=True)
        lower = line.lower()
        if 'macro' in lower or 'seed' in lower or 'gain' in lower:
            notify('progress', line=line.strip()[:500])
    code = proc.wait()
    if code != 0:
        raise subprocess.CalledProcessError(code, cmd)

    phase = 'finished'
    result = json.loads(out.read_text())
    notify('experiment_finished', result=result)
except BaseException as exc:
    tb = traceback.format_exc()
    failure = {
        'event': 'session_failed',
        'phase': phase,
        'ts': time.time(),
        'elapsed_s': round(time.time() - started, 1),
        'error_type': type(exc).__name__,
        'error': repr(exc),
        'traceback': tb,
        'papers_ref': PAPERS_REF,
        'python': sys.version,
    }
    persist(failure_path, failure)
    notify('session_failed', error_type=type(exc).__name__, error=repr(exc))
    print(tb, flush=True)
    raise
finally:
    shutil.rmtree(scratch, ignore_errors=True)
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
