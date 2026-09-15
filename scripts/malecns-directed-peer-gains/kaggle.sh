#!/usr/bin/env bash
set -euo pipefail

# Reuse the proven fail-fast coupled-flavour bridge, changing only the
# scientific entrypoint/title. The batch accepts the base bridge's frozen
# --peer-lambda 0.5 argument and validates it against the preregistration.
# SaveKernel can transiently return HTTP 429, so patch only that push step with
# bounded backoff; every non-429 failure remains fail-fast.
base="$(dirname "$0")/../malecns-coupled-flavour/kaggle.sh"
tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT
sed \
  -e 's#smoke_coupled_flavour_translation_gpu[.]py#smoke_directed_peer_gains_batch_gpu.py#g' \
  -e 's#MaleCNS Coupled Flavour Translation Smoke#MaleCNS Directed Peer Gains#g' \
  "$base" > "$tmp"
python3 - "$tmp" <<'PY'
from pathlib import Path
import sys
p = Path(sys.argv[1])
text = p.read_text(encoding="utf-8")
needle = 'kaggle kernels push -p "$STAGE" --accelerator "$ACCELERATOR" -t "${KAGGLE_MALECNS_COUPLED_TIMEOUT:-900}"'
replacement = r'''attempt=1
while :; do
  push_log="$(mktemp)"
  if kaggle kernels push -p "$STAGE" --accelerator "$ACCELERATOR" -t "${KAGGLE_MALECNS_COUPLED_TIMEOUT:-900}" >"$push_log" 2>&1; then
    cat "$push_log"
    rm -f "$push_log"
    break
  else
    status=$?
  fi
  cat "$push_log" >&2
  if grep -q '429 Client Error: Too Many Requests' "$push_log" && (( attempt < 5 )); then
    delay=$(( attempt * 30 ))
    echo "Kaggle SaveKernel throttled (429); retry $attempt/4 after ${delay}s." >&2
    rm -f "$push_log"
    sleep "$delay"
    attempt=$(( attempt + 1 ))
    continue
  fi
  rm -f "$push_log"
  exit "$status"
done'''
if needle not in text:
    raise SystemExit("expected Kaggle push command not found in base bridge")
p.write_text(text.replace(needle, replacement, 1), encoding="utf-8")
PY
exec bash "$tmp" "$@"
