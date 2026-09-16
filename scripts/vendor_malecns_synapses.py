#!/usr/bin/env python3
"""Materialize auditable MaleCNS v1.0 per-body ROI synapse counts.

Canonical source:
  syn-points-male-cns-v1.0-minconf-0.5.feather
  from the public immutable MaleCNS v1.0 flat-connectome release.

This script deliberately does not query neuPrint. It reads the official bulk
Feather file locally, normalizes the minimal columns needed for classification,
and writes `body_roi_counts.parquet` with:

  bodyId, roi, pre_count, post_count, score

where score = pre_count + post_count.

The raw Feather is large (~12.7 GB), so the implementation processes Arrow IPC
record batches and never materializes the complete point table in Python memory.
Temporary batch aggregates are reduced with DuckDB into the final Parquet file.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import tempfile
from pathlib import Path


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def pick_column(names: list[str], *candidates: str) -> str:
    for candidate in candidates:
        if candidate in names:
            return candidate
    raise SystemExit(
        f"missing required column; expected one of {candidates!r}, got {names!r}"
    )


def normalize_roi_table(pa, pc, batch, body_col: str, kind_col: str, roi_col: str):
    body = batch.column(batch.schema.get_field_index(body_col))
    kind = batch.column(batch.schema.get_field_index(kind_col))
    roi = batch.column(batch.schema.get_field_index(roi_col))

    if pa.types.is_list(roi.type) or pa.types.is_large_list(roi.type):
        parents = pc.list_parent_indices(roi)
        table = pa.table(
            {
                "bodyId": pc.take(body, parents),
                "kind": pc.take(kind, parents),
                "roi": pc.list_flatten(roi),
            }
        )
    else:
        table = pa.table({"bodyId": body, "kind": kind, "roi": roi})

    if not pa.types.is_string(table.schema.field("roi").type):
        table = table.set_column(
            table.schema.get_field_index("roi"),
            "roi",
            pc.cast(table["roi"], pa.string()),
        )
    if not pa.types.is_string(table.schema.field("kind").type):
        table = table.set_column(
            table.schema.get_field_index("kind"),
            "kind",
            pc.cast(table["kind"], pa.string()),
        )

    valid = pc.and_(
        pc.and_(pc.is_valid(table["bodyId"]), pc.is_valid(table["kind"])),
        pc.is_valid(table["roi"]),
    )
    return table.filter(valid)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--syn-points", type=Path, required=True)
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("artifacts/body_roi_counts.parquet"),
    )
    parser.add_argument(
        "--meta",
        type=Path,
        default=None,
        help="defaults to <output>.meta.json",
    )
    parser.add_argument(
        "--keep-temp",
        action="store_true",
        help="retain temporary batch aggregates for debugging",
    )
    args = parser.parse_args()

    try:
        import duckdb
        import pyarrow as pa
        import pyarrow.compute as pc
        import pyarrow.ipc as ipc
        import pyarrow.parquet as pq
    except ImportError as exc:
        raise SystemExit(
            "requires pyarrow and duckdb; e.g. uv run --with pyarrow --with duckdb ..."
        ) from exc

    if not args.syn_points.is_file():
        raise SystemExit(f"syn-points file not found: {args.syn_points}")

    source_sha = sha256_file(args.syn_points)
    temp_root = Path(tempfile.mkdtemp(prefix="malecns-roi-counts-"))
    batch_files: list[Path] = []
    rows_seen = 0

    try:
        with pa.memory_map(str(args.syn_points), "r") as source:
            reader = ipc.open_file(source)
            names = list(reader.schema.names)
            body_col = pick_column(names, "body", "bodyId", "body_id")
            kind_col = pick_column(names, "kind", "type", "synapse_kind")
            roi_col = pick_column(
                names,
                "roi",
                "rois",
                "primary_roi",
                "primaryRoi",
                "primary",
            )

            for batch_index in range(reader.num_record_batches):
                batch = reader.get_batch(batch_index)
                rows_seen += batch.num_rows
                normalized = normalize_roi_table(
                    pa, pc, batch, body_col, kind_col, roi_col
                )
                if normalized.num_rows == 0:
                    continue

                grouped = normalized.group_by(["bodyId", "roi", "kind"]).aggregate(
                    [("kind", "count")]
                )
                path = temp_root / f"batch-{batch_index:06d}.parquet"
                pq.write_table(grouped, path, compression="zstd")
                batch_files.append(path)
                if batch_index % 100 == 0:
                    print(
                        f"processed batch {batch_index + 1}/{reader.num_record_batches} "
                        f"({rows_seen:,} source rows)",
                        flush=True,
                    )

        if not batch_files:
            raise SystemExit("no ROI rows were materialized from the source Feather")

        args.output.parent.mkdir(parents=True, exist_ok=True)
        glob = str(temp_root / "batch-*.parquet").replace("'", "''")
        output_sql = str(args.output).replace("'", "''")
        con = duckdb.connect()
        try:
            con.execute(
                f"""
                COPY (
                  WITH per_kind AS (
                    SELECT
                      CAST(bodyId AS BIGINT) AS bodyId,
                      CAST(roi AS VARCHAR) AS roi,
                      LOWER(CAST(kind AS VARCHAR)) AS kind,
                      SUM(kind_count) AS n
                    FROM read_parquet('{glob}')
                    GROUP BY 1, 2, 3
                  )
                  SELECT
                    bodyId,
                    roi,
                    CAST(SUM(CASE WHEN kind LIKE 'pre%' THEN n ELSE 0 END) AS BIGINT) AS pre_count,
                    CAST(SUM(CASE WHEN kind LIKE 'post%' THEN n ELSE 0 END) AS BIGINT) AS post_count,
                    CAST(SUM(CASE WHEN kind LIKE 'pre%' OR kind LIKE 'post%' THEN n ELSE 0 END) AS BIGINT) AS score
                  FROM per_kind
                  GROUP BY bodyId, roi
                  ORDER BY bodyId, roi
                ) TO '{output_sql}' (FORMAT PARQUET, COMPRESSION ZSTD)
                """
            )
            output_rows = con.execute(
                f"SELECT count(*) FROM read_parquet('{output_sql}')"
            ).fetchone()[0]
        finally:
            con.close()

        meta_path = args.meta or args.output.with_suffix(args.output.suffix + ".meta.json")
        meta = {
            "format": "flydoom/malecns-body-roi-counts-v1",
            "source": {
                "dataset": "MaleCNS v1.0",
                "file": args.syn_points.name,
                "sha256": source_sha,
                "url": (
                    "https://storage.googleapis.com/flyem-male-cns/v1.0/"
                    "connectome-data/flat-connectome/"
                    "syn-points-male-cns-v1.0-minconf-0.5.feather"
                ),
            },
            "source_rows": rows_seen,
            "output_rows": int(output_rows),
            "output": str(args.output),
            "output_sha256": sha256_file(args.output),
            "columns": ["bodyId", "roi", "pre_count", "post_count", "score"],
            "score_definition": "pre_count + post_count",
            "acquisition": "official public bulk Feather; no neuPrint dependency",
        }
        meta_path.parent.mkdir(parents=True, exist_ok=True)
        meta_path.write_text(json.dumps(meta, indent=2, sort_keys=True) + "\n")
        print(json.dumps(meta, indent=2, sort_keys=True))
    finally:
        if args.keep_temp:
            print(f"temporary aggregates retained at {temp_root}", flush=True)
        else:
            shutil.rmtree(temp_root, ignore_errors=True)


if __name__ == "__main__":
    main()
