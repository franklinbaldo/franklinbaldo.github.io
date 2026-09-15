#!/usr/bin/env bash
set -euo pipefail

OUTPUT=""
ACCELERATOR="${KAGGLE_ACCELERATOR:-NvidiaTeslaT4}"
KERNEL_ID="${KAGGLE_FEWNERD_KERNEL_ID:-}"
PAPERS_REF="${PAPERS_REF:-d6fe967c43c8c2acd9276100d5f12791e1749e54}"
LIMIT="${FEWNERD_SMOKE_LIMIT:-256}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --output) OUTPUT="$2"; shift 2 ;;
    --accelerator) ACCELERATOR="$2"; shift 2 ;;
    --kernel-id) KERNEL_ID="$2"; shift 2 ;;
    --papers-ref) PAPERS_REF="$2"; shift 2 ;;
    --limit) LIMIT="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

[[ -n "$OUTPUT" ]] || { echo "--output is required" >&2; exit 2; }
if [[ -z "$KERNEL_ID" && -n "${KAGGLE_USERNAME:-}" ]]; then
  KERNEL_ID="${KAGGLE_USERNAME}/malecns-fewnerd-byte-ner"
fi
[[ "$KERNEL_ID" == */* && "$KERNEL_ID" != /* ]] || { echo "KAGGLE_FEWNERD_KERNEL_ID or KAGGLE_USERNAME is required" >&2; exit 2; }
command -v kaggle >/dev/null || { echo "kaggle CLI not found" >&2; exit 2; }

STAGE="$(mktemp -d)"; DOWNLOAD="$(mktemp -d)"
trap 'rm -rf "$STAGE" "$DOWNLOAD"' EXIT

cat > "$STAGE/job.py" <<PY
import json, pathlib, shutil, subprocess, sys
root=pathlib.Path('/kaggle/working/fewnerd')
subprocess.check_call(['git','clone','--filter=blob:none','https://github.com/franklinbaldo/papers.git',str(root/'papers')])
subprocess.check_call(['git','checkout','$PAPERS_REF'],cwd=root/'papers')
subprocess.check_call([sys.executable,'-m','pip','install','--disable-pip-version-check','datasets>=4,<5'])
script=root/'papers'/'experiments'/'malecns_wifi'/'scripts'/'fewnerd_byte_ner_smoke.py'
out=root/'result'; out.mkdir(parents=True,exist_ok=True)
report=out/'fewnerd-byte-smoke.json'
subprocess.check_call([sys.executable,str(script),'--output',str(report),'--split','train','--limit','$LIMIT'])
summary=json.loads(report.read_text())
summary['executor']='kaggle'; summary['papers_ref']='$PAPERS_REF'; summary['accelerator']='$ACCELERATOR'
(out/'github-summary.json').write_text(json.dumps(summary,indent=2)+'\n')
shutil.make_archive('/kaggle/working/malecns-fewnerd-result','zip',out)
print(json.dumps({'event':'fewnerd_kaggle_smoke_complete','samples':summary['samples'],'bytes':summary['bytes']}))
PY

cat > "$STAGE/kernel-metadata.json" <<JSON
{
  "id": "$KERNEL_ID",
  "title": "MaleCNS Few-NERD byte NER smoke",
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

kaggle kernels push -p "$STAGE" --accelerator "$ACCELERATOR" -t "${KAGGLE_MALECNS_TIMEOUT:-10800}"
for _ in $(seq 1 "${KAGGLE_STATUS_POLLS:-300}"); do
  STATUS="$(kaggle kernels status "$KERNEL_ID" 2>&1 || true)"; echo "$STATUS"
  if grep -Eqi 'complete|success' <<<"$STATUS"; then break; fi
  if grep -Eqi 'error|failed|cancel' <<<"$STATUS"; then echo "Kaggle Few-NERD job failed" >&2; exit 1; fi
  sleep "${KAGGLE_STATUS_INTERVAL:-20}"
done
STATUS="$(kaggle kernels status "$KERNEL_ID" 2>&1 || true)"
grep -Eqi 'complete|success' <<<"$STATUS" || { echo "Kaggle Few-NERD job did not complete: $STATUS" >&2; exit 1; }
kaggle kernels output "$KERNEL_ID" -p "$DOWNLOAD" -o --file-pattern '.*malecns-fewnerd-result[.]zip$'
RESULT="$(find "$DOWNLOAD" -type f -name 'malecns-fewnerd-result.zip' -print -quit)"
[[ -n "$RESULT" ]] || { echo "Kaggle output did not contain malecns-fewnerd-result.zip" >&2; exit 1; }
mkdir -p "$(dirname "$OUTPUT")"; cp "$RESULT" "$OUTPUT"
echo "kaggle result: $OUTPUT"
