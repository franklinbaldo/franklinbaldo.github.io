"""Roda Lean de verdade em cada arquivo de lean/ e grava código + saída real
em src/generated/lean.json — é isso que o vídeo mostra na tela."""

import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FILES = ["ParMaisDois.lean", "Festa.lean", "Comutativa.lean", "rejeitado/Obvio.lean"]

out = {"version": subprocess.run(["lean", "--version"], capture_output=True, text=True).stdout.strip()}
for f in FILES:
    p = subprocess.run(["lean", f], cwd=ROOT / "lean", capture_output=True, text=True)
    text = "\n".join(l for l in (p.stdout + p.stderr).splitlines() if "canonicalize" not in l)
    out[f] = {"code": (ROOT / "lean" / f).read_text(), "output": text, "exit": p.returncode}
    print(f, "exit", p.returncode)
(ROOT / "src" / "generated" / "lean.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
