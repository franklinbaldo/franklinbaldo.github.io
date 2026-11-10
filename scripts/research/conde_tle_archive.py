#!/usr/bin/env python3
"""Auditoria verificável de registros históricos TLE 1963.

Objetivo: recuperar TODOS os registros de 527/528/529, mantendo fonte,
época, duplicatas e divergências. Não converter TLE em posição.
Requer pyarrow. Não pressupõe que o acervo original seja acessível.
"""
from __future__ import annotations
import hashlib
import json
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

SOURCES = [
    "https://huggingface.co/datasets/juliensimon/space-track-tle-history/resolve/main/data/tle_1963.parquet",
    "https://huggingface.co/datasets/oxzoid/space-track-tle-history/resolve/main/data/tle_1963.parquet",
]
CACHE = Path("tle_1963.parquet")
TARGETS = {527, 528, 529}
START = datetime(1963, 10, 27, tzinfo=timezone.utc)
END = datetime(1963, 11, 9, tzinfo=timezone.utc)

def fetch() -> tuple[Path, str, str]:
    failures = []
    for url in SOURCES:
        try:
            with urllib.request.urlopen(
                urllib.request.Request(url, headers={"User-Agent": "CondeHistoricalTLEAudit/1.0"}),
                timeout=30
            ) as response, CACHE.open("wb") as dest:
                import shutil
                shutil.copyfileobj(response, dest)
            digest = hashlib.sha256(CACHE.read_bytes()).hexdigest()
            return CACHE, url, digest
        except Exception as exc:
            failures.append(f"{url}: {type(exc).__name__}: {exc}")
            CACHE.unlink(missing_ok=True)
    raise RuntimeError("Nenhum espelho acessível. " + " | ".join(failures))

def normalized_epoch(value: object) -> datetime:
    if isinstance(value, datetime):
        return value.replace(tzinfo=value.tzinfo or timezone.utc).astimezone(timezone.utc)
    return datetime.fromisoformat(str(value).replace("Z", "+00:00")).astimezone(timezone.utc)

def main() -> None:
    import pyarrow.parquet as pq
    path, source, digest = fetch()
    table = pq.read_table(path)
    required = {"norad_id", "epoch", "inclination", "raan", "eccentricity",
                "arg_perigee", "mean_anomaly", "mean_motion", "bstar"}
    missing = required - set(table.column_names)
    if missing:
        raise RuntimeError(f"Arquivo sem colunas obrigatórias: {sorted(missing)}")
    subset = table.filter(__import__("pyarrow").compute.is_in(
        table["norad_id"], value_set=__import__("pyarrow").array(sorted(TARGETS))
    ))
    rows = subset.to_pylist()
    rows.sort(key=lambda r: (r["norad_id"], normalized_epoch(r["epoch"])))
    result = {
        "provenance": {"url": source, "sha256": digest,
                       "status": "mirror_data_not_independently_authenticated"},
        "objects": {}
    }
    for target in sorted(TARGETS):
        obj = [r for r in rows if int(r["norad_id"]) == target]
        records = []
        for r in obj:
            records.append({k: str(v) for k, v in r.items()})
        in_window = [
            r for r in obj if target == 528 and
            START <= normalized_epoch(r["epoch"]) < END
        ]
        result["objects"][str(target)] = {
            "count": len(obj),
            "first_epoch": str(obj[0]["epoch"]) if obj else None,
            "last_epoch": str(obj[-1]["epoch"]) if obj else None,
            "records_in_528_window": len(in_window),
            "records": records,
        }
        print(f"NORAD {target}: {len(obj)} registros. "
              f"Primeiro={result['objects'][str(target)]['first_epoch']} "
              f"Último={result['objects'][str(target)]['last_epoch']}")
        if target == 528:
            print("528 entre 27/10 e 08/11: ", len(in_window))
            for r in in_window:
                print(" ", r["epoch"], "n=", r["mean_motion"],
                      "BSTAR=", r["bstar"])
    out = Path("conde_tle_1963_audit.json")
    out.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Fonte: {source}; sha256={digest}; saída: {out}")
    print("ATENÇÃO: nenhum desses registros equivale a posição geográfica de reentrada.")

if __name__ == "__main__":
    main()
