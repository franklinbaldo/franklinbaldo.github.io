#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["pyarrow==21.0.0"]
# ///
"""Materialize an Equation Atlas adapter JSONL stream as canonical Parquet."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import sys
from typing import Any, Iterable

import pyarrow as pa
import pyarrow.parquet as pq

SCHEMA_VERSION = 1
DEFAULT_ROWS_PER_SHARD = 250_000
HEX_64 = re.compile(r"^[0-9a-f]{64}$")

PARQUET_SCHEMA = pa.schema([
    pa.field("occurrence_id", pa.string(), nullable=False),
    pa.field("source_id", pa.string(), nullable=False),
    pa.field("source_snapshot", pa.string(), nullable=False),
    pa.field("source_document_id", pa.string()),
    pa.field("source_locator", pa.string()),
    pa.field("source_url", pa.string()),
    pa.field("source_license", pa.string()),
    pa.field("source_license_url", pa.string()),
    pa.field("source_policy_url", pa.string()),
    pa.field("provenance_class", pa.string(), nullable=False),
    pa.field("original_expression", pa.string(), nullable=False),
    pa.field("original_encoding", pa.string(), nullable=False),
    pa.field("source_record_sha256", pa.string(), nullable=False),
    pa.field("original_text_sha256", pa.string(), nullable=False),
    pa.field("normalized_text_sha256", pa.string()),
    pa.field("source_payload_json", pa.string(), nullable=False),
])


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_text(value: str) -> str:
    return sha256_bytes(value.encode("utf-8"))


def canonical_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def first_nonempty(row: dict[str, Any], *keys: str) -> str | None:
    for key in keys:
        value = row.get(key)
        if value is None:
            continue
        text = str(value)
        if text:
            return text
    return None


def normalize_occurrence(row: dict[str, Any], *, expected_source: str | None, expected_snapshot: str | None) -> dict[str, str | None]:
    source_id = first_nonempty(row, "source_id")
    source_snapshot = first_nonempty(row, "source_snapshot")
    original_expression = row.get("original_expression")
    original_encoding = first_nonempty(row, "original_encoding")
    provenance_class = first_nonempty(row, "provenance_class")

    if not source_id:
        raise ValueError("missing source_id")
    if not source_snapshot:
        raise ValueError("missing source_snapshot")
    if expected_source and source_id != expected_source:
        raise ValueError(f"source_id {source_id!r} != expected {expected_source!r}")
    if expected_snapshot and source_snapshot != expected_snapshot:
        raise ValueError(f"source_snapshot {source_snapshot!r} != expected {expected_snapshot!r}")
    if provenance_class not in {"attested", "reconstructed"}:
        raise ValueError("provenance_class must be attested or reconstructed")
    if not isinstance(original_expression, str) or original_expression == "":
        raise ValueError("original_expression must be a non-empty string")
    if not original_encoding:
        raise ValueError("missing original_encoding")

    source_record_sha256 = first_nonempty(row, "source_record_sha256", "source_statement_sha256")
    if not source_record_sha256:
        source_record_sha256 = sha256_text(canonical_json(row))
    if not HEX_64.match(source_record_sha256):
        raise ValueError("source record checksum must be a lowercase SHA-256 hex digest")

    original_text_sha256 = first_nonempty(row, "original_text_sha256") or sha256_text(original_expression)
    if not HEX_64.match(original_text_sha256):
        raise ValueError("original_text_sha256 must be a lowercase SHA-256 hex digest")

    normalized_text_sha256 = first_nonempty(row, "normalized_text_sha256")
    if normalized_text_sha256 and not HEX_64.match(normalized_text_sha256):
        raise ValueError("normalized_text_sha256 must be a lowercase SHA-256 hex digest")

    source_document_id = first_nonempty(row, "source_document_id", "source_entity_id")
    source_locator = first_nonempty(row, "source_locator", "source_record_url", "source_statement_id")
    if not source_locator:
        source_path = first_nonempty(row, "source_path")
        source_line = row.get("source_line")
        if source_path:
            source_locator = f"{source_path}#L{source_line}" if source_line else source_path

    occurrence_seed = "\n".join([source_id, source_snapshot, source_record_sha256, source_locator or "", source_document_id or ""])

    return {
        "occurrence_id": sha256_text(occurrence_seed),
        "source_id": source_id,
        "source_snapshot": source_snapshot,
        "source_document_id": source_document_id,
        "source_locator": source_locator,
        "source_url": first_nonempty(row, "source_url", "source_repository", "source_document_url"),
        "source_license": first_nonempty(row, "source_license"),
        "source_license_url": first_nonempty(row, "source_license_url"),
        "source_policy_url": first_nonempty(row, "source_policy_url"),
        "provenance_class": provenance_class,
        "original_expression": original_expression,
        "original_encoding": original_encoding,
        "source_record_sha256": source_record_sha256,
        "original_text_sha256": original_text_sha256,
        "normalized_text_sha256": normalized_text_sha256,
        "source_payload_json": canonical_json(row),
    }


def read_jsonl(path: str) -> Iterable[tuple[int, dict[str, Any]]]:
    handle = sys.stdin if path == "-" else open(path, "r", encoding="utf-8")
    close = handle is not sys.stdin
    try:
        for line_number, line in enumerate(handle, start=1):
            if not line.strip():
                continue
            value = json.loads(line)
            if not isinstance(value, dict):
                raise ValueError(f"line {line_number}: expected JSON object")
            yield line_number, value
    finally:
        if close:
            handle.close()


def safe_slug(value: str) -> str:
    slug = re.sub(r"[^A-Za-z0-9._-]+", "-", value).strip("-.")
    if not slug:
        raise ValueError("value cannot be converted to a non-empty identifier")
    return slug.lower()


def file_digest(path: Path) -> dict[str, Any]:
    sha256 = hashlib.sha256()
    md5 = hashlib.md5(usedforsecurity=False)
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            sha256.update(chunk)
            md5.update(chunk)
    return {"bytes": path.stat().st_size, "sha256": sha256.hexdigest(), "md5": md5.hexdigest()}


def write_shard(rows: list[dict[str, str | None]], path: Path) -> None:
    table = pa.Table.from_pylist(rows, schema=PARQUET_SCHEMA)
    pq.write_table(table, path, compression="zstd", use_dictionary=True, write_statistics=True, version="2.6")


def materialize(args: argparse.Namespace) -> dict[str, Any]:
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    source_slug = safe_slug(args.source)
    snapshot_slug = safe_slug(args.snapshot)
    rows: list[dict[str, str | None]] = []
    shards: list[dict[str, Any]] = []
    total_rows = 0
    rejected_rows = 0

    def flush() -> None:
        nonlocal rows, total_rows
        if not rows:
            return
        index = len(shards)
        filename = f"{source_slug}--{snapshot_slug}--{args.stage}--{index:05d}.parquet"
        path = output_dir / filename
        write_shard(rows, path)
        digest = file_digest(path)
        shards.append({"file": filename, "rows": len(rows), **digest})
        total_rows += len(rows)
        rows = []

    for line_number, source_row in read_jsonl(args.input):
        try:
            rows.append(normalize_occurrence(source_row, expected_source=args.source, expected_snapshot=args.snapshot))
        except (TypeError, ValueError) as exc:
            rejected_rows += 1
            if not args.allow_rejects:
                raise ValueError(f"line {line_number}: {exc}") from exc
        if len(rows) >= args.rows_per_shard:
            flush()
    flush()

    if total_rows == 0:
        raise ValueError("refusing to materialize an empty Parquet dataset")

    manifest = {
        "manifest_schema_version": 1,
        "occurrence_schema_version": SCHEMA_VERSION,
        "source_id": args.source,
        "source_snapshot": args.snapshot,
        "stage": args.stage,
        "format": "parquet",
        "compression": "zstd",
        "rows_per_shard_target": args.rows_per_shard,
        "total_rows": total_rows,
        "rejected_rows": rejected_rows,
        "shards": shards,
        "internet_archive": {
            "identifier": args.archive_identifier or f"scientific-equation-atlas-{source_slug}-{snapshot_slug}",
            "published": False,
        },
    }
    manifest_path = output_dir / f"manifest-{args.stage}.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return manifest


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="-", help="adapter JSONL file or - for stdin")
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--source", required=True)
    parser.add_argument("--snapshot", required=True)
    parser.add_argument("--rows-per-shard", type=int, default=DEFAULT_ROWS_PER_SHARD)
    parser.add_argument("--archive-identifier")
    parser.add_argument("--stage", choices=["extracted", "normalized", "deduplicated"], default="extracted")
    parser.add_argument("--allow-rejects", action="store_true")
    args = parser.parse_args()
    if args.rows_per_shard < 1:
        parser.error("--rows-per-shard must be positive")
    return args


def main() -> None:
    manifest = materialize(parse_args())
    print(json.dumps(manifest, sort_keys=True))


if __name__ == "__main__":
    main()
