#!/usr/bin/env bash
# Create the next Hrönir/Jules session via verne.
#
# Shared by hronir-autopilot.yml and hronir-heartbeat.yml so the session config
# (source, prompt, branch, automation mode) and the fail-fast parsing live in
# exactly one place — no drift between the reactive and the liveness paths.
#
# Requires: `verne` on PATH (see .github/actions/setup-verne) and JULES_API_KEY
# in the environment (verne reads it). The callers gate on the key before this.
set -euo pipefail

REPO="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY not set}"
TITLE="hronir session $(date -u +%Y-%m-%dT%H:%M:%SZ)"

# `set -e` propagates a non-zero exit from verne itself (the workflow then fails
# on verne's own result, as intended). A 0 exit with no id is caught below.
SESSION=$(verne sessions new "$TITLE" \
  --source "sources/github/${REPO}" \
  --prompt-file .github/hronir-session-prompt.md \
  --branch main \
  --automation-mode AUTO_CREATE_PR \
  --json)

# Always log whatever verne returned, success or not.
echo "verne sessions new returned:"
echo "$SESSION"

SESSION_ID=$(echo "$SESSION" | jq -r '.id // (.name | sub("^sessions/"; "")) // empty')
if [ -z "$SESSION_ID" ]; then
  echo "::error::Failed to create Jules session via verne (no id in the response above)."
  exit 1
fi

echo "Created Jules session: $SESSION_ID"
echo "https://jules.google.com/task/$SESSION_ID"
