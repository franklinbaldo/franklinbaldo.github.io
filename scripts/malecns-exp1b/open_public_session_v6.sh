#!/usr/bin/env bash
set -euo pipefail

ACCELERATOR="${KAGGLE_ACCELERATOR:-NvidiaTeslaT4}"
KERNEL_ID="${KAGGLE_EXP1B_PUBLIC_KERNEL_ID:-${KAGGLE_USERNAME:-}/malecns-multieurlex-exp-1b-public-session}"
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

[[ "$KERNEL_ID" == */* && "$KERNEL_ID" != /* ]] || { echo "Kaggle kernel id required" >&2; exit 2; }
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
    persist(status_path, {'event': event, 'phase': phase, 'elapsed_s': round(time.time()-started,1), 'ts': time.time(), 'papers_ref': PAPERS_REF, **payload})


def _post(body):
    try:
        req = urllib.request.Request(NTFY_URL, data=body, method='POST', headers={'Content-Type':'application/json'})
        urllib.request.urlopen(req, timeout=3).read()
    except Exception as exc:
        print('ntfy failed:', repr(exc), flush=True)


def notify(event, **payload):
    status(event, **payload)
    body = json.dumps({'event':event,'phase':phase,'elapsed_s':round(time.time()-started,1),**payload}, default=str).encode()
    threading.Thread(target=_post, args=(body,), daemon=True).start()


def mean_pool_tag_embeddings(names, model_name, revision):
    import torch
    from transformers import AutoTokenizer, AutoModel
    tokenizer = AutoTokenizer.from_pretrained(model_name, revision=revision)
    model = AutoModel.from_pretrained(model_name, revision=revision).eval()
    rows=[]
    with torch.no_grad():
        for start in range(0, len(names), 16):
            batch = tokenizer(names[start:start+16], padding=True, truncation=True, max_length=128, return_tensors='pt')
            hidden = model(**batch).last_hidden_state
            mask = batch['attention_mask'].unsqueeze(-1).to(hidden.dtype)
            pooled = (hidden * mask).sum(1) / mask.sum(1).clamp(min=1e-9)
            rows.append(pooled.float().cpu().numpy())
    import numpy as np
    return np.vstack(rows).astype(np.float32)


def labels_to_mask(labels):
    import numpy as np
    arr = np.asarray(labels)
    if arr.ndim == 1 and arr.size == EXPECTED_LABELS and set(np.unique(arr)).issubset({0,1,False,True}):
        return arr.astype(np.float32)
    mask = np.zeros(EXPECTED_LABELS, dtype=np.float32)
    for value in list(labels):
        idx = int(value)
        if not 0 <= idx < EXPECTED_LABELS:
            raise RuntimeError(f'label index out of range: {idx}')
        mask[idx] = 1.0
    return mask


def label_names_from_feature(feature):
    # Sequence(ClassLabel), ClassLabel, or plain sequence of ints.
    inner = getattr(feature, 'feature', feature)
    names = getattr(inner, 'names', None)
    if names and len(names) == EXPECTED_LABELS:
        return [str(x).replace('_',' ') for x in names]
    return [str(i) for i in range(EXPECTED_LABELS)]


output_root.mkdir(parents=True, exist_ok=True)
notify('session_started', kernel=${KERNEL_ID@Q})
try:
    phase='scratch_setup'; status('scratch_setup_started')
    shutil.rmtree(scratch, ignore_errors=True); scratch.mkdir(parents=True)

    phase='clone'; notify('clone_started')
    subprocess.check_call(['git','clone','--depth','1','--branch',PAPERS_REF,'https://github.com/franklinbaldo/papers.git',str(repo)])
    exp = repo/'experiments'/'malecns_wifi'

    phase='install'; notify('install_started')
    subprocess.check_call([sys.executable,'-m','pip','install','--disable-pip-version-check','-q','-e',str(exp)])
    subprocess.check_call([sys.executable,'-m','pip','install','--disable-pip-version-check','-q','huggingface_hub>=0.27','datasets>=3.0','transformers>=4.45'])

    phase='cache_download'; notify('cache_download_started')
    from huggingface_hub import snapshot_download
    snap = pathlib.Path(snapshot_download(repo_id='franklinbaldo/multieurlex21-pt-semantic-cache', repo_type='dataset'))
    manifest = json.loads((snap/'manifest.json').read_text())
    parquet = snap/'paraphrase-multilingual-minilm-l12-v2.parquet'
    if not parquet.is_file(): raise RuntimeError('MiniLM parquet missing')

    phase='parquet_select'; notify('parquet_select_started')
    import pyarrow.parquet as pq
    import numpy as np
    table = pq.read_table(parquet, columns=['split','split_index','chunk_index','embedding'])
    rows = [r for r in table.to_pylist() if r['split'] == 'test']
    rows.sort(key=lambda r: (int(r['split_index']), int(r['chunk_index'])))
    rows = rows[:EXPECTED_CHUNKS]
    groups = np.asarray([int(r['split_index']) for r in rows], dtype=np.int64)
    absolute = np.asarray([r['embedding'] for r in rows], dtype=np.float32)
    docs = int(np.unique(groups).size)
    persist(output_root/'exp1b-reconstruction.json', {
        'selected_chunks': len(rows), 'documents': docs,
        'first_key': [int(rows[0]['split_index']), int(rows[0]['chunk_index'])] if rows else None,
        'last_key': [int(rows[-1]['split_index']), int(rows[-1]['chunk_index'])] if rows else None,
    })
    if absolute.shape != (EXPECTED_CHUNKS, EXPECTED_DIM):
        raise RuntimeError(f'absolute shape {absolute.shape}')
    if docs != EXPECTED_DOCUMENTS:
        raise RuntimeError(f'first 1000 deterministic test chunks contain {docs} documents, expected {EXPECTED_DOCUMENTS}')

    phase='dataset_labels'; notify('dataset_labels_started', documents=docs)
    from datasets import load_dataset
    ds_path = manifest['dataset']['path']
    ds_revision = manifest['dataset']['revision']
    subset = manifest['dataset']['subset']
    ds = load_dataset(ds_path, subset, split='test', revision=ds_revision)
    label_field = next((k for k in ('labels','label','targets') if k in ds.column_names), None)
    if label_field is None:
        raise RuntimeError(f'no label field in dataset columns {ds.column_names}')
    tag_masks = np.vstack([labels_to_mask(ds[int(g)][label_field]) for g in groups]).astype(np.float32)
    tag_names = label_names_from_feature(ds.features[label_field])

    phase='tag_embeddings'; notify('tag_embeddings_started', tag_names=tag_names)
    encoder = manifest['encoders'][0]
    tag_embeddings = mean_pool_tag_embeddings(tag_names, encoder['name'], encoder['revision'])

    target = scratch/'multieurlex-1000-features.npz'
    np.savez(target, absolute=absolute, tag_masks=tag_masks, groups=groups, tag_embeddings=tag_embeddings, tag_names=np.asarray(tag_names))
    persist(output_root/'exp1b-bundle-manifest.json', {
        'absolute_shape': list(absolute.shape), 'tag_masks_shape': list(tag_masks.shape),
        'groups_shape': list(groups.shape), 'tag_embeddings_shape': list(tag_embeddings.shape),
        'documents': docs, 'label_field': label_field, 'tag_names': tag_names,
        'dataset_revision': ds_revision, 'encoder_revision': encoder['revision'],
    })

    phase='experiment'; notify('experiment_started')
    out = output_root/'multieurlex-exp1b-results.json'
    cmd=[sys.executable,str(exp/'scripts'/'run_multieurlex_exp1b_recurrent_controls.py'),'--features',str(target),'--output',str(out),'--seeds','0','1','2']
    proc=subprocess.Popen(cmd,cwd=exp,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,bufsize=1)
    for line in proc.stdout:
        print(line,end='',flush=True)
        if any(word in line.lower() for word in ('macro','seed','gain','recheck','guard')):
            notify('progress', line=line.strip()[:700])
    code=proc.wait()
    if code: raise subprocess.CalledProcessError(code,cmd)
    phase='finished'; notify('experiment_finished', result=json.loads(out.read_text()))
except BaseException as exc:
    tb=traceback.format_exc()
    persist(failure_path, {'event':'session_failed','phase':phase,'elapsed_s':round(time.time()-started,1),'error_type':type(exc).__name__,'error':repr(exc),'traceback':tb})
    status('session_failed', error_type=type(exc).__name__, error=repr(exc))
    print(tb, flush=True)
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
echo "KAGGLE_URL=https://www.kaggle.com/code/$KERNEL_ID"
