#!/usr/bin/env bash
set -euo pipefail

PREFIX="workspace/adibaldo.github.io"
REMOTE="adibaldo"
BRANCH="main"

cmd="${1:-help}"

case "$cmd" in
  pull)
    git fetch "$REMOTE"
    git subtree pull --prefix="$PREFIX" "$REMOTE" "$BRANCH" --squash
    ;;
  push)
    git subtree push --prefix="$PREFIX" "$REMOTE" "$BRANCH"
    ;;
  split)
    git subtree split --prefix="$PREFIX"
    ;;
  help|*)
    echo "Uso: $0 {pull|push|split}"
    ;;
esac
