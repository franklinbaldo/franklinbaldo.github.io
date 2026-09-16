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

EXPECTED_CHUNKS = 1000
EXPECTED_DOCUMENTS = 477
EXPECTED_LABELS = 21
EXPECTED_DIM = 384


def persist(path, payload):
    path.write_text(json.dumps(payload, indent=2, sort_keys=True, default=str) + '\n')


def status(event, **payload):
    persist(status_path, {
        'event': event, 'phase': phase, 'ts': time.time(),
        'elapsed_s': round(time.time() - started, 1), 'python': sys.version,
        'papers_ref': PAPERS_REF, **payload,
    })


def _post_ntfy(body):
    req = urllib.request.Request(NTFY_URL, data=body, method='POST', headers={
        'Title': 'MaleCNS Exp1B telemetry', 'Tags': 'microscope,computer',
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
        'event': event, 'phase': phase, 'ts': time.time(),
        'elapsed_s': round(time.time() - started, 1), **payload,
    }, sort_keys=True, default=str).encode()
    threading.Thread(target=_post_ntfy, args=(body,), daemon=True).start()


def heartbeat():
    while True:
        time.sleep(60)
        notify('heartbeat')


def _first(record, names):
    for name in names:
        if name in record and record[name] is not None:
            return record[name]
    return None


def _as_vector(value):
    if value is None:
        return None
    arr = np.asarray(value)
    if arr.ndim == 1:
        return arr
    return None


def _nested_find(obj, wanted):
    if isinstance(obj, dict):
        for key, value in obj.items():
            if key in wanted:
                yield value
            yield from _nested_find(value, wanted)
    elif isinstance(obj, list):
        for value in obj:
            yield from _nested_find(value, wanted)


def rebuild_from_parquet(snap, files, target):
    """Rebuild the exact frozen Exp.1 NPZ from the published semantic cache.

    The cache predates the convenience NPZ and is published as Parquet.  Accept
    common historical field names, then enforce the frozen protocol invariants
    before the scientific runner is allowed to start.
    """
    import pyarrow.parquet as pq

    preferred = snap / 'paraphrase-multilingual-minilm-l12-v2.parquet'
    candidates = [preferred] if preferred.is_file() else []
    candidates += [p for p in files if p.suffix == '.parquet' and p != preferred]
    manifest_path = snap / 'manifest.json'
    manifest = json.loads(manifest_path.read_text()) if manifest_path.is_file() else {}

    diagnostics = {'manifest': manifest, 'parquets': {}}
    for parquet in candidates:
        table = pq.read_table(parquet)
        records = table.to_pylist()
        diagnostics['parquets'][parquet.name] = {
            'rows': len(records),
            'columns': table.column_names,
            'schema': str(table.schema),
        }
        print('Parquet candidate:', parquet.name, diagnostics['parquets'][parquet.name], flush=True)

        # Fast path: one-row or repeated bundle-shaped columns.
        for record in records[: min(len(records), 32)]:
            absolute = _first(record, ('absolute', 'features', 'chunk_embeddings'))
            tag_masks = _first(record, ('tag_masks', 'label_masks', 'targets'))
            groups = _first(record, ('groups', 'document_groups', 'doc_groups'))
            tag_embeddings = _first(record, ('tag_embeddings', 'label_embeddings'))
            try:
                a = np.asarray(absolute, dtype=np.float32)
                m = np.asarray(tag_masks)
                g = np.asarray(groups)
                t = np.asarray(tag_embeddings, dtype=np.float32)
                if a.shape == (EXPECTED_CHUNKS, EXPECTED_DIM) and m.shape == (EXPECTED_CHUNKS, EXPECTED_LABELS) and g.shape == (EXPECTED_CHUNKS,) and t.shape[0] == EXPECTED_LABELS:
                    np.savez(target, absolute=a, tag_masks=m, groups=g, tag_embeddings=t)
                    return {'source': parquet.name, 'layout': 'bundle-columns'}
            except Exception:
                pass

        # Row-oriented cache: chunk embedding + document id + 21-way mask.
        chunks = []
        tag_rows = []
        for index, record in enumerate(records):
            embedding = _as_vector(_first(record, (
                'embedding', 'embeddings', 'vector', 'absolute', 'feature', 'features'
            )))
            if embedding is None or embedding.size != EXPECTED_DIM:
                continue
            mask = _as_vector(_first(record, (
                'tag_mask', 'tag_masks', 'label_mask', 'label_masks', 'labels', 'targets'
            )))
            group = _first(record, (
                'group', 'groups', 'document_id', 'doc_id', 'document', 'document_index'
            ))
            kind = str(_first(record, ('kind', 'type', 'row_type', 'record_type')) or '').lower()
            if mask is not None and mask.size == EXPECTED_LABELS and group is not None:
                chunks.append((index, embedding.astype(np.float32), np.asarray(mask), group))
            elif 'tag' in kind or 'label' in kind:
                tag_rows.append((index, embedding.astype(np.float32), record))

        if len(chunks) == EXPECTED_CHUNKS:
            chunks.sort(key=lambda item: item[0])
            absolute = np.stack([item[1] for item in chunks]).astype(np.float32)
            tag_masks = np.stack([item[2] for item in chunks])
            raw_groups = [item[3] for item in chunks]
            # Preserve integer document ids when present; otherwise stable-factorize.
            try:
                groups = np.asarray(raw_groups, dtype=np.int64)
            except (TypeError, ValueError):
                mapping = {}
                groups = np.asarray([
                    mapping.setdefault(str(value), len(mapping)) for value in raw_groups
                ], dtype=np.int64)

            tag_embeddings = None
            # Some cache versions repeat the complete 21x384 matrix in metadata.
            for value in _nested_find(manifest, {'tag_embeddings', 'label_embeddings'}):
                try:
                    candidate = np.asarray(value, dtype=np.float32)
                    if candidate.shape == (EXPECTED_LABELS, EXPECTED_DIM):
                        tag_embeddings = candidate
                        break
                except Exception:
                    pass
            if tag_embeddings is None:
                for record in records[: min(len(records), 64)]:
                    value = _first(record, ('tag_embeddings', 'label_embeddings'))
                    if value is None:
                        continue
                    try:
                        candidate = np.asarray(value, dtype=np.float32)
                        if candidate.shape == (EXPECTED_LABELS, EXPECTED_DIM):
                            tag_embeddings = candidate
                            break
                    except Exception:
                        pass
            if tag_embeddings is None and len(tag_rows) == EXPECTED_LABELS:
                tag_rows.sort(key=lambda item: item[0])
                tag_embeddings = np.stack([item[1] for item in tag_rows]).astype(np.float32)

            if tag_embeddings is not None and np.unique(groups).size == EXPECTED_DOCUMENTS:
                np.savez(target, absolute=absolute, tag_masks=tag_masks,
                         groups=groups, tag_embeddings=tag_embeddings)
                return {'source': parquet.name, 'layout': 'row-cache'}

    persist(output_root / 'exp1b-parquet-schema.json', diagnostics)
    raise RuntimeError(
        'published Parquet cache could not be mapped to frozen Exp.1 arrays; '
        'schema saved to exp1b-parquet-schema.json'
    )


output_root.mkdir(parents=True, exist_ok=True)
threading.Thread(target=heartbeat, daemon=True).start()
notify('session_started', kaggle_kernel=${KERNEL_ID@Q}, ntfy_url=f'https://ntfy.sh/{NTFY_TOPIC}')

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
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', '--disable-pip-version-check', '-q', 'huggingface_hub>=0.27'])

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
                notify('features_bundle_reconstructed', source_files={
                    name: str(by_stem[name].relative_to(snap)) for name in sorted(required)
                })

        if source is None and any(p.suffix == '.parquet' for p in files):
            phase = 'features_parquet_rebuild'
            rebuilt = rebuild_from_parquet(snap, files, target)
            source = target
            built_target = True
            notify('features_bundle_reconstructed', **rebuilt)

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
        shapes = {name: list(check[name].shape) for name in sorted(required)}
        if tuple(check['absolute'].shape) != (EXPECTED_CHUNKS, EXPECTED_DIM):
            raise RuntimeError(f"absolute shape {check['absolute'].shape} != {(EXPECTED_CHUNKS, EXPECTED_DIM)}")
        if tuple(check['tag_masks'].shape) != (EXPECTED_CHUNKS, EXPECTED_LABELS):
            raise RuntimeError(f"tag_masks shape {check['tag_masks'].shape} != {(EXPECTED_CHUNKS, EXPECTED_LABELS)}")
        if tuple(check['groups'].shape) != (EXPECTED_CHUNKS,):
            raise RuntimeError(f"groups shape {check['groups'].shape} != {(EXPECTED_CHUNKS,)}")
        if np.unique(check['groups']).size != EXPECTED_DOCUMENTS:
            raise RuntimeError(f"document count {np.unique(check['groups']).size} != {EXPECTED_DOCUMENTS}")
        if check['tag_embeddings'].shape[0] != EXPECTED_LABELS:
            raise RuntimeError(f"tag embedding count {check['tag_embeddings'].shape[0]} != {EXPECTED_LABELS}")
    notify('features_ready', bytes=target.stat().st_size, shapes=shapes)

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
        'event': 'session_failed', 'phase': phase, 'ts': time.time(),
        'elapsed_s': round(time.time() - started, 1),
        'error_type': type(exc).__name__, 'error': repr(exc), 'traceback': tb,
        'papers_ref': PAPERS_REF, 'python': sys.version,
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
