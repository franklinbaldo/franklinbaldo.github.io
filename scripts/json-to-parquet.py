#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path

import duckdb


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: json-to-parquet.py INPUT.json OUTPUT.parquet", file=sys.stderr)
        return 2

    source = Path(sys.argv[1])
    target = Path(sys.argv[2])
    target.parent.mkdir(parents=True, exist_ok=True)

    con = duckdb.connect()
    relation = con.sql(
        "SELECT * FROM read_json_auto(?, format='array', maximum_object_size=104857600)",
        params=[str(source)],
    )
    relation.write_parquet(str(target), compression="zstd")

    manifest = source.with_name("hronir-manifest.json")
    if manifest.exists():
        data = json.loads(manifest.read_text(encoding="utf-8"))
        data["parquet_bytes"] = target.stat().st_size
        manifest.write_text(
            json.dumps(data, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    print(f"[hronir-data] parquet -> {target} ({target.stat().st_size} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
