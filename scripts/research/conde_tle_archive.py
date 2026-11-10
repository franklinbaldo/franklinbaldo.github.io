#!/usr/bin/env python3
"""Auditoria de elementos históricos AFSPC/Space-Track de 1963.

Nenhum ajuste orbital: filtragem da tabela original publicada por ano.
A fonte é um espelho terciário de exportação Space-Track.
"""
from __future__ import annotations
import json
import urllib.request
from pathlib import Path

URL = "https://huggingface.co/datasets/juliensimon/space-track-tle-history/resolve/main/data/tle_1963.parquet"
CACHE = Path("tle_1963.parquet")
TARGETS = {527, 528, 529}

def main() -> None:
    import pyarrow.parquet as pq
    if not CACHE.exists():
        urllib.request.urlretrieve(URL, CACHE)
    records = pq.read_table(CACHE).to_pylist()
    matches = sorted(
        (r for r in records if int(r["norad_id"]) in TARGETS),
        key=lambda r: (r["norad_id"], r["epoch"]),
    )
    for obj in sorted(TARGETS):
        rows = [r for r in matches if int(r["norad_id"]) == obj]
        print(f"NORAD {obj}: {len(rows)} elementos no ano 1963", flush=True)
        if rows:
            print(f"  primeiro: {rows[0]['epoch']} / ultimo: {rows[-1]['epoch']}", flush=True)
        if obj == 528:
            for r in rows:
                if str(r["epoch"])[:10] >= "1963-10-01":
                    print("  528:", json.dumps({k: str(v) for k, v in r.items()}, ensure_ascii=False), flush=True)
        if obj in (527, 529):
            for r in rows[-5:]:
                print("  final:", str(r["epoch"]), r.get("mean_motion"), flush=True)
    print("FONTE:", URL, flush=True)
    print("ALERTA: não calcular estado cartesiano a partir de linhas incompletas sem convenção SGP4/TEME.", flush=True)

if __name__ == "__main__":
    main()
