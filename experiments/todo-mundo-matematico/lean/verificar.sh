#!/usr/bin/env sh
# Verifica as provas do vídeo com Lean 4 (núcleo, sem Mathlib).
set -eu
cd "$(dirname "$0")"
lean --version
for f in ParMaisDois.lean Festa.lean Comutativa.lean; do
  if grep -nE '\b(sorry|admit|axiom)\b' "$f"; then
    echo "✗ $f contém sorry/admit/axiom" >&2; exit 1
  fi
  echo "\$ lean $f"
  lean "$f"
  echo "✔ $f compilou"
done
echo "\$ lean rejeitado/Obvio.lean   (tem que falhar)"
if lean rejeitado/Obvio.lean; then
  echo "✗ o fiscal aceitou um 'é óbvio'!" >&2; exit 1
fi
echo "✔ rejeitado/Obvio.lean foi rejeitado, como esperado"
