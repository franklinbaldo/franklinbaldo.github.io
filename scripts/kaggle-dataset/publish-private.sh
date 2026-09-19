#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat >&2 <<'EOF'
usage: publish-private.sh --path DIR --slug SLUG --title TITLE --message MESSAGE

Publishes a directory as a private Kaggle Dataset. Creates the dataset on the
first run and versions it on subsequent runs. Requires KAGGLE_USERNAME and the
usual Kaggle CLI credentials in the environment.
EOF
  exit 2
}

PATH_TO_DATA=""
SLUG=""
TITLE=""
MESSAGE=""
LICENSE="${KAGGLE_DATASET_LICENSE:-CC0-1.0}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --path) PATH_TO_DATA="$2"; shift 2 ;;
    --slug) SLUG="$2"; shift 2 ;;
    --title) TITLE="$2"; shift 2 ;;
    --message) MESSAGE="$2"; shift 2 ;;
    --license) LICENSE="$2"; shift 2 ;;
    *) usage ;;
  esac
done

[[ -n "$PATH_TO_DATA" && -d "$PATH_TO_DATA" ]] || usage
[[ -n "$SLUG" && -n "$TITLE" && -n "$MESSAGE" ]] || usage
[[ -n "${KAGGLE_USERNAME:-}" ]] || { echo "KAGGLE_USERNAME is required" >&2; exit 2; }
command -v kaggle >/dev/null || { echo "kaggle CLI not found" >&2; exit 2; }

DATASET_ID="${KAGGLE_USERNAME}/${SLUG}"
METADATA="$PATH_TO_DATA/dataset-metadata.json"

python3 - "$METADATA" "$DATASET_ID" "$TITLE" "$LICENSE" <<'PY'
from pathlib import Path
import json, sys
path = Path(sys.argv[1])
metadata = {
    "title": sys.argv[3],
    "id": sys.argv[2],
    "licenses": [{"name": sys.argv[4]}],
}
path.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
PY

# `kaggle datasets files` is a cheap existence check and works for private
# datasets owned by the authenticated account. Creation is private unless
# `--public` is explicitly passed, which this helper never does.
if kaggle datasets files "$DATASET_ID" >/dev/null 2>&1; then
  echo "versioning private Kaggle Dataset $DATASET_ID"
  kaggle datasets version -p "$PATH_TO_DATA" -m "$MESSAGE" --quiet
else
  echo "creating private Kaggle Dataset $DATASET_ID"
  kaggle datasets create -p "$PATH_TO_DATA" --quiet
fi

echo "published: $DATASET_ID"
